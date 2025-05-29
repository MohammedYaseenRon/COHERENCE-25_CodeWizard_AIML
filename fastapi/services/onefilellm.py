import requests
from bs4 import BeautifulSoup, Comment
from urllib.parse import urljoin, urlparse
from PyPDF2 import PdfReader
import os
import sys
import tiktoken
import nltk
from nltk.corpus import stopwords
import re
import nbformat
from nbconvert import PythonExporter
from youtube_transcript_api._api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import pyperclip
import wget
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt
from rich.progress import Progress, TextColumn, BarColumn, TimeRemainingColumn
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
from config import settings
# Load environment variables from a .env file if it exists
load_dotenv()

def safe_file_read(filepath, fallback_encoding='latin1'):
    try:
        with open(filepath, "r", encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        with open(filepath, "r", encoding=fallback_encoding) as file:
            return file.read()

stop_words = set() # Initialize as empty set by default
if settings.ENABLE_COMPRESSION_AND_NLTK:
    # The NLTK download and stopwords loading is now controlled by a configuration flag.
    # This is beneficial because:
    # 1. It avoids unnecessary downloads when compression is not needed
    # 2. It speeds up the script execution when compression is not required
    # 3. It provides a cleaner output experience focused on raw code readability
    #
    # When ENABLE_COMPRESSION_AND_NLTK = True:
    # - NLTK stopwords will be downloaded (if not already cached)
    # - Compression will be applied producing compressed_output.txt
    # - Both compressed and uncompressed token counts will be displayed
    #
    # When ENABLE_COMPRESSION_AND_NLTK = False (default):
    # - No NLTK downloads occur
    # - No stopword removal/compression is performed
    # - Only the uncompressed_output.txt file is generated
    # - Focus is entirely on producing clean, readable code output
    try:
        nltk.download("stopwords", quiet=True)
        stop_words = set(stopwords.words("english"))
    except Exception as e:
        print(f"[bold yellow]Warning:[/bold yellow] Failed to download or load NLTK stopwords. Compression will proceed without stopword removal. Error: {e}")


TOKEN = os.getenv('GITHUB_TOKEN', 'default_token_here')
if TOKEN == 'default_token_here':
    raise EnvironmentError("GITHUB_TOKEN environment variable not set.")

headers = {"Authorization": f"token {TOKEN}"}

def download_file(url, target_path):
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    with open(target_path, "wb") as f:
        f.write(response.content)

def process_ipynb_file(temp_file):
    with open(temp_file, "r", encoding='utf-8', errors='ignore') as f:
        notebook_content = f.read()

    exporter = PythonExporter()
    python_code, _ = exporter.from_notebook_node(nbformat.reads(notebook_content, as_version=4))
    return python_code

def process_directory(url, output):
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    files = response.json()

    for file in files:
        if file["type"] == "dir" and file["name"] in settings.EXCLUDED_DIRS:
            continue  # Skip excluded directories

        if file["type"] == "file" and is_allowed_filetype(file["name"]):
            print(f"Processing {file['path']}...")

            temp_file = f"temp_{file['name']}"
            download_file(file["download_url"], temp_file)

            output.write(f"# {'-' * 3}\n")
            output.write(f"# Filename: {file['path']}\n")
            output.write(f"# {'-' * 3}\n\n")

            if file["name"].endswith(".ipynb"):
                output.write(process_ipynb_file(temp_file))
            else:
                with open(temp_file, "r", encoding='utf-8', errors='ignore') as f:
                    output.write(f.read())

            output.write("\n\n")
            os.remove(temp_file)
        elif file["type"] == "dir":
            process_directory(file["url"], output)

def process_local_directory(local_path, output):
    for root, dirs, files in os.walk(local_path):
        # Modify dirs in-place to exclude specified directories
        dirs[:] = [d for d in dirs if d not in settings.EXCLUDED_DIRS]

        for file in files:
            if is_allowed_filetype(file):
                print(f"Processing {os.path.join(root, file)}...")

                output.write(f"# {'-' * 3}\n")
                output.write(f"# Filename: {os.path.join(root, file)}\n")
                output.write(f"# {'-' * 3}\n\n")

                file_path = os.path.join(root, file)

                if file.endswith(".ipynb"):
                    output.write(process_ipynb_file(file_path))
                else:
                    with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                        output.write(f.read())

                output.write("\n\n")

def process_github_repo(repo_url):
    api_base_url = "https://api.github.com/repos/"
    repo_url_parts = repo_url.split("https://github.com/")[-1].split("/")
    repo_name = "/".join(repo_url_parts[:2])

    # Detect if we have a branch or tag reference
    branch_or_tag = ""
    subdirectory = ""
    if len(repo_url_parts) > 2 and repo_url_parts[2] == "tree":
        # The branch or tag name should be at index 3
        if len(repo_url_parts) > 3:
            branch_or_tag = repo_url_parts[3]
        # Any remaining parts after the branch/tag name form the subdirectory
        if len(repo_url_parts) > 4:
            subdirectory = "/".join(repo_url_parts[4:])
    
    contents_url = f"{api_base_url}{repo_name}/contents"
    if subdirectory:
        contents_url = f"{contents_url}/{subdirectory}"
    if branch_or_tag:
        contents_url = f"{contents_url}?ref={branch_or_tag}"

    repo_content = [f"# --- Source: GitHub Repository {repo_url} ---"]

    def process_directory(url, repo_content):
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        files = response.json()

        for file in files:
            if file["type"] == "dir" and file["name"] in settings.EXCLUDED_DIRS:
                continue

            if file["type"] == "file" and is_allowed_filetype(file["name"]):

                print(f"Processing {file['path']}...")

                temp_file = f"temp_{file['name']}"
                download_file(file["download_url"], temp_file)

                repo_content.append(f"# --- GitHub File: {file['path']} ---") 
                if file["name"].endswith(".ipynb"):
                    repo_content.append(process_ipynb_file(temp_file))
                else:
                    with open(temp_file, "r", encoding='utf-8', errors='ignore') as f:
                        repo_content.append(f.read())
                os.remove(temp_file)

            elif file["type"] == "dir":
                process_directory(file["url"], repo_content)

    process_directory(contents_url, repo_content)
    print("All files processed.")

    return "\n".join(repo_content)

def process_local_folder(local_path):
    def process_local_directory(local_path):
        content = [f"# --- Source: Local Directory {local_path} ---"]
        for root, dirs, files in os.walk(local_path):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in settings.EXCLUDED_DIRS]

            for file in files:
                if is_allowed_filetype(file):
                    print(f"Processing {os.path.join(root, file)}...")

                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, local_path)
                    content.append(f"# --- Local File: {relative_path} ---")

                    if file.endswith(".ipynb"):
                        content.append(process_ipynb_file(file_path))
                    else:
                        with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                            content.append(f.read())

        return '\n'.join(content)

    formatted_content = process_local_directory(local_path)
    print("All files processed.")
    return formatted_content

def process_arxiv_pdf(arxiv_abs_url):
    pdf_url = arxiv_abs_url.replace("/abs/", "/pdf/") + ".pdf"
    response = requests.get(pdf_url)
    pdf_content = response.content

    with open('temp.pdf', 'wb') as pdf_file:
        pdf_file.write(pdf_content)

    text = []
    with open('temp.pdf', 'rb') as pdf_file:
        pdf_reader = PdfReader(pdf_file)
        for page in range(len(pdf_reader.pages)):
            text.append(pdf_reader.pages[page].extract_text())

    formatted_text = f"# --- Source: ArXiv Paper {arxiv_abs_url} ---\n\n"
    formatted_text += ' '.join(text)

    os.remove('temp.pdf')
    print("ArXiv paper processed successfully.")

    return formatted_text

def extract_links(input_file, output_file):
    url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    
    with open(input_file, 'r', encoding='utf-8') as file:
        content = file.read()
        urls = re.findall(url_pattern, content)
    
    with open(output_file, 'w', encoding='utf-8') as output:
        for url in urls:
            output.write(url + '\n')

def fetch_youtube_transcript(url):
    def extract_video_id(url):
        pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})'
        match = re.search(pattern, url)
        if match:
            return match.group(1)
        return None

    video_id = extract_video_id(url)
    if not video_id:
        return f'<source type="youtube_transcript" url="{escape_xml(url)}">\n<error>Could not extract video ID from URL.</error>\n</source>'

    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        transcript = formatter.format_transcript(transcript_list) #type: ignore
        
        formatted_text = f"# --- Source: YouTube Transcript {url} ---\n\n"
        formatted_text += transcript
        
        return formatted_text
    except Exception as e:
        return f'<source type="youtube_transcript" url="{escape_xml(url)}">\n<error>{escape_xml(str(e))}</error>\n</source>'

def preprocess_text(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as input_file:
        input_text = input_file.read()

    def process_text(text):
        text = re.sub(r"[\n\r]+", "\n", text)
        # Update the following line to include apostrophes and quotation marks
        text = re.sub(r"[^a-zA-Z0-9\s_.,!?:;@#$%^&*()+\-=[\]{}|\\<>`~'\"/]+", "", text)
        text = re.sub(r"\s+", " ", text)
        text = text.lower()
        # Only remove stopwords if the feature is enabled and stopwords were loaded
        if settings.ENABLE_COMPRESSION_AND_NLTK and stop_words:
            words = text.split()
            words = [word for word in words if word not in stop_words]
            text = " ".join(words)
        return text # Return the possibly modified text

    try:
        # Try to parse the input as XML
        root = ET.fromstring(input_text)

        # Process text content while preserving XML structure
        for elem in root.iter():
            if elem.text:
                elem.text = process_text(elem.text)
            if elem.tail:
                elem.tail = process_text(elem.tail)

        # Write the processed XML to the output file
        tree = ET.ElementTree(root)
        tree.write(output_file, encoding="utf-8", xml_declaration=True)
        print("Text preprocessing completed with XML structure preserved.")
    except ET.ParseError:
        # If XML parsing fails, process the text without preserving XML structure
        processed_text = process_text(input_text)
        with open(output_file, "w", encoding="utf-8") as out_file:
            out_file.write(processed_text)
        print("XML parsing failed. Text preprocessing completed without XML structure.")

def get_token_count(text, disallowed_special=[], chunk_size=1000):
    # Modified to work with plain text format instead of XML
    # Previously, this function would strip XML tags before counting tokens:
    # text_without_tags = re.sub(r'<[^>]+>', '', text)
    #
    # Since we now use plain text format with no XML tags, we can count tokens directly
    # from the text, leading to more accurate token counts and better performance.
    enc = tiktoken.get_encoding("cl100k_base")

    # Split the text into smaller chunks
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    total_tokens = 0

    for chunk in chunks:
        tokens = enc.encode(chunk, disallowed_special=disallowed_special)
        total_tokens += len(tokens)
    
    return total_tokens

def is_same_domain(base_url, new_url):
    return urlparse(base_url).netloc == urlparse(new_url).netloc

def is_within_depth(base_url, current_url, max_depth):
    base_parts = urlparse(base_url).path.rstrip('/').split('/')
    current_parts = urlparse(current_url).path.rstrip('/').split('/')

    if current_parts[:len(base_parts)] != base_parts:
        return False

    return len(current_parts) - len(base_parts) <= max_depth

def process_pdf(url):
    response = requests.get(url)
    response.raise_for_status()

    with open('temp.pdf', 'wb') as pdf_file:
        pdf_file.write(response.content)

    text = []
    with open('temp.pdf', 'rb') as pdf_file:
        pdf_reader = PdfReader(pdf_file)
        for page in range(len(pdf_reader.pages)):
            text.append(pdf_reader.pages[page].extract_text())

    os.remove('temp.pdf')
    return ' '.join(text)

def crawl_and_extract_text(base_url, max_depth, include_pdfs, ignore_epubs):
    visited_urls = set()
    urls_to_visit = [(base_url, 0)]
    processed_urls = []
    all_text = [f"# --- Source: Web Crawl {base_url} ---"]

    while urls_to_visit:
        current_url, current_depth = urls_to_visit.pop(0)
        clean_url = current_url.split('#')[0]

        if clean_url not in visited_urls and is_same_domain(base_url, clean_url) and is_within_depth(base_url, clean_url, max_depth):
            if ignore_epubs and clean_url.endswith('.epub'):
                continue

            try:
                response = requests.get(current_url)
                soup = BeautifulSoup(response.content, 'html.parser')
                visited_urls.add(clean_url)

                if clean_url.endswith('.pdf') and include_pdfs:
                    text = process_pdf(clean_url)
                else:
                    for element in soup(['script', 'style', 'head', 'title', 'meta', '[document]']):
                        element.decompose()
                    comments = soup.find_all(string=lambda text: isinstance(text, Comment))
                    for comment in comments:
                        comment.extract()
                    text = soup.get_text(separator='\n', strip=True)

                all_text.append(f"\n# --- Web Page: {clean_url} ---")
                all_text.append(text)
                processed_urls.append(clean_url)
                print(f"Processed: {clean_url}")

                if current_depth < max_depth:
                    for link in soup.find_all('a', href=True):
                        new_url = urljoin(current_url, link['href']).split('#')[0] #type: ignore
                        if new_url not in visited_urls and is_within_depth(base_url, new_url, max_depth) and (include_pdfs or not new_url.endswith('.pdf')) and not (ignore_epubs and new_url.endswith('.epub')):
                            urls_to_visit.append((new_url, current_depth + 1))

            except requests.RequestException as e:
                print(f"Failed to retrieve {clean_url}: {e}")

    # No closing tag needed for plain text format
    formatted_content = '\n'.join(all_text)

    return {
        'content': formatted_content,
        'processed_urls': processed_urls
    }

def process_doi_or_pmid(identifier):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
        'Connection': 'keep-alive'
    }

    try:
        payload = {
            'sci-hub-plugin-check': '',
            'request': identifier
        }

        base_url = 'https://sci-hub.se/'
        response = requests.post(base_url, headers=headers, data=payload, timeout=60)
        soup = BeautifulSoup(response.content, 'html.parser')
        pdf_element = soup.find(id='pdf')

        if pdf_element is None:
            raise ValueError(f"No PDF found for identifier {identifier}. Sci-hub might be inaccessible or the document is not available.")

        content = pdf_element.get('src').replace('#navpanes=0&view=FitH', '').replace('//', '/') #type: ignore

        if content.startswith('/downloads'):
            pdf_url = 'https://sci-hub.se' + content
        elif content.startswith('/tree'):
            pdf_url = 'https://sci-hub.se' + content
        elif content.startswith('/uptodate'):
            pdf_url = 'https://sci-hub.se' + content
        else:
            pdf_url = 'https:/' + content

        pdf_filename = f"{identifier.replace('/', '-')}.pdf"
        wget.download(pdf_url, pdf_filename)

        with open(pdf_filename, 'rb') as pdf_file:
            pdf_reader = PdfReader(pdf_file)
            text = ""
            for page in range(len(pdf_reader.pages)):
                text += pdf_reader.pages[page].extract_text()

        formatted_text = f"# --- Source: Sci-Hub Paper {identifier} ---\n\n"
        formatted_text += text

        os.remove(pdf_filename)
        print(f"Identifier {identifier} processed successfully.")
        return formatted_text
    except (requests.RequestException, ValueError) as e:
        error_text = f"# --- Source: Sci-Hub Paper Error {identifier} ---\n# Error: {str(e)}"
        error_text += f'<error>{escape_xml(str(e))}</error>\n'
        error_text += '</source>'
        print(f"Error processing identifier {identifier}: {str(e)}")
        print("Sci-hub appears to be inaccessible or the document was not found. Please try again later.")
        return error_text
        
def process_github_pull_request(pull_request_url):
    url_parts = pull_request_url.split("/")
    repo_owner = url_parts[3]
    repo_name = url_parts[4]
    pull_request_number = url_parts[-1]

    api_base_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls/{pull_request_number}"
    headers = {"Authorization": f"token {TOKEN}"}

    response = requests.get(api_base_url, headers=headers)
    pull_request_data = response.json()

    diff_url = pull_request_data["diff_url"]
    diff_response = requests.get(diff_url, headers=headers)
    pull_request_diff = diff_response.text

    comments_url = pull_request_data["comments_url"]
    review_comments_url = pull_request_data["review_comments_url"]
    comments_response = requests.get(comments_url, headers=headers)
    review_comments_response = requests.get(review_comments_url, headers=headers)
    comments_data = comments_response.json()
    review_comments_data = review_comments_response.json()

    all_comments = comments_data + review_comments_data
    all_comments.sort(key=lambda comment: comment.get("position") or float("inf"))

    formatted_text = f"# --- Source: GitHub Pull Request {pull_request_url} ---\n"
    formatted_text += f"# Title: {pull_request_data['title']}\n"
    formatted_text += f"# Description:\n# ---\n{pull_request_data['body']}\n# ---\n"
    formatted_text += f"# Merge Details: {pull_request_data['user']['login']} wants to merge {pull_request_data['commits']} commit into {repo_owner}:{pull_request_data['base']['ref']} from {pull_request_data['head']['label']}\n\n"

    # Add the diff with simplified comments
    formatted_text += "# --- Pull Request Diff ---\n"
    diff_lines = pull_request_diff.split("\n")
    comment_index = 0
    for line in diff_lines:
        formatted_text += f"{line}\n"
        # Add any comments for this line in a more readable format
        while comment_index < len(all_comments) and all_comments[comment_index].get("position") == diff_lines.index(line):
            comment = all_comments[comment_index]
            formatted_text += f"# COMMENT by {comment['user']['login']} on {comment['path']} line {comment['original_line']}:\n"
            # Process comment body and handle newlines
            comment_body = comment['body']
            comment_lines = comment_body.split('\n')
            formatted_text += f"# {comment_lines[0]}\n"
            for line in comment_lines[1:]:
                formatted_text += f"# {line}\n"
            comment_index += 1

    # Add repository content with a header
    repo_url = f"https://github.com/{repo_owner}/{repo_name}"
    repo_content = process_github_repo(repo_url)
    
    formatted_text += "\n# --- Associated Repository Content ---\n"
    formatted_text += repo_content

    print(f"Pull request {pull_request_number} and repository content processed successfully.")

    return formatted_text
    
def escape_xml(text):
    # IMPORTANT: This function has been modified to return unescaped text for better code readability.
    # 
    # Original functionality would escape XML special characters as follows:
    # < becomes &lt;
    # > becomes &gt;
    # & becomes &amp;
    # This caused code snippets in the output to become unreadable, especially when
    # code contained XML/HTML tags, comparison operators, or other special characters.
    #
    # For example, original code like:
    #    if (x < 10 && y > 20) { ... }
    # Would be turned into:
    #    if (x &lt; 10 &amp;&amp; y &gt; 20) { ... }
    #
    # Now we simply pass through the text unchanged to maintain code readability:
    return str(text)

def process_github_issue(issue_url):
    url_parts = issue_url.split("/")
    repo_owner = url_parts[3]
    repo_name = url_parts[4]
    issue_number = url_parts[-1]

    api_base_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/issues/{issue_number}"
    headers = {"Authorization": f"token {TOKEN}"}

    response = requests.get(api_base_url, headers=headers)
    issue_data = response.json()

    comments_url = issue_data["comments_url"]
    comments_response = requests.get(comments_url, headers=headers)
    comments_data = comments_response.json()

    formatted_text = f"# --- Source: GitHub Issue {issue_url} ---\n"
    formatted_text += f"# Title: {issue_data['title']}\n"
    formatted_text += f"# Description:\n# ---\n{issue_data['body']}\n# ---\n"

    # Add comments in a readable format
    if comments_data:
        formatted_text += "\n# --- Issue Comments ---\n"
        for comment in comments_data:
            formatted_text += f"# COMMENT by {comment['user']['login']}:\n"
            # Process comment body and handle newlines
            comment_body = comment['body']
            comment_lines = comment_body.split('\n')
            formatted_text += f"# {comment_lines[0]}\n"
            for line in comment_lines[1:]:
                formatted_text += f"# {line}\n"
            formatted_text += "\n"

    # Add repository content with a header
    repo_url = f"https://github.com/{repo_owner}/{repo_name}"
    repo_content = process_github_repo(repo_url)
    
    formatted_text += "\n# --- Associated Repository Content ---\n"
    formatted_text += repo_content

    print(f"Issue {issue_number} and repository content processed successfully.")

    return formatted_text


def is_excluded_file(filename):
    """
    Check if a file should be excluded based on patterns.

    Args:
        filename (str): The file path to check

    Returns:
        bool: True if the file should be excluded, False otherwise
    """
    excluded_patterns = [
        '.pb.go',  # Proto generated Go files
        '_grpc.pb.go',  # gRPC generated Go files
        'mock_',  # Mock files
        '/generated/',  # Generated files in a generated directory
        '/mocks/',  # Mock files in a mocks directory
        '.gen.',  # Generated files with .gen. in name
        '_generated.',  # Generated files with _generated in name
    ]

    return any(pattern in filename for pattern in excluded_patterns)


def is_allowed_filetype(filename):
    """
    Check if a file should be processed based on its extension and exclusion patterns.

    Args:
        filename (str): The file path to check

    Returns:
        bool: True if the file should be processed, False otherwise
    """
    # First check if file matches any exclusion patterns
    if is_excluded_file(filename):
        return False

    # Then check if it has an allowed extension
    allowed_extensions = [
        '.go',
        '.proto',
        '.py',
        '.txt',
        '.md',
        '.cjs',
        '.html',
        '.json',
        '.ipynb',
        '.h',
        '.localhost',
        '.yaml',
        '.example'
    ]

    return any(filename.endswith(ext) for ext in allowed_extensions)

def main():
    console = Console()

    intro_text = Text("\nInput Paths or URLs Processed:\n", style="dodger_blue1")
    input_types = [
        ("• Local folder path (flattens all files into text)", "bright_white"),
        ("• GitHub repository URL (flattens all files into text)", "bright_white"),
        ("• GitHub pull request URL (PR + Repo)", "bright_white"),
        ("• GitHub issue URL (Issue + Repo)", "bright_white"),
        ("• Documentation URL (base URL)", "bright_white"),
        ("• YouTube video URL (to fetch transcript)", "bright_white"),
        ("• ArXiv Paper URL", "bright_white"),
        ("• DOI or PMID to search on Sci-Hub", "bright_white"),
    ]

    for input_type, color in input_types:
        intro_text.append(f"\n{input_type}", style=color)

    intro_panel = Panel(
        intro_text,
        expand=False,
        border_style="bold",
        title="[bright_white]Copy to File and Clipboard[/bright_white]",
        title_align="center",
        padding=(1, 1),
    )
    console.print(intro_panel)

    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    else:
        input_path = Prompt.ask("\n[bold dodger_blue1]Enter the path or URL[/bold dodger_blue1]", console=console)
    
    console.print(f"\n[bold bright_green]You entered:[/bold bright_green] [bold bright_yellow]{input_path}[/bold bright_yellow]\n")

    output_file = "uncompressed_output.txt"
    processed_file = "compressed_output.txt"
    urls_list_file = "processed_urls.txt"

    with Progress(
        TextColumn("[bold bright_blue]{task.description}"),
        BarColumn(bar_width=None),
        TimeRemainingColumn(),
        console=console,
    ) as progress:

        task = progress.add_task("[bright_blue]Processing...", total=100)

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

            progress.update(task, advance=50)

            # Write the uncompressed output
            with open(output_file, "w", encoding="utf-8") as file:
                file.write(final_output)
            progress.update(task, advance=50) # Move progress update here

            # --- Conditional Compression Block ---
            if settings.ENABLE_COMPRESSION_AND_NLTK:
                # When the compression flag is enabled, we perform additional processing:
                # 1. We generate a compressed version of the output with stopwords removed
                # 2. We calculate token counts for both compressed and uncompressed versions
                # 3. We inform the user about both files being created
                #
                # This is particularly useful for fitting more content within token limits of LLMs,
                # but at the cost of readability and potentially altered code semantics.
                console.print("\n[bright_magenta]Compression and NLTK processing enabled.[/bright_magenta]")
                # Process the compressed output
                preprocess_text(output_file, processed_file)

                compressed_text = safe_file_read(processed_file)
                compressed_token_count = get_token_count(compressed_text)
                console.print(f"\n[bright_green]Compressed Token Count:[/bright_green] [bold bright_cyan]{compressed_token_count}[/bold bright_cyan]")
            else:
                # When the compression flag is disabled (default):
                # 1. We skip NLTK downloads and stopword processing entirely
                # 2. We only generate the uncompressed output file with raw, readable code
                # 3. The output maintains exact formatting and syntax of the original code
                #
                # This is the recommended setting for code readability and preservation.
                # If not compressing, advance progress proportionally
                progress.update(task, advance=25) # Adjust progress if needed
            # --- End Conditional Compression Block ---

            uncompressed_text = safe_file_read(output_file)
            uncompressed_token_count = get_token_count(uncompressed_text)
            # Always print uncompressed token count
            console.print(f"[bright_green]Uncompressed Token Count:[/bright_green] [bold bright_cyan]{uncompressed_token_count}[/bold bright_cyan]")

            # Adjust the final output message
            if settings.ENABLE_COMPRESSION_AND_NLTK:
                console.print(f"\n[bold bright_yellow]{processed_file}[/bold bright_yellow] and [bold bright_blue]{output_file}[/bold bright_blue] have been created.")
            else:
                console.print(f"\n[bold bright_blue]{output_file}[/bold bright_blue] has been created.")

            pyperclip.copy(uncompressed_text)
            console.print(f"\n[bright_white]The contents of [bold bright_blue]{output_file}[/bold bright_blue] have been copied to the clipboard.[/bright_white]")
            progress.update(task, advance=25) # Final progress step

        except Exception as e:
            console.print(f"\n[bold red]An error occurred:[/bold red] {str(e)}")
            console.print("\nPlease check your input and try again.")
            raise  # Re-raise the exception for debugging purposes
        
if __name__ == "__main__":
    main()
