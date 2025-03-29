import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
import re

def clean_json_response(text: str) -> dict:
    """
    Removes markdown formatting ('''json ... ''') from the response and extracts JSON safely.
    """
    # Extract JSON block using regex
    match = re.search(r"\{.*\}", text, re.DOTALL)  # Find JSON-like structure
    if match:
        json_str = match.group(0)  # Extract matched JSON part
        try:
            return json.loads(json_str)  # Attempt to parse JSON
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            return {}  # Return empty dict on failure
    else:
        print("No valid JSON found in response.")
        return {}  # Return empty dict if no JSON found


class EmailGenerator:
    """
    A class to generate and send automated project assignment emails based on candidate profiles
    and job descriptions, using Gemini for complex matching and content generation.
    """
    
    def __init__(self, smtp_server: str = "smtp.gmail.com", smtp_port: int = 587):
        """
        Initialize the EmailGenerator with SMTP settings.
        
        Args:
            smtp_server: SMTP server address
            smtp_port: SMTP server port
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.gemini_client = None
        self.repo_assignments_file = "repo_assignments.json"
        self.repo_assignments = self._load_repo_assignments()
        
    def initialize_gemini(self, api_key: str = None):
        """
        Initialize the Gemini client with an API key.
        
        Args:
            api_key: Gemini API key. If None, will try to get from environment variable GOOGLE_API_KEY
        """
        api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key not provided and GOOGLE_API_KEY environment variable not set")
        self.gemini_client = genai.Client(api_key=api_key)

    def _load_repo_assignments(self) -> Dict[str, str]:
        """
        Loads the repository assignments from the JSON file.

        Returns:
            A dictionary where keys are candidate identifiers and values are repository names.
        """
        try:
            with open(self.repo_assignments_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}  # Return an empty dictionary if the file doesn't exist
        except json.JSONDecodeError:
            print(f"Warning: {self.repo_assignments_file} is corrupted. Starting with an empty assignment list.")
            return {}  # Return an empty dictionary if the file is corrupted

    def _save_repo_assignment(self, candidate_identifier: str, repo_name: str):
        """
        Saves a repository assignment to the in-memory dictionary and the JSON file.

        Args:
            candidate_identifier: Unique identifier for the candidate.
            repo_name: The name of the repository assigned to the candidate.
        """
        self.repo_assignments[candidate_identifier] = repo_name
        try:
            with open(self.repo_assignments_file, "w") as f:
                json.dump(self.repo_assignments, f, indent=4)
        except IOError as e:
            print(f"Error saving repo assignments to file: {e}")
    
    def _generate_assignment_content(
        self, 
        candidate_profile: Dict[str, Any], 
        job_description: Dict[str, Any],
        project_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:  # Changed return type annotation to Dict[str, Any]
        """
        Use Gemini to generate personalized project assignment content based on profile and job description.
        
        Args:
            candidate_profile: Candidate's profile/resume data (any schema)
            job_description: Job description data (any format)
            project_options: Optional project options to consider for assignment
            
        Returns:
            Dictionary containing generated subject and body content
        """
        if not self.gemini_client:
            raise RuntimeError("Gemini client not initialized. Call initialize_gemini() first.")
        
        # Prepare prompt for Gemini
        prompt = f"""
        You are an expert HR assistant that matches candidates to suitable projects based on their 
        profiles and job requirements. Generate a personalized project assignment email for the 
        candidate described below.
        
        Candidate Profile:
        {json.dumps(candidate_profile, indent=2)}
        
        Job Description:
        {json.dumps(job_description, indent=2)}
        
        Available Projects (optional):
        {json.dumps(project_options or {}, indent=2)}
        
        Generate output in the following JSON structure:
        {{
            "subject": "Email subject line",
            "greeting": "Personalized greeting",
            "introduction": "Paragraph introducing the assignment",
            "project_details": {{
                "name": "Project name",
                "description": "Detailed project description",
                "requirements": ["list", "of", "specific", "requirements"],
                "expected_outcomes": ["list", "of", "expected", "outcomes"]
            }},
            "repository_name": "Repository name for the project",
            "next_steps": "Instructions for what the candidate should do next",
            "closing": "Professional closing remarks"
        }}
        
        Guidelines:
        1. The project assignment should closely match the candidate's skills and experience
        2. The language should be professional but friendly
        3. Include specific details about why this project was chosen for this candidate
        4. Make the expectations and next steps very clear
        5. Keep the total email length reasonable (3-5 paragraphs)
        """
        
        # Call Gemini API
        response = self.gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        print(response.text)

        # Parse and clean the response
        content = clean_json_response(response.text)
        
        return content
    
    def _construct_email(
        self,
        sender_email: str,
        receiver_email: str,
        content: Dict[str, Any],
        company_info: Optional[Dict[str, str]] = None
    ) -> MIMEMultipart:
        """
        Construct the email message from generated content.

        Args:
            sender_email: Email address of sender
            receiver_email: Email address of recipient
            content: Generated content from Gemini
            company_info: Optional company information to include in signature

        Returns:
            Constructed MIMEMultipart email message
        """
        company_info = company_info or {
            "name": "Your Company",
            "contact_email": "hr@company.com",
            "website": "www.company.com"
        }

        # Add fallback values for missing content
        if 'greeting' not in content:
            content['greeting'] = "Dear Candidate"
        if 'introduction' not in content:
            content['introduction'] = "We're pleased to assign you to a project based on your skills and experience."
        if 'project_details' not in content:
            content['project_details'] = {
                "name": "Custom Project Assignment",
                "description": "A project tailored to your qualifications",
                "requirements": [],
                "expected_outcomes": []
            }
        if 'next_steps' not in content:
            content['next_steps'] = "Please review the details and confirm your acceptance."
        if 'closing' not in content:
            content['closing'] = "We look forward to working with you."

        # Ensure project_details has all required fields
        pd = content.get('project_details', {})
        if not isinstance(pd.get('requirements', None), list):
            pd['requirements'] = []
        if not isinstance(pd.get('expected_outcomes', None), list):
            pd['expected_outcomes'] = []

        # Convert requirements and expected outcomes to comma-separated strings
        req_str = ", ".join(pd.get('requirements', []))
        outcomes_str = ", ".join(pd.get('expected_outcomes', []))

        repository_name = content.get('repository_name', 'Project Repository')

        # Construct email body from content
        body = f"""
        {content['greeting']}

        {content['introduction']}

        Project Assignment Details:
        - Project Name: {pd.get('name', 'Project Assignment')}
        - Description: {pd.get('description', 'A tailored project assignment')}
        - Key Requirements: {req_str}
        - Expected Outcomes: {outcomes_str}
        - Project Repository Name: {repository_name}

        {content['next_steps']}

        {content['closing']}

        Best Regards,
        {company_info['name']}
        Email: {company_info['contact_email']}
        Website: {company_info['website']}
        """

        # Set up the MIME message
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = receiver_email
        message["Subject"] = content.get('subject', 'Project Assignment Notification')
        message.attach(MIMEText(body, "plain"))

        return message
    
    def get_github_username(self, candidate_profile: Dict[str, Any], receiver_email: str) -> str:
        """
        Safely retrieves the GitHub username from the candidate profile.

        Args:
            candidate_profile: The candidate's profile dictionary.
            receiver_email: Fallback email address if GitHub is not found.

        Returns:
            The GitHub username or the receiver email if not found.
        """
        if "contactinfo" in candidate_profile and isinstance(candidate_profile["contactinfo"], dict):
            contact_info = candidate_profile["contactinfo"]
            if "github" in contact_info:
                return contact_info["github"]
        return receiver_email

    def send_assignment_email(
        self,
        sender_email: str,
        receiver_email: str,
        password: str,
        candidate_profile: Dict[str, Any],
        job_description: Dict[str, Any],
        project_options: Optional[Dict[str, Any]] = None,
        company_info: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Generate and send a project assignment email to a candidate.

        Args:
            sender_email: Email address of sender
            receiver_email: Email address of recipient
            password: SMTP password or app-specific password
            candidate_profile: Candidate's profile/resume data
            job_description: Job description data
            project_options: Optional project options to consider
            company_info: Optional company information for signature

        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            # Generate content with Gemini
            content = self._generate_assignment_content(
                candidate_profile,
                job_description,
                project_options
            )
            contact_identifier = None

            # Extract repository name from Gemini's response
            repository_name = content.get("repository_name", "DefaultProjectRepo")
            
            github_username = self.get_github_username(candidate_profile, receiver_email)

            # Use the github_username as the candidate identifier.
            candidate_identifier = candidate_profile.get("email", github_username)

            if not candidate_identifier:
                print("Warning: Could not determine candidate identifier. Repository assignment not saved.")
            else:
                self._save_repo_assignment(candidate_identifier, repository_name)

            # Construct email
            message = self._construct_email(
                sender_email,
                receiver_email,
                content,
                company_info
            )

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(sender_email, password)
                server.sendmail(sender_email, receiver_email, message.as_string())

            return True
        except Exception as e:
            print(f"Error sending assignment email: {e}")
            return False