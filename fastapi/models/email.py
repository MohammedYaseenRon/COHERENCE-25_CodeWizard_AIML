from typing import Dict, Any, List, Optional
from pydantic import BaseModel, EmailStr, Field

class EmailCredentials(BaseModel):
    sender_email: Optional[EmailStr] = Field(None, description="Sender email")
    password: Optional[str] = Field(None, description="Sender password")

class SendIndividualEmailRequest(EmailCredentials):
    ranked_resumes: List[Dict[str, Any]]
    candidate_index: int
    job_description: Dict[str, Any] = Field(default_factory=dict)
    project_options: Dict[str, Any] = Field(default_factory=dict)
    company_info: Dict[str, Any] = Field(default_factory=dict)

class SendBulkEmailRequest(EmailCredentials):
    ranked_resumes: List[Dict[str, Any]]
    job_description: Dict[str, Any] = Field(default_factory=dict)
    project_options: Optional[Dict[str, Any]] = Field(default_factory=dict)
    company_info: Optional[Dict[str, Any]] = Field(default_factory=dict)
