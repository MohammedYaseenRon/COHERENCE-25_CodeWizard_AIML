from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import nltk
from nltk.corpus import stopwords
from rich import print
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup, Comment
from urllib.parse import urljoin, urlparse
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from onefilellm import process_github_issue, process_github_repo,process_github_pull_request, process_arxiv_pdf, process_doi_or_pmid, crawl_and_extract_text, preprocess_text, fetch_youtube_transcript, process_local_folder

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


# --- Configuration Flags ---
ENABLE_COMPRESSION_AND_NLTK = True  # Set to True to enable NLTK download, stopword removal, and compressed output

EXCLUDED_DIRS = ["dist", "node_modules", ".git", "__pycache__"]  # Add any other directories to exclude here

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

@app.post("/process_url_or_path/")
async def process_url_or_path(input_path: str):
    result = main_processing(input_path)
    return result

@app.get("/get_file/{file_name}")
async def get_file(file_name: str):
    if not os.path.exists(file_name):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_name, media_type="text/plain", filename=file_name)

@app.post("/process_upload/")
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