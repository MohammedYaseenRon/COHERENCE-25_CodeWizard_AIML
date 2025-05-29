from fastapi.routing import APIRouter
from fastapi import HTTPException, Body, Response, UploadFile, File
from utils.response import clean_json_response
from services.onefilellm import process_github_issue, process_github_repo,process_github_pull_request, process_arxiv_pdf, process_doi_or_pmid, crawl_and_extract_text, preprocess_text, fetch_youtube_transcript, process_local_folder
from services.gemini_service import GeminiService
from urllib.parse import urlparse
from config.settings import ENABLE_COMPRESSION_AND_NLTK
import os

router = APIRouter()

def main_processing(input_path):
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

@router.post("/process_url_or_path")
async def process_url_or_path(input_path: str = Body(embed=True), compressed: bool = False): # added compressed param
    result = main_processing(input_path)

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
    
@router.post("/analyze_project/")
async def analyze_project(input_path: str = Body(embed=True)):
    """
    Endpoint to analyze a project based on its code or documentation using Gemini.
    """
    try:
        result = main_processing(input_path)

        file_to_read = result["uncompressed_file"]  # default to uncompressed

        try:
            with open(file_to_read, "r", encoding="utf-8") as file:
                project_content = file.read()
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="File not found")

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
        gemini = GeminiService()
        response = gemini.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )

        if not response or not response.text:
            raise HTTPException(status_code=500, detail="No response from Gemini")

        project_analysis = clean_json_response(response.text)
        return project_analysis

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing project: {str(e)}")
    
@router.post("/process_upload/")
async def process_upload(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        result = main_processing(temp_file_path)
    finally:
        os.remove(temp_file_path)
    return result