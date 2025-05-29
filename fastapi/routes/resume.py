from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from services.resume_service import ResumeService
from models.resume import ResumeProfile, JobDescriptionRequest
from services.file_service import FileUploadService
from services.ranking_service import ResumeRankingService
from services.gemini_service import GeminiService
import pathlib
import os
import tempfile
import json
import aiofiles

router = APIRouter()
resume_service = ResumeService()

@router.get("/resume-analysis-results")
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
    
@router.websocket("/resume-analyze")
async def websocket_resume_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        file_metadata = await websocket.receive_json()
        filename = file_metadata.get('filename', 'uploaded_resume.pdf')
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            while True:
                file_chunk = await websocket.receive_bytes()
                if file_chunk == b'EOF':
                    break
                temp_file.write(file_chunk)
        
        try:
            gemini = GeminiService()
            file_path = pathlib.Path(temp_file.name)
            
            sample_file = gemini.upload_file(file_path)
            
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
            
            response = gemini.generate_content(
                model='gemini-2.0-flash',
                contents=[sample_file, prompt],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': ResumeProfile,
                },
            )
            
            if isinstance(response.parsed, ResumeProfile):
                result = response.parsed.model_dump()
            else:
                result = response.parsed

            await websocket.send_text(json.dumps(result, indent=2))
        
        except Exception as e:
            await websocket.send_text(f"Error processing resume: {str(e)}")
        
        finally:
            os.unlink(temp_file.name)
    
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"Unexpected error: {e}")
        await websocket.send_text(f"Unexpected error: {str(e)}")

@router.websocket("/multi-upload")
async def multi_file_upload_endpoint(websocket: WebSocket):
    await websocket.accept()
    file_handler = FileUploadService()
    
    try:
        file_metadata = await websocket.receive_json()
        num_files = file_metadata.get('num_files', 1)
        
        for i in range(num_files):
            await websocket.send_text(f"Processing file {i + 1} of {num_files}")
            current_file_metadata = await websocket.receive_json()
            filename = current_file_metadata.get('filename', f'uploaded_file_{i}.pdf')
            
            destination_path, safe_filename = await file_handler.save_uploaded_file(filename)
            
            async with aiofiles.open(destination_path, 'wb') as dest_file:
                while True:
                    file_chunk = await websocket.receive_bytes()
                    if file_chunk == b'EOF':
                        break
                    await dest_file.write(file_chunk)
            
            try:
                gemini = GeminiService()
                file_path = pathlib.Path(destination_path)
                
                sample_file = gemini.upload_file(file_path)
                
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
                
                response = gemini.generate_content(
                    model='gemini-2.0-flash',
                    contents=[sample_file, prompt],
                    config={
                        'response_mime_type': 'application/json',
                        'response_schema': ResumeProfile,
                    },
                )

                if isinstance(response.parsed, ResumeProfile):
                    resume_data = response.parsed.model_dump()
                else:
                    resume_data = response.parsed
                resume_service.update_results(safe_filename, resume_data)
                
            except Exception as e:
                error_data = {
                    "error": f"Error processing file: {str(e)}"
                }
                resume_service.update_results(safe_filename, error_data)
        
        await websocket.send_text(json.dumps(resume_service.analysis_results, indent=2))
    
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"Unexpected error: {e}")
        await websocket.send_text(f"Unexpected error: {str(e)}")

@router.options("/rank-resumes")
async def options_rank_resumes():
    return JSONResponse(
        status_code=200, 
        headers={
            "Access-Control-Allow-Origin": "http://globalhive.xyz",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        content={"message": "OK"}
    )



@router.post("/rank-resumes")
async def rank_resumes(request: JobDescriptionRequest):
    """
    Endpoint to rank resumes against a job description
    """
    ranking_service = ResumeRankingService()
    resumes = ranking_service.load_resumes(request.resumes_file)
    if not resumes:
        resumes = "resume_analysis_results.json"

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
        print(f"Gemini ranking failed: {e}. Falling back to cosine similarity.")
        cosine_ranked_resumes = ranking_service.rank_resumes_with_cosine_similarity(
            request.job_description, 
            resumes
        )
        return {
            "ranking_method": "Cosine Similarity",
            "ranked_resumes": cosine_ranked_resumes
        }
