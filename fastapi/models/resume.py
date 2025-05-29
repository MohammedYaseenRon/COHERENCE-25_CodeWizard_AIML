from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

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