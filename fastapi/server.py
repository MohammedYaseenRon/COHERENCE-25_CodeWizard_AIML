import asyncio
import os
import pathlib
import websockets
import tempfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from google import genai
from dotenv import load_dotenv
import json
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ranker import ResumeRankingService
from helpers.FileHandler import FileUploadHandler
import aiofiles
from fastapi.responses import JSONResponse
from mailer import EmailGenerator

# Load environment variables
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class JobDescriptionRequest(BaseModel):
    job_description: str
    resumes_file: str = "resume_analysis_results.json"

class ContactInfo(BaseModel):
    full_name: str = Field(..., description="Full name of the candidate")
    email: str = Field(..., description="Professional email address")
    phone: Optional[str] = Field(None, description="Phone number with country code")
    location: Optional[str] = Field(None, description="City, State, Country")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    website: Optional[str] = Field(None, description="Personal website or portfolio URL")

class Education(BaseModel):
    degree: str = Field(..., description="Degree or certification name")
    institution: str = Field(..., description="Name of educational institution")
    graduation_year: int = Field(..., description="Year of graduation")
    gpa: Optional[float] = Field(None, description="GPA if available")
    honors: Optional[List[str]] = Field(None, description="Academic honors or awards")

class WorkExperience(BaseModel):
    company: str = Field(..., description="Company or organization name")
    job_title: str = Field(..., description="Job title or position")
    start_date: str = Field(..., description="Start date of employment")
    end_date: Optional[str] = Field(None, description="End date of employment (leave blank if current job)")
    responsibilities: List[str] = Field(..., description="Key responsibilities and achievements")
    technologies: Optional[List[str]] = Field(None, description="Technologies or tools used")

class Skills(BaseModel):
    technical_skills: List[str] = Field(..., description="Technical skills and programming languages")
    soft_skills: Optional[List[str]] = Field(None, description="Soft skills and interpersonal abilities")
    certifications: Optional[List[str]] = Field(None, description="Professional certifications")

class Achievements(BaseModel):
    professional_awards: Optional[List[str]] = Field(None, description="Professional awards and recognitions")
    publications: Optional[List[str]] = Field(None, description="Academic or professional publications")
    conference_presentations: Optional[List[str]] = Field(None, description="Conference talks or presentations")
    patents: Optional[List[str]] = Field(None, description="Patents or inventions")
    volunteer_work: Optional[List[str]] = Field(None, description="Significant volunteer contributions")
    leadership_roles: Optional[List[str]] = Field(None, description="Leadership positions held")
    community_involvement: Optional[List[str]] = Field(None, description="Community and social impact activities")

class Project(BaseModel):
    name: str = Field(..., description="Project name")
    description: str = Field(..., description="Project description")
    technologies: Optional[List[str]] = Field(None, description="Technologies used")
    start_date: Optional[str] = Field(None, description="Project start date")
    end_date: Optional[str] = Field(None, description="Project end date")
    link: Optional[str] = Field(None, description="Project link or repository")

class ResumeProfile(BaseModel):
    contact_info: ContactInfo = Field(..., description="Candidate's contact information")
    education: List[Education] = Field(..., description="Educational background")
    work_experience: List[WorkExperience] = Field(..., description="Professional work history")
    skills: Skills = Field(..., description="Technical and soft skills")
    summary: Optional[str] = Field(None, description="Professional summary or objective")
    projects: Optional[List[Project]] = Field(None, description="Notable projects")
    achievements: Optional[Achievements] = Field(None, description="Professional and personal achievements")

class SelectedPersonnel(BaseModel):
    resume_id: str = Field(..., description="Unique identifier for the resume")
    profile: Dict[str, Any] = Field(..., description="The complete resume profile in JSON format")
    selection_reason: Optional[str] = Field(None, description="Reason for selection")
    selection_date: str = Field(..., description="Date when the candidate was selected")
# Updated bias analysis request model
class BiasAnalysisRequest(BaseModel):
    job_title: str = Field(..., description="Job title for which bias analysis is needed")
    job_description: str = Field(..., description="Complete job description")
    analysis_types: List[str] = Field(
        default=["gender", "age", "ethnicity", "education", "experience"],
        description="Types of biases to analyze"
    )

    class Config:
        extra = "allow"

def clean_json_response(text: str) -> dict:
    """
    Removes markdown formatting ('''json ... ''') from the response and parses it as JSON.
    """
    # Remove starting markdown fence if it exists
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    # Remove ending markdown fence if it exists
    if text.endswith("```"):
        text = text[:-3].strip()
    return json.loads(text)

class ResumeAnalysisServer:
    def __init__(self, results_file='resume_analysis_results.json'):
        load_dotenv()
        self.app = app
        self.setup_routes()

        self.results_file = results_file
        self.load_results()

    def load_results(self):
        """
        Load existing results from JSON file or create a new empty dictionary
        """
        try:
            with open(self.results_file, 'r') as f:
                self.analysis_results = json.load(f)
        except FileNotFoundError:
            self.analysis_results = {}

    def save_results(self):
        """
        Save current analysis results to JSON file
        """
        with open(self.results_file, 'w') as f:
            json.dump(self.analysis_results, f, indent=2)

    def update_results(self, filename, resume_data):
        """
        Update results dictionary and save to file
        """
        self.analysis_results[filename] = resume_data
        self.save_results()

    def setup_routes(self):
        @self.app.websocket("/resume-analyze")
        async def websocket_resume_endpoint(websocket: WebSocket):
            await websocket.accept()
            
            try:
                # Receive file metadata
                file_metadata = await websocket.receive_json()
                filename = file_metadata.get('filename', 'uploaded_resume.pdf')
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    # Receive file chunks
                    while True:
                        file_chunk = await websocket.receive_bytes()
                        if file_chunk == b'EOF':
                            break
                        temp_file.write(file_chunk)
                
                try:
                    # Analyze resume using Gemini
                    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
                    file_path = pathlib.Path(temp_file.name)
                    
                    # Upload file to Gemini
                    sample_file = client.files.upload(file=file_path)
                    
                    # Detailed prompt for comprehensive analysis
                    prompt = """
                    Perform a COMPREHENSIVE analysis of this resume.
                    CRITICAL INSTRUCTIONS:
                    1. Extract EVERY single detail from the document
                    2. Do NOT skip or summarize - provide FULL information
                    3. If any section is incomplete, explicitly state what's missing
                    4. Ensure maximum detail and precision
                    
                    Extraction Depth:
                    - Contact Info: Full details
                    - Education: Complete academic history
                    - Work Experience: Detailed role descriptions
                    - Skills: Exhaustive technical and soft skills
                    - Projects: All notable projects
                    - Certifications: Complete list
                    - Achievements: All awards, publications, etc.
                    - Summary: A brief overview of the candidate's profile
                    """
                    
                    # Generate content with JSON schema
                    response = client.models.generate_content(
                        model='gemini-2.5-pro-exp-03-25',
                        contents=[sample_file, prompt],
                        config={
                            'response_mime_type': 'application/json',
                            'response_schema': ResumeProfile,
                        },
                    )
                    
                    # Send detailed resume analysis
                    await websocket.send_text(json.dumps(response.parsed.model_dump(), indent=2))
                
                except Exception as e:
                    await websocket.send_text(f"Error processing resume: {str(e)}")
                
                finally:
                    # Clean up temporary file
                    os.unlink(temp_file.name)
            
            except WebSocketDisconnect:
                print("WebSocket connection closed")
            except Exception as e:
                print(f"Unexpected error: {e}")
                await websocket.send_text(f"Unexpected error: {str(e)}")

        @self.app.websocket("/multi-upload")
        async def multi_file_upload_endpoint(websocket: WebSocket):
            await websocket.accept()
            file_handler = FileUploadHandler()
            
            try:
                # Receive initial metadata about file upload
                file_metadata = await websocket.receive_json()
                num_files = file_metadata.get('num_files', 1)
                
                # Process multiple files
                for i in range(num_files):
                    await websocket.send_text(f"Processing file {i + 1} of {num_files}")
                    # Receive file metadata for each file
                    current_file_metadata = await websocket.receive_json()
                    filename = current_file_metadata.get('filename', f'uploaded_file_{i}.pdf')
                    
                    # Prepare file path
                    destination_path, safe_filename = await file_handler.save_uploaded_file(filename)
                    
                    # Asynchronously save the file
                    async with aiofiles.open(destination_path, 'wb') as dest_file:
                        # Receive file chunks
                        while True:
                            file_chunk = await websocket.receive_bytes()
                            if file_chunk == b'EOF':
                                break
                            await dest_file.write(file_chunk)
                    
                    try:
                        # Upload file to Gemini
                        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
                        file_path = pathlib.Path(destination_path)
                        
                        # Upload the file to Gemini
                        sample_file = client.files.upload(file=file_path)
                        
                        # Detailed prompt for comprehensive analysis
                        prompt = """
                        Perform a COMPREHENSIVE analysis of this resume.
                        CRITICAL INSTRUCTIONS:
                        1. Extract EVERY single detail from the document
                        2. Do NOT skip or summarize - provide FULL information
                        3. If any section is incomplete, explicitly state what's missing
                        4. Ensure maximum detail and precision
                        
                        Extraction Depth:
                        - Contact Info: Full details
                        - Education: Complete academic history
                        - Work Experience: Detailed role descriptions
                        - Skills: Exhaustive technical and soft skills
                        - Projects: All notable projects
                        - Certifications: Complete list
                        """
                        
                        # Generate content with JSON schema
                        response = client.models.generate_content(
                            model='gemini-2.5-pro-exp-03-25',
                            contents=[sample_file, prompt],
                            config={
                                'response_mime_type': 'application/json',
                                'response_schema': ResumeProfile,
                            },
                        )
                        
                        # Get parsed data and update results
                        resume_data = response.parsed.model_dump()
                        self.update_results(safe_filename, resume_data)
                        
                    except Exception as e:
                        error_data = {
                            "error": f"Error processing file: {str(e)}"
                        }
                        self.update_results(safe_filename, error_data)
                
                # Send compiled results
                await websocket.send_text(json.dumps(self.analysis_results, indent=2))
            
            except WebSocketDisconnect:
                print("WebSocket connection closed")
            except Exception as e:
                print(f"Unexpected error: {e}")
                await websocket.send_text(f"Unexpected error: {str(e)}")

        @self.app.options("/rank-resumes")
        async def options_rank_resumes():
            return JSONResponse(
                status_code=200, 
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                },
                content={"message": "OK"}
            )

        @self.app.post("/rank-resumes")
        async def rank_resumes(request: JobDescriptionRequest):
            """
            Endpoint to rank resumes against a job description
            """
            ranking_service = ResumeRankingService()
            # Load resumes from file
            resumes = ranking_service.load_resumes(request.resumes_file)
            if not resumes:
                resumes = "resume_analysis_results.json"

            # First try Gemini-based ranking
            try:
                gemini_ranked_resumes = await ranking_service.rank_resumes_with_gemini(
                    request.job_description, 
                    resumes
                )
                return {
                    "ranking_method": "Gemini AI",
                    "ranked_resumes": gemini_ranked_resumes
                }
            except Exception as e:
                # Fallback to cosine similarity if Gemini ranking fails
                print(f"Gemini ranking failed: {e}. Falling back to cosine similarity.")
                cosine_ranked_resumes = ranking_service.rank_resumes_with_cosine_similarity(
                    request.job_description, 
                    resumes
                )
                return {
                    "ranking_method": "Cosine Similarity",
                    "ranked_resumes": cosine_ranked_resumes
                }
        
        @self.app.post("/selected-personnel/upload")
        async def upload_selected_personnel(personnel: SelectedPersonnel):
            """
            Endpoint to upload a selected personnel's resume to the selected candidates pool
            """
            try:
                # Load existing selected personnel
                selected_file = "selected_personnel.json"
                try:
                    with open(selected_file, 'r') as f:
                        selected_personnel = json.load(f)
                except FileNotFoundError:
                    selected_personnel = {}
                
                # Add or update the selected personnel
                selected_personnel[personnel.resume_id] = personnel.model_dump()
                
                # Save updated selection
                with open(selected_file, 'w') as f:
                    json.dump(selected_personnel, f, indent=2)
                
                return {"status": "success", "message": f"Personnel with ID {personnel.resume_id} added to selected pool"}
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error uploading selected personnel: {str(e)}")
        
        @self.app.get("/selected-personnel")
        async def get_selected_personnel():
            """
            Endpoint to retrieve all selected personnel
            """
            try:
                selected_file = "selected_personnel.json"
                try:
                    with open(selected_file, 'r') as f:
                        selected_personnel = json.load(f)
                except FileNotFoundError:
                    selected_personnel = {}
                
                return selected_personnel
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error retrieving selected personnel: {str(e)}")
        
        @self.app.post("/bias-analysis")
        async def analyze_bias(request: BiasAnalysisRequest):
            """
            Endpoint to analyze potential biases in the selection process using Gemini
            """
            try:
                # Load selected personnel
                selected_file = "selected_personnel.json"
                try:
                    with open(selected_file, 'r') as f:
                        selected_personnel = json.load(f)
                except FileNotFoundError:
                    raise HTTPException(status_code=404, detail="No selected personnel found for analysis")
                
                # Prepare data for Gemini - extract profiles from numbered keys
                # Your JSON structure uses numerical keys as the top level
                selected_profiles = []
                for key in selected_personnel:
                    if "profile" in selected_personnel[key]:
                        selected_profiles.append(selected_personnel[key]["profile"])
                
                # Prepare additional context from selection metadata
                selection_metadata = []
                for key in selected_personnel:
                    if "selection_reason" in selected_personnel[key]:
                        selection_metadata.append({
                            "resume_id": selected_personnel[key].get("resume_id", key),
                            "selection_reason": selected_personnel[key].get("selection_reason", "Unknown"),
                            "selection_date": selected_personnel[key].get("selection_date", "Unknown")
                        })
                
                # Initialize Gemini client
                client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
                
                # Create a prompt for bias analysis
                prompt = f"""
                Analyze the following set of selected candidate profiles for a {request.job_title} position 
                for potential biases. The job description is:
                
                "{request.job_description}"
                
                Return your analysis in the following JSON structure ONLY:
                {{
                    "summary": "Overall summary of the bias analysis",
                    "fairness_score": 7.5, // A score from 1-10
                    "bias_metrics": {{
                        "gender": {{
                            "representation": {{
                                "male": 65,
                                "female": 30,
                                "other": 5
                            }},
                            "industry_benchmark": {{
                                "male": 60,
                                "female": 35,
                                "other": 5
                            }},
                            "findings": "Description of gender-related patterns or imbalances",
                            "recommendations": "Suggestions to improve gender diversity"
                        }},
                        // Repeat this structure for each requested analysis type
                    }},
                    "recommendations": [
                        "Recommendation 1",
                        "Recommendation 2",
                        "Recommendation 3"
                    ]
                }}

                Ensure your analysis covers these requested bias categories: {', '.join(request.analysis_types)}

                
                For each category:
                1. Identify any patterns or imbalances in the selected candidates
                2. Quantify the representation (e.g., percentages, ratios)
                3. Compare against industry standards or expected distributions
                4. Suggest improvements to reduce unintentional bias
                5. Provide a summary of the analysis and a fairness score from 1-10
                
                Ensure that the analysis is data-driven and based on the provided profiles.
                
                IMPORTANT: Be objective, data-driven, and fair in your analysis. Do not make assumptions 
                beyond what's in the data. If certain information is not available for some candidates, 
                note that in your analysis as a potential source of bias itself.
                """
                
                # Send request to Gemini with both profiles and selection metadata
                analysis_content = {
                    "profiles": selected_profiles,
                    "selection_metadata": selection_metadata,
                    "job_title": request.job_title,
                    "job_description": request.job_description,
                    "analysis_types": request.analysis_types
                }
                
                # Send request to Gemini
                response = client.models.generate_content(
                    model="gemini-2.5-pro-exp-03-25",
                    contents=prompt + "\n\nAnalysis Data: " + json.dumps(analysis_content),
                    config={'response_mime_type': 'application/json'}
                )
                
                # Parse and return the response
                bias_analysis = clean_json_response(response.text)
                return bias_analysis
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error analyzing bias: {str(e)}")
        @self.app.post("/send-email/individual")
        async def send_individual_email(request: dict = Body(...)):
            """
            Endpoint to send an email to a single candidate from ranked resumes
            """
            try:
                ranked_resumes = request.get("ranked_resumes", [])
                if not ranked_resumes:
                    raise HTTPException(status_code=400, detail="No ranked resumes provided")

                candidate_index = request.get("candidate_index")
                if candidate_index is None or not (0 <= candidate_index < len(ranked_resumes)):
                    raise HTTPException(status_code=400, detail="Invalid candidate index")

                sender_email = request.get("sender_email")
                password = request.get("password")
                if not sender_email or not password:
                    raise HTTPException(status_code=400, detail="Sender email and password are required")

                candidate_data = ranked_resumes[candidate_index]
                candidate_profile = candidate_data.get("full_resume")
                if not candidate_profile or "email" not in candidate_profile["contact_info"]:
                    raise HTTPException(status_code=400, detail="Candidate profile or email not available")

                # Initialize email generator
                email_gen = EmailGenerator()
                load_dotenv()
                email_gen.initialize_gemini(os.getenv("GOOGLE_API_KEY"))

                # Send personalized email
                success = email_gen.send_assignment_email(
                    sender_email=sender_email,
                    receiver_email=candidate_profile["contact_info"]["email"],
                    password=password,
                    candidate_profile=candidate_profile,
                    job_description=request.get("job_description"),
                    project_options=request.get("project_options"),
                    company_info=request.get("company_info")
                )

                if success:
                    return {
                        "status": "success",
                        "message": f"Email sent successfully to {candidate_profile['contact_info']['full_name']}"
                    }
                else:
                    raise HTTPException(status_code=500, detail="Failed to send email")

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error sending individual email: {str(e)}")

        @self.app.post("/send-email/bulk")
        async def send_bulk_emails(request: dict = Body(...)):
            """
            Endpoint to send emails to all candidates from ranked resumes
            """
            try:
                ranked_resumes = request.get("ranked_resumes", [])
                if not ranked_resumes:
                    raise HTTPException(status_code=400, detail="No ranked resumes provided")

                sender_email = request.get("sender_email")
                if not sender_email:
                    sender_email = os.getenv("SENDER_EMAIL")

                password = request.get("password")
                if not password:
                    password = os.getenv("SENDER_PASSWORD")

                # Initialize email generator
                email_gen = EmailGenerator()
                load_dotenv()
                email_gen.initialize_gemini(os.getenv("GOOGLE_API_KEY"))

                results = {}
                for idx, candidate_data in enumerate(ranked_resumes):
                    candidate_profile = candidate_data.get("full_resume")
                    if not candidate_profile or "email" not in candidate_profile["contact_info"]:
                        results[f"candidate_{idx}"] = {
                            "status": "failed",
                            "message": "Missing profile or email"
                        }
                        continue

                    success = email_gen.send_assignment_email(
                        sender_email=sender_email,
                        receiver_email=candidate_profile["contact_info"]["email"],
                        password=password,
                        candidate_profile=candidate_profile,
                        job_description=request.get("job_description"),
                        project_options=request.get("project_options"),
                        company_info=request.get("company_info")
                    )

                    results[f"candidate_{idx}"] = {
                        "status": "success" if success else "failed",
                        "message": f"Email {'sent successfully' if success else 'failed to send'} to {candidate_profile['contact_info']['full_name']}"
                    }

                successful_sends = sum(1 for r in results.values() if r["status"] == "success")
                total_candidates = len(ranked_resumes)

                return {
                    "status": "completed",
                    "summary": f"Sent emails to {successful_sends} out of {total_candidates} candidates",
                    "detailed_results": results
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error sending bulk emails: {str(e)}")
            
    def run(self):
        import uvicorn
        uvicorn.run(self.app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    server = ResumeAnalysisServer()
    server.run()