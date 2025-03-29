import asyncio
import os
import pathlib
import websockets
import tempfile
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body, Response, UploadFile, File
from fastapi.responses import FileResponse
import nltk
from nltk.corpus import stopwords
from urllib.parse import urljoin, urlparse
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
from onefilellm import process_github_issue, process_github_repo,process_github_pull_request, process_arxiv_pdf, process_doi_or_pmid, crawl_and_extract_text, preprocess_text, fetch_youtube_transcript, process_local_folder

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

ENABLE_COMPRESSION_AND_NLTK = True  # Set to True to enable NLTK download, stopword removal, and compressed output

EXCLUDED_DIRS = ["dist", "node_modules", ".git", "__pycache__"] 
CHAT_HISTORY_FILE = "chat_history.json"

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

class ChatHistoryItem(BaseModel):
    role: str
    timestamp: str
    content: str
    name: str
    avatar: Optional[str] = None

class ChatHistoryPayload(BaseModel):
    conf_uid: str
    history_uid: str
    history: List[ChatHistoryItem]
    timestamp: str

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


def safe_file_read(filepath, fallback_encoding='latin1'):
    try:
        with open(filepath, "r", encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        with open(filepath, "r", encoding=fallback_encoding) as file:
            return file.read()

stop_words = set()  # Initialize as empty set by default
if ENABLE_COMPRESSION_AND_NLTK:
    try:
        nltk.download("stopwords", quiet=True)
        stop_words = set(stopwords.words("english"))
    except Exception as e:
        print(f"[bold yellow]Warning:[/bold yellow] Failed to download or load NLTK stopwords. Compression will proceed without stopword removal. Error: {e}")

TOKEN = os.getenv('GITHUB_TOKEN', 'default_token_here')
if TOKEN == 'default_token_here':
    raise EnvironmentError("GITHUB_TOKEN environment variable not set.")

headers = {"Authorization": f"token {TOKEN}"}

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

    def load_chat_history(self):
        """Loads chat history from the JSON file."""
        try:
            with open(CHAT_HISTORY_FILE, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            print(f"Warning: {CHAT_HISTORY_FILE} is corrupted. Starting with an empty history.")
            return {}

    def save_chat_history(self, chat_history: Dict[str, Any]):
        """Saves chat history to the JSON file."""
        try:
            with open(CHAT_HISTORY_FILE, "w") as f:
                json.dump(chat_history, f, indent=4)
        except IOError as e:
            print(f"Error saving chat history: {e}")

    def main_processing(self, input_path):
        output_file = "uncompressed_output.txt"
        processed_file = "compressed_output.txt"
        urls_list_file = "processed_urls.txt"

        try:
            if "github.com" in input_path:
                if "/pull/" in input_path:
                    final_output = process_github_pull_request(input_path)
                elif "/issues/" in input_path:
                    final_output = process_github_issue(input_path)
                else:
                    final_output = process_github_repo(input_path)
            elif urlparse(input_path).scheme in ["http", "https"]:
                if "youtube.com" in input_path or "youtu.be" in input_path:
                    final_output = fetch_youtube_transcript(input_path)
                elif "arxiv.org" in input_path:
                    final_output = process_arxiv_pdf(input_path)
                else:
                    crawl_result = crawl_and_extract_text(input_path, max_depth=2, include_pdfs=True, ignore_epubs=True)
                    final_output = crawl_result['content']
                    with open(urls_list_file, 'w', encoding='utf-8') as urls_file:
                        urls_file.write('\n'.join(crawl_result['processed_urls']))
            elif input_path.startswith("10.") and "/" in input_path or input_path.isdigit():
                final_output = process_doi_or_pmid(input_path)
            else:
                final_output = process_local_folder(input_path)

            with open(output_file, "w", encoding="utf-8") as file:
                file.write(final_output)

            if ENABLE_COMPRESSION_AND_NLTK:
                preprocess_text(output_file, processed_file)
                return {"uncompressed_file": output_file, "compressed_file": processed_file}
            else:
                return {"uncompressed_file": output_file}

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def setup_routes(self):
        @self.app.get("/resume-analysis-results")
        async def get_resume_analysis_results():
            """
            Endpoint to retrieve the resume analysis results from resume_analysis_results.json.
            """
            try:
                with open("resume_analysis_results.json", 'r') as f:
                    analysis_results = json.load(f)
                return analysis_results
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail="Resume analysis results file not found")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error retrieving resume analysis results: {str(e)}")
            
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
        
        @self.app.get("/generate-chart-data")
        async def generate_chart_data():
            """
            Generate aggregated chart data from all resumes and save to chart.json
            """
            try:
                # Load the latest analysis results
                self.load_results()
                
                if not self.analysis_results:
                    return JSONResponse(
                        status_code=404,
                        content={"message": "No resume data available for analysis"}
                    )
                
                # Initialize aggregation data structure
                chart_data = {
                    "total_resumes": len(self.analysis_results),
                    "total_skills": set(),
                    "total_projects": 0,
                    "skill_frequency": {},
                    "education_levels": {},
                    "experience_levels": {
                        "Entry": 0,
                        "Junior": 0,
                        "Mid-level": 0,
                        "Senior": 0,
                        "Expert": 0
                    },
                    "common_technologies": {},
                    "degree_types": {},
                    "resumes": []
                }
                
                # Process each resume
                for filename, resume in self.analysis_results.items():
                    try:
                        # Basic resume info
                        resume_info = {
                            "name": resume["contact_info"]["full_name"],
                            "skills_count": len(resume["skills"]["technical_skills"]),
                            "projects_count": len(resume.get("projects", [])),  # Ensure projects is a list or empty list
                            "experience_count": len(resume.get("work_experience", [])),  # Ensure work_experience is a list or empty list
                            "education": [],
                            "experience_level": None
                        }

                        # Calculate experience score
                        project_count = len(resume.get("projects", []))  # Safely handle missing projects
                        skill_count = len(resume["skills"]["technical_skills"])
                        work_exp_count = len(resume.get("work_experience", []))  # Safely handle missing work_experience
                        experience_score = (project_count * 2) + (skill_count * 0.5) + (work_exp_count * 5)

                        # Determine experience level
                        if experience_score >= 40:
                            experience_level = "Expert"
                        elif experience_score >= 30:
                            experience_level = "Senior"
                        elif experience_score >= 20:
                            experience_level = "Mid-level"
                        elif experience_score >= 10:
                            experience_level = "Junior"
                        else:
                            experience_level = "Entry"

                        resume_info["experience_level"] = experience_level
                        chart_data["experience_levels"][experience_level] += 1

                        # Process education (ensure education is a list before iteration)
                        for edu in resume.get("education", []):  # Safely handle missing education
                            degree_type = edu["degree"].split(" in ")[0]  # e.g. "Bachelors" from "Bachelors in CS"
                            chart_data["degree_types"][degree_type] = chart_data["degree_types"].get(degree_type, 0) + 1
                            resume_info["education"].append({
                                "degree": edu["degree"],
                                "institution": edu["institution"],
                                "year": edu["graduation_year"]
                            })

                        # Process skills
                        for skill in resume.get("skills", {}).get("technical_skills", []):  # Safely handle missing skills
                            chart_data["total_skills"].add(skill)
                            chart_data["skill_frequency"][skill] = chart_data["skill_frequency"].get(skill, 0) + 1

                        # Process projects (ensure projects is a list before iteration)
                        chart_data["total_projects"] += len(resume.get("projects", []))  # Safely handle missing projects
                        if resume.get("projects"):  # Check if projects exist and are not None
                            for project in resume["projects"]:  # Safely handle missing projects
                                for tech in project.get("technologies", []):  # Safely handle missing technologies
                                    chart_data["common_technologies"][tech] = chart_data["common_technologies"].get(tech, 0) + 1

                        chart_data["resumes"].append(resume_info)

                    except Exception as e:
                        print(f"Error: {e}")

                # Convert sets to counts
                chart_data["total_skills"] = len(chart_data["total_skills"])
                
                # Prepare top skills data (sorted by frequency)
                top_skills = sorted(
                    chart_data["skill_frequency"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:10]  # Top 10 skills
                
                # Prepare top technologies data
                top_tech = sorted(
                    chart_data["common_technologies"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:8]  # Top 8 technologies
                
                # Final chart data structure
                # Final chart data structure
                final_chart_data = {
                    "summary_stats": {
                        "total_resumes": chart_data["total_resumes"],
                        "total_skills": chart_data["total_skills"],
                        "total_projects": chart_data["total_projects"]
                    },
                    "skills_data": {
                        "top_skills": [{"name": skill, "count": count} for skill, count in top_skills],
                        "skill_distribution": [
                            {
                                "name": "Frontend",
                                "value": sum(1 for skill in chart_data["skill_frequency"] 
                                            if any(tech in skill.lower() for tech in ["html", "css", "javascript", "react"]))
                            },
                            {
                                "name": "Backend",
                                "value": sum(1 for skill in chart_data["skill_frequency"] 
                                            if any(tech in skill.lower() for tech in ["node", "express", "python", "java", "spring"]))
                            },
                            {
                                "name": "DevOps",
                                "value": sum(1 for skill in chart_data["skill_frequency"] 
                                            if any(tech in skill.lower() for tech in ["docker", "kubernetes", "aws", "azure", "ci/cd"]))
                            },
                            {
                                "name": "Database",
                                "value": sum(1 for skill in chart_data["skill_frequency"] 
                                            if any(tech in skill.lower() for tech in ["sql", "mysql", "postgres", "mongodb", "redis"]))
                            }
                        ]
                    },
                    "experience_data": [
                        {"name": level, "value": count} 
                        for level, count in chart_data["experience_levels"].items()
                    ],
                    "education_data": [
                        {"name": degree, "count": count} 
                        for degree, count in chart_data["degree_types"].items()
                    ],
                    "technology_data": {
                        "top_technologies": [{"name": tech, "count": count} for tech, count in top_tech],
                        "technology_distribution": [
                            {
                                "name": "Frontend",
                                "value": sum(1 for tech in chart_data["common_technologies"] 
                                            if any(t in tech.lower() for t in ["html", "css", "javascript", "react"]))
                            },
                            {
                                "name": "Backend",
                                "value": sum(1 for tech in chart_data["common_technologies"] 
                                            if any(t in tech.lower() for t in ["node", "express", "python", "java"]))
                            },
                            {
                                "name": "DevOps",
                                "value": sum(1 for tech in chart_data["common_technologies"] 
                                            if any(t in tech.lower() for t in ["docker", "kubernetes", "aws"]))
                            },
                            {
                                "name": "Database",
                                "value": sum(1 for tech in chart_data["common_technologies"] 
                                            if any(t in tech.lower() for t in ["sql", "mysql", "mongodb"]))
                            }
                        ]
                    },
                    "resume_comparison": chart_data["resumes"]
                }

                # Save to chart.json
                with open("chart.json", "w") as f:
                    json.dump(final_chart_data, f, indent=2)

                return JSONResponse(
                status_code=200,
                content={
                    "message": "Chart data generated successfully",
                    "chart_data": final_chart_data
                }
            )

            except Exception as e:
                return JSONResponse(
                status_code=500,
                content={"message": f"Error generating chart data: {str(e)}"}
            )

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
                    model="gemini-2.0-flash",
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
            
        
        @app.post("/process_url_or_path/")
        async def process_url_or_path(input_path: str = Body(embed=True), compressed: bool = False): # added compressed param
            result = self.main_processing(input_path)

            file_to_read = result["uncompressed_file"] # default to uncompressed

            if compressed and "compressed_file" in result:
                file_to_read = result["compressed_file"]

            try:
                with open(file_to_read, "r", encoding="utf-8") as file:
                    file_content = file.read()
                return Response(content=file_content, media_type="text/plain") #return content
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail="File not found")
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
            
        @self.app.post("/analyze_project/")
        async def analyze_project(input_path: str = Body(embed=True)):
            """
            Endpoint to analyze a project based on its code or documentation using Gemini.
            """
            try:
                result = self.main_processing(input_path)

                file_to_read = result["uncompressed_file"]  # default to uncompressed

                try:
                    with open(file_to_read, "r", encoding="utf-8") as file:
                        project_content = file.read()
                except FileNotFoundError:
                    raise HTTPException(status_code=404, detail="File not found")

                client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

                prompt = f"""
                Analyze the following project content and provide a detailed report including:

                - A summary of the project's purpose and functionality.
                - The project's structure, including key files and directories.
                - Key technologies and libraries used.
                - Potential areas for improvement or refactoring.
                - Project metrics such as estimated complexity, maintainability, and code quality.
                - A list of identified potential issues or bugs.
                - a list of the programming languages used.
                - a list of the libraries used.
                - a list of the files that are most important.
                - a list of the files that are most complex.

                Project Content:
                {project_content}

                Return your analysis in the following JSON structure ONLY:
                {{
                    "summary": "Project summary",
                    "structure": "Description of project structure",
                    "technologies": ["Technology 1", "Technology 2", ...],
                    "languages": ["Language1","Language2",...],
                    "libraries": ["Library1","Library2",...],
                    "important_files": ["file1","file2",...],
                    "complex_files": ["file1","file2",...],
                    "improvements": ["Improvement 1", "Improvement 2", ...],
                    "metrics": {{
                        "complexity": "Estimated complexity",
                        "maintainability": "Estimated maintainability",
                        "code_quality": "Estimated code quality"
                    }},
                    "issues": ["Issue 1", "Issue 2", ...]
                }}
                """
                client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )

                project_analysis = clean_json_response(response.text)
                return project_analysis

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error analyzing project: {str(e)}")

        @self.app.get("/get_file/{file_name}")
        async def get_file(file_name: str):
            if not os.path.exists(file_name):
                raise HTTPException(status_code=404, detail="File not found")
            return FileResponse(file_name, media_type="text/plain", filename=file_name)

        @self.app.post("/process_upload/")
        async def process_upload(file: UploadFile = File(...)):
            temp_file_path = f"temp_{file.filename}"
            try:
                with open(temp_file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                result = self.main_processing(temp_file_path)
            finally:
                os.remove(temp_file_path)
            return result
        
        @self.app.post("/update_chat_history")
        async def update_chat_history(payload: ChatHistoryPayload):
            """
            Updates or saves chat history based on the received payload.
            """
            chat_history = self.load_chat_history()
            history_key = f"{payload.conf_uid}_{payload.history_uid}"
            
            chat_history[history_key] = {
                "conf_uid": payload.conf_uid,
                "history_uid": payload.history_uid,
                "history": [item.model_dump() for item in payload.history],
                "timestamp": payload.timestamp,
            }

            self.save_chat_history(chat_history)
            return {"message": "Chat history updated successfully"}
        
        @self.app.get("/get_chat_history")
        async def get_chat_history():
            """
            Retrieves chat history.
            """
            chat_history = self.load_chat_history()
            return chat_history
        
        @self.app.post("/analyze_interview")
        async def analyze_interview(history_uid: str = None):
            """
            Analyzes interview chat histories directly from stored data using Gemini.
            """
            # Load the chat history directly
            chat_history = self.load_chat_history()
            
            # Flatten all chat history data into a single string
            all_messages = []
            
            # If history_uid provided, filter only that conversation
            if history_uid:
                for key, data in chat_history.items():
                    if history_uid in key:
                        for message in data.get("history", []):
                            all_messages.append(f"{message.get('name', 'Unknown')}: {message.get('content', '')}")
            else:
                # Include all conversations
                for key, data in chat_history.items():
                    # Add conversation identifier
                    all_messages.append(f"--- Conversation: {key} ---")
                    for message in data.get("history", []):
                        all_messages.append(f"{message.get('name', 'Unknown')}: {message.get('content', '')}")
                    all_messages.append("---")
            
            # Check if we found any messages
            if not all_messages:
                return {"error": "No matching interview history found"}
            
            # Join all messages into a single text
            flattened_history = "\n".join(all_messages)
            
            prompt = f"""
            Analyze the following interview chat history and provide a detailed report. 
            Include observations on the candidate's skills, communication style, 
            responses to specific questions, and any other relevant insights.
            
            Interview Chat History:
            {flattened_history}
            
            Analysis Report:
            """
            
            client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
            
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )
                interview_results = clean_json_response(response.text)
                return interview_results
            except Exception as e:
                return {"error": f"Error analyzing interview: {str(e)}"}
            
    def run(self):
        import uvicorn
        uvicorn.run(self.app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    server = ResumeAnalysisServer()
    server.run()