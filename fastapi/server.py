import asyncio
import os
import pathlib
import websockets
import tempfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from google import genai
from dotenv import load_dotenv
import json
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ranker import ResumeRankingService
from helpers.FileHandler import FileUploadHandler
import aiofiles
from fastapi.responses import JSONResponse

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

class Achievements(BaseModel):
    professional_awards: Optional[List[str]] = Field(None, description="Professional awards and recognitions")
    publications: Optional[List[str]] = Field(None, description="Academic or professional publications")
    conference_presentations: Optional[List[str]] = Field(None, description="Conference talks or presentations")
    patents: Optional[List[str]] = Field(None, description="Patents or inventions")
    volunteer_work: Optional[List[str]] = Field(None, description="Significant volunteer contributions")
    leadership_roles: Optional[List[str]] = Field(None, description="Leadership positions held")
    community_involvement: Optional[List[str]] = Field(None, description="Community and social impact activities")

class ResumeProfile(BaseModel):
    contact_info: ContactInfo = Field(..., description="Candidate's contact information")
    education: List[Education] = Field(..., description="Educational background")
    work_experience: List[WorkExperience] = Field(..., description="Professional work history")
    skills: Skills = Field(..., description="Technical and soft skills")
    summary: Optional[str] = Field(None, description="Professional summary or objective")
    projects: Optional[List[Project]] = Field(None, description="Notable projects")
    achievements: Optional[Achievements] = Field(None, description="Professional and personal achievements")

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

@app.websocket("/upload")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        file_metadata = await websocket.receive_json()
        filename = file_metadata.get('filename', 'uploaded_file.pdf')
        
        # Create a temporary file to save the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            # Receive file chunks
            while True:
                file_chunk = await websocket.receive_bytes()
                if file_chunk == b'EOF':
                    break
                temp_file.write(file_chunk)
        
        # Upload file to Gemini
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        file_path = pathlib.Path(temp_file.name)
        
        try:
            # Upload the file to Gemini
            sample_file = client.files.upload(file=file_path)
            
            # Generate summary
            prompt = "Summarize this document"
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[sample_file, prompt]
            )
            
            cleaned_response = response.text
            if cleaned_response.startswith("```json"):
                try:
                    json_obj = clean_json_response(cleaned_response)
                    cleaned_response = json.dumps(json_obj, indent=2)
                except Exception as e:
                    cleaned_response = f"Error cleaning JSON: {str(e)}"
            await websocket.send_text(cleaned_response)
        
        except Exception as e:
            await websocket.send_text(f"Error processing file: {str(e)}")
        
        finally:
            # Clean up temporary file
            os.unlink(temp_file.name)
    
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"Unexpected error: {e}")
        await websocket.send_text(f"Unexpected error: {str(e)}")


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
                        model='gemini-2.0-flash',
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
                            model='gemini-2.0-flash',
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


    def rank_resumes(job_description, resumes):
        # Combine job description with resumes
        documents = [job_description] + resumes
        vectorizer = TfidfVectorizer().fit_transform(documents)
        vectors = vectorizer.toarray()

        # Calculate cosine similarity
        job_description_vector = vectors[0]
        resume_vectors = vectors[1:]
        cosine_similarities = cosine_similarity([job_description_vector], resume_vectors).flatten()

    def run(self):
        import uvicorn
        uvicorn.run(self.app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    server = ResumeAnalysisServer()
    server.run()