from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Resume(BaseModel):
    id: int
    content: str

class JobDescription(BaseModel):
    description: str

class RankedResume(BaseModel):
    id: int
    score: float

class RankingResponse(BaseModel):
    ranked_resumes: List[RankedResume]

# Mock ranking function
def rank_resumes(job_description: str, resumes: List[Resume]) -> List[RankedResume]:
    # Replace this with your actual ranking logic
    ranked = []
    for resume in resumes:
        score = len(set(job_description.split()) & set(resume.content.split()))  # Example scoring logic
        ranked.append(RankedResume(id=resume.id, score=score))
    return sorted(ranked, key=lambda x: x.score, reverse=True)

@app.post("/rank-resumes", response_model=RankingResponse)
async def rank_resumes_endpoint(job_description: JobDescription, resumes: List[Resume]):
    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes provided")
    ranked_resumes = rank_resumes(job_description.description, resumes)
    return RankingResponse(ranked_resumes=ranked_resumes)