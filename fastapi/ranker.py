import asyncio
import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ResumeRankingService:
    def __init__(self):
        load_dotenv()
        self.genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    def load_resumes(self, resumes_file):
        """
        Load resumes from JSON file
        """
        try:
            with open(resumes_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Resumes file not found")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in resumes file")

    async def rank_resumes_with_gemini(self, job_description, resumes):
        """
        Rank resumes using Gemini's advanced matching capabilities
        Includes full resume analysis for each ranked resume
        """
        ranked_resumes = []

        for filename, resume_data in resumes.items():
            # Skip entries with errors
            if 'error' in resume_data:
                continue

            # Convert resume data to a comprehensive text representation
            resume_text = self._convert_resume_to_text(resume_data)

            # Use Gemini to assess job match
            prompt = f"""
            Job Description:
            {job_description}

            Resume:
            {resume_text}

            TASK: Evaluate how well this resume matches the job description.
            REQUIREMENTS:
            1. Provide a match percentage (0-100%)
            2. List key matching skills and experiences
            3. Identify any significant gaps
            4. Explain your reasoning briefly

            Respond in JSON format:
            {{
                "match_percentage": float,
                "matching_skills": list,
                "gaps": list,
                "reasoning": string
            }}
            """

            try:
                response = self.genai_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=[prompt],
                    config={
                        'response_mime_type': 'application/json',
                    }
                )

                # Parse Gemini's response
                match_data = json.loads(response.text)
                
                # Add full resume data
                match_data['filename'] = filename
                match_data['full_resume'] = resume_data
                
                ranked_resumes.append(match_data)

            except Exception as e:
                print(f"Error processing {filename}: {e}")

        # Sort resumes by match percentage in descending order
        return sorted(ranked_resumes, key=lambda x: x.get('match_percentage', 0), reverse=True)
    def _convert_resume_to_text(self, resume_data):
        if resume_data is None:
            return ""

        text_parts = []

        # Contact Info
        contact_info = resume_data.get('contact_info', {})
        text_parts.append(f"Name: {contact_info.get('full_name', 'N/A')}")
        text_parts.append(f"Email: {contact_info.get('email', 'N/A')}")
        text_parts.append(f"Location: {contact_info.get('location', 'N/A')}")

        # Education
        text_parts.append("Education:")
        for edu in resume_data.get('education', []):
            text_parts.append(f"- {edu.get('degree', 'N/A')} from {edu.get('institution', 'N/A')}")

        # Work Experience
        text_parts.append("Work Experience:")
        for exp in resume_data.get('work_experience', []):
            text_parts.append(f"- {exp.get('job_title', 'N/A')} at {exp.get('company', 'N/A')}")
            for responsibility in exp.get('responsibilities', []):
                text_parts.append(f"  * {responsibility}")

        skills = resume_data.get('skills', {})
        technical_skills = skills.get('technical_skills', [])
        if technical_skills:
            text_parts.append("Technical Skills:")
            text_parts.extend([f"- {skill}" for skill in technical_skills])

        soft_skills = skills.get('soft_skills')
        if soft_skills:
            if isinstance(soft_skills, list):
                text_parts.append("Soft Skills: " + ", ".join(soft_skills))
            elif isinstance(soft_skills, str):
                text_parts.append(f"Soft Skills: {soft_skills}")

        # Certifications
        certifications = skills.get('certifications', [])
        if certifications:
            text_parts.append("Certifications:")
            text_parts.extend([f"- {cert}" for cert in certifications])

        # Projects
        projects = resume_data.get('projects', [])
        if projects:
            text_parts.append("Projects:")
            for project in projects:
                text_parts.append(f"- {project.get('name', 'N/A')}")
                text_parts.append(f"  Description: {project.get('description', 'N/A')}")

        return " ".join(text_parts)

    def rank_resumes_with_cosine_similarity(self, job_description, resumes):
        """
        Fallback ranking method using cosine similarity
        """
        # Extract text from resumes
        resume_texts = [
            self._convert_resume_to_text(resume_data) 
            for resume_data in resumes.values() 
            if 'error' not in resume_data
        ]

        documents = [job_description] + resume_texts
        vectorizer = TfidfVectorizer().fit_transform(documents)
        vectors = vectorizer.toarray()

        # Calculate cosine similarity
        job_description_vector = vectors[0]
        resume_vectors = vectors[1:]
        cosine_similarities = cosine_similarity([job_description_vector], resume_vectors).flatten()

        # Rank resumes
        ranked_resumes = list(zip(list(resumes.keys())[1:], cosine_similarities))
        return sorted(ranked_resumes, key=lambda x: x[1], reverse=True)