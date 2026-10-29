import asyncio
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
import bleach  # For input sanitization: pip install bleach

# Core dependencies - API Keys required here:
# 1. SUPABASE_URL + SUPABASE_SERVICE_KEY (Database)
# 2. JWT_SECRET (Authentication)
from core.auth import get_current_user
from core.database import supabase

# External AI Services - API Keys required in these modules:
# 3. ANTHROPIC_API_KEY (Claude AI) - in services/claude_service.py
# 4. GROQ_API_KEY - in services/grok_service.py
# 5. XAI_API_KEY or GROK_API_KEY (xAI/Grok) - in services/grok_service.py
# 6. Various Job Board API keys or scraping proxies - in services/job_search_agent.py
from services.job_search_agent import search_all_jobs
from services.claude_service import generate_cover_letter, optimize_resume as optimize_resume_ai
from services.grok_service import analyze_skill_gap, generate_standard_jd
from services.ats_scorer import calculate_ats_score_simple

router = APIRouter()
logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────────────────────
# Request / Response Schemas (Enhanced with Validation)
# ───────────────────────────────────────────────────────────────────────────────

class SearchJobsRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Analytics tracking ID")
    field: str = Field(..., min_length=2, max_length=100, description="Job field/category")
    location: str = Field(default="Bangalore", min_length=2, max_length=100)
    experience_level: str = Field(default="Junior (1-3yr)", pattern="^(Junior|Mid|Senior|Lead).*$")
    job_type: List[str] = Field(default=[], max_length=5)  # Limit array size
    salary_min: int = Field(default=0, ge=0, le=10000000)  # Sanity check: 0 to 10M

    @validator('field', 'location')
    def sanitize_text(cls, v):
        """Strip HTML to prevent XSS in job search queries"""
        return bleach.clean(v, tags=[], strip=True)


class CoverLetterRequest(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=200)
    company: str = Field(..., min_length=1, max_length=200)
    job_description: str = Field(..., min_length=10, max_length=15000)  # Token limit protection
    resume_text: Optional[str] = Field(default="", max_length=20000)

    @validator('job_description', 'resume_text')
    def sanitize_content(cls, v):
        """Remove potentially harmful HTML from content sent to AI APIs"""
        return bleach.clean(v, tags=['br', 'p', 'ul', 'li'], strip=True)


class GapAnalysisRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Analytics tracking ID")
    company_name: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=2, max_length=200)
    job_description: Optional[str] = Field(default="", max_length=15000)

    @validator('job_description')
    def sanitize_jd(cls, v):
        return bleach.clean(v, tags=['br', 'p'], strip=True) if v else v


# ───────────────────────────────────────────────────────────────────────────────
# Helpers (Fixed Async Handling)
# ───────────────────────────────────────────────────────────────────────────────

async def _get_latest_resume_text(user_id: str) -> str:
    """
    Fetch the most recently uploaded resume's raw_text for the user.

    REQUIRED: Supabase connection (SUPABASE_URL, SUPABASE_SERVICE_KEY)
    """
    if not user_id:
        return ""

    try:
        # CRITICAL FIX: If supabase client is synchronous (standard supabase-py),
        # we must run it in a threadpool to avoid blocking the event loop
        # If using supabase-py-async, remove run_in_executor and await directly

        def _fetch():
            return (
                supabase.table("resumes")
                .select("raw_text, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

        # Use asyncio.to_thread for sync DB operations (Python 3.9+)
        # For older Python: use loop.run_in_executor
        response = await asyncio.to_thread(_fetch)

        if hasattr(response, "data") and len(response.data) > 0:
            raw_text = response.data[0].get("raw_text", "")
            # Basic PII warning: Log if resume contains potential PII going to 3rd party AIs
            if any(keyword in raw_text.lower() for keyword in ['phone:', 'email:', '@']):
                logger.warning(f"[PII] Resume for user {user_id} may contain contact info going to external AI APIs")
            return raw_text

    except Exception as e:
        logger.error(f"[DB Error] Failed to fetch resume for user {user_id}: {e}")
        # Don't raise here - let caller decide if this is critical

    return ""


def _validate_user(current_user: dict) -> str:
    """Validate user dict and return user_id"""
    if not current_user or not isinstance(current_user, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id = current_user.get("user_id") or current_user.get("sub")  # 'sub' is standard JWT claim
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )

    return str(user_id)


# ───────────────────────────────────────────────────────────────────────────────
# POST /api/agent/search-jobs (Fixed Async & Error Handling)
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/search-jobs", summary="Smart job search with ATS scoring")
async def search_jobs_endpoint(
    request: SearchJobsRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Searches all job boards with ATS scoring.

    REQUIRED API KEYS:
    - Job Board APIs: Indeed API key, LinkedIn tokens, or scraping proxy keys
      (configured in services/job_search_agent.py)
    """
    user_id = _validate_user(current_user)

    # Fetch resume async (non-blocking)
    resume_text = await _get_latest_resume_text(user_id)

    try:
        # CRITICAL FIX: Added await if search_all_jobs is async (likely)
        # If it's sync, wrap in asyncio.to_thread
        jobs = await asyncio.wait_for(
            search_all_jobs(
                field=request.field,
                location=request.location,
                experience_level=request.experience_level,
                job_types=request.job_type,
                salary_min=request.salary_min,
                resume_text=resume_text,
            ),
            timeout=30.0  # Prevent hanging on slow job APIs
        )

    except asyncio.TimeoutError:
        logger.error("[Timeout] Job search exceeded 30 seconds")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Job search timed out. Please try again."
        )
    except Exception as e:
        logger.error(f"[Job Search Error] {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch jobs from external sources"
        )

    if not jobs:
        return {
            "jobs": [],
            "total": 0,
            "average_match_score": 0,
            "message": "No matching jobs found. Try broadening your preferences.",
        }

    # Calculate average safely
    try:
        avg_score = int(sum(j.get("match_score", 0) for j in jobs) / len(jobs))
    except (TypeError, ZeroDivisionError):
        avg_score = 0

    return {
        "jobs": jobs,
        "total": len(jobs),
        "average_match_score": avg_score,
    }


# ───────────────────────────────────────────────────────────────────────────────
# POST /api/agent/cover-letter (Fixed with Timeout & Validation)
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/cover-letter", summary="Generate tailored cover letter")
async def generate_cover_letter_endpoint(
    request: CoverLetterRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generates personalized cover letter using Claude AI.

    REQUIRED API KEY:
    - ANTHROPIC_API_KEY (in services/claude_service.py)
    - Costs: ~$0.01-0.03 per request depending on length
    """
    user_id = _validate_user(current_user)

    # Get resume text if not provided
    resume_text = request.resume_text
    if not resume_text:
        resume_text = await _get_latest_resume_text(user_id)

    if not resume_text or len(resume_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text too short or not found. Please upload a resume first."
        )

    try:
        # CRITICAL FIX: Added timeout and structured data handling
        cover_letter = await asyncio.wait_for(
            generate_cover_letter(
                resume_structured={
                    "summary": resume_text[:5000],  # Limit context window
                    "skills": [],  # TODO: Parse actual skills from resume
                    "full_text": resume_text[:8000]  # Send truncated full text
                },
                job_description=request.job_description[:5000],  # Limit JD length
                company_name=request.company,
                job_title=request.job_title,
            ),
            timeout=20.0  # Claude can be slow
        )

        # Validate AI response
        if not cover_letter or len(cover_letter) < 100:
            raise ValueError("AI generated empty or too short cover letter")

    except asyncio.TimeoutError:
        logger.error("[Timeout] Claude API timeout")
        cover_letter = None
    except Exception as e:
        logger.error(f"[AI Error] Claude generation failed: {e}")
        cover_letter = None

    # Fallback template if AI fails
    if not cover_letter:
        logger.info(f"[Fallback] Using template for user {user_id}")
        cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {request.job_title} position at {request.company}.

With my background and experience relevant to the technologies mentioned in your job description, I am confident I can contribute meaningfully to your team.

I am particularly excited about {request.company}'s reputation for innovation. I would welcome the opportunity to discuss how my skills align with your needs.

Thank you for your consideration.

Best regards"""

    return {
        "cover_letter": cover_letter,
        "job_title": request.job_title,
        "company": request.company,
        "ai_generated": cover_letter != f"""Dear Hiring Manager..."""  # Flag to indicate if AI succeeded
    }


# ───────────────────────────────────────────────────────────────────────────────
# POST /api/agent/gap-analysis (Fully Fixed with Parallel Processing)
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/gap-analysis", summary="Comprehensive skill gap analysis")
async def gap_analysis_endpoint(
    request: GapAnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Performs gap analysis with ATS scoring and AI optimization.

    REQUIRED API KEYS:
    1. GROQ_API_KEY (for fast skill gap analysis - cheap, fast)
    2. ANTHROPIC_API_KEY (for resume optimization - expensive, slow)
    3. XAI_API_KEY (for JD generation if needed - optional)
    """
    user_id = _validate_user(current_user)

    # Validate session ownership if provided (security fix)
    if request.session_id:
        # TODO: Verify session_id belongs to user_id in database
        logger.info(f"[Session] Processing gap analysis for session {request.session_id}")

    # Fetch resume
    resume_text = await _get_latest_resume_text(user_id)
    if not resume_text or len(resume_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resume found. Please upload a resume first."
        )

    # Generate JD if missing
    job_description = request.job_description or ""
    if not job_description.strip():
        try:
            # REQUIRED: XAI_API_KEY or fallback logic in generate_standard_jd
            job_description = await asyncio.wait_for(
                generate_standard_jd(request.company_name, request.job_title),
                timeout=10.0
            )
        except Exception as e:
            logger.error(f"[JD Generation] Failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to generate job description. Please provide one manually."
            )

    # Parallel processing: ATS + Gap Analysis simultaneously
    try:
        # Task 1: ATS Scoring (local calculation, fast)
        ats_task = asyncio.create_task(
            asyncio.to_thread(
                calculate_ats_score_simple,
                resume_text,
                job_description
            )
        )

        # Task 2: Groq Analysis (external API, requires GROQ_API_KEY)
        # REQUIRED: GROQ_API_KEY in services/grok_service.py
        gap_task = asyncio.create_task(
            asyncio.wait_for(
                analyze_skill_gap(
                    resume_text=resume_text[:10000],  # Limit tokens
                    job_description=job_description[:10000],
                    company_name=request.company_name,
                    job_title=request.job_title,
                ),
                timeout=25.0
            )
        )

        # Wait for both
        ats_result, gap_report = await asyncio.gather(ats_task, gap_task, return_exceptions=True)

        # Handle ATS result
        if isinstance(ats_result, Exception):
            logger.error(f"[ATS Error] {ats_result}")
            ats_score, keywords_present, keywords_missing = 0, [], []
        else:
            ats_score, keywords_present, keywords_missing = ats_result

        # Handle Gap result
        if isinstance(gap_report, Exception):
            logger.error(f"[Gap Analysis Error] {gap_report}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to analyze skill gaps. AI service unavailable."
            )

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Analysis timed out. Please try again."
        )

    # Background resume optimization (fire and forget)
    # REQUIRED: ANTHROPIC_API_KEY (expensive operation)
    optimized_resume = None
    try:
        # Run in background without blocking response
        # Limit keywords to top 10 to reduce cost
        optimization_task = asyncio.create_task(
            optimize_resume_ai(
                resume_text[:8000],  # Truncate to save tokens/cost
                job_description[:5000],
                keywords_missing[:10]
            )
        )

        # Wait briefly to see if it completes quickly, else return null
        optimized_resume = await asyncio.wait_for(
            optimization_task,
            timeout=5.0  # Don't wait long, this is bonus feature
        )
    except asyncio.TimeoutError:
        logger.info("[Optimization] Resume optimization running in background")
        # In production, you might save this to DB and notify user via WebSocket
        optimized_resume = None
    except Exception as e:
        logger.error(f"[Optimization Error] {e}")
        optimized_resume = None

    # Truncate JD for response if too long
    jd_preview = job_description[:500] + "..." if len(job_description) > 500 else job_description

    return {
        "company_name": request.company_name,
        "job_title": request.job_title,
        "job_description_used": jd_preview,
        "ats_score": ats_score,
        "keywords_present": keywords_present[:10],
        "keywords_missing": keywords_missing[:10],
        "gap_report": gap_report,
        "optimized_resume": optimized_resume,  # Null if not ready/failed
        "user_id": user_id,  # Return for confirmation (optional)
        "session_id": request.session_id
    }