from typing import List
from pydantic import BaseModel, Field

class BiasAnalysisRequest(BaseModel):
    job_title: str = Field(..., description="Job title for which bias analysis is needed")
    job_description: str = Field(..., description="Complete job description")
    analysis_types: List[str] = Field(
        default=["gender", "age", "ethnicity", "education", "experience"],
        description="Types of biases to analyze"
    )

    class Config:
        extra = "allow"