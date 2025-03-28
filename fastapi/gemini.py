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

# Load environment variables
load_dotenv()

# origins = [
#     "http://localhost.tiangolo.com",
#     "https://localhost.tiangolo.com",
#     "http://localhost",
#     "http://localhost:8080",
# ]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    def __init__(self):
        load_dotenv()
        self.app = app
        self.setup_routes()

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
            
            try:
                # Dictionary to store results for multiple files
                analysis_results: Dict[str, Dict] = {}
                
                # Receive initial metadata about file upload
                file_metadata = await websocket.receive_json()
                num_files = file_metadata.get('num_files', 1)
                
                # Process multiple files
                for _ in range(num_files):
                    # Receive file metadata for each file
                    current_file_metadata = await websocket.receive_json()
                    filename = current_file_metadata.get('filename', f'uploaded_file_{_}.pdf')
                    
                    # Create a temporary file to save the uploaded PDF
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                        # Receive file chunks
                        while True:
                            file_chunk = await websocket.receive_bytes()
                            if file_chunk == b'EOF':
                                break
                            temp_file.write(file_chunk)
                    
                    try:
                        # Upload file to Gemini
                        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
                        file_path = pathlib.Path(temp_file.name)
                        
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
                        
                        # Store analysis results with filename as key
                        analysis_results[filename] = response.parsed.model_dump()
                    
                    except Exception as e:
                        analysis_results[filename] = {
                            "error": f"Error processing file: {str(e)}"
                        }
                    
                    finally:
                        # Clean up temporary file
                        os.unlink(temp_file.name)
                
                # Send compiled results
                await websocket.send_text(json.dumps(analysis_results, indent=2))
            
            except WebSocketDisconnect:
                print("WebSocket connection closed")
            except Exception as e:
                print(f"Unexpected error: {e}")
                await websocket.send_text(f"Unexpected error: {str(e)}")

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