from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ResumeStructuredContent(BaseModel):
    summary: str
    experience_text: str
    education_text: str
    skills_text: str
    projects_text: str
    certifications_text: str
    full_text: str

class UploadResumeResponse(BaseModel):
    resume_id: str
    structured: Dict[str, Any]
    pdf_url: str
    character_count: int

class ResumeListResponse(BaseModel):
    id: str
    name: str
    pdf_url: Optional[str] = None
    created_at: datetime

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    name: str
    raw_text: Optional[str] = None
    structured: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    created_at: datetime

class OptimizeResumeRequest(BaseModel):
    resume_id: str
    job_description: str
    company_name: str
    job_title: str

class OptimizeResumeResponse(BaseModel):
    optimization_id: str
    before_ats_score: int
    after_ats_score: int
    keywords_added: List[str]
    optimized: Dict[str, Any]
    score_improvement: int
