from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Literal
from core.auth import get_current_user
from core.database import supabase
from services.claude_service import generate_cover_letter as generate_cl
from services.pdf_generator import generate_cover_letter_pdf
import tempfile, os

router = APIRouter()


class GenerateCoverLetterRequest(BaseModel):
    optimization_id: str
    tone: Literal['professional', 'enthusiastic', 'conversational'] = 'professional'


class CoverLetterResponse(BaseModel):
    cover_letter: str
    optimization_id: str


@router.post("/generate", response_model=CoverLetterResponse, summary="Generate cover letter")
async def generate_cover_letter(
    request: GenerateCoverLetterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates a tailored cover letter based on the optimization record.
    Uses the resume and job description to create a personalized letter.
    """
    user_id = current_user.get("user_id")
    
    # Step 1: Get optimization record and verify ownership
    opt_response = supabase.table("optimizations").select("*").eq("id", request.optimization_id).execute()
    
    if not hasattr(opt_response, 'data') or len(opt_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    optimization = opt_response.data[0]
    
    # Verify ownership
    if optimization.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    # Step 2: Get resume structured data
    resume_id = optimization.get("resume_id")
    if not resume_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resume linked to this optimization."
        )
    
    resume_response = supabase.table("resumes").select("structured").eq("id", resume_id).execute()
    
    if not hasattr(resume_response, 'data') or len(resume_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
    
    resume_structured = resume_response.data[0].get("structured", {})
    
    # Step 3: Get job description from job_application if linked
    job_description = ""
    company_name = "the company"
    job_title = "the position"
    
    job_app_id = optimization.get("job_app_id")
    if job_app_id:
        job_response = supabase.table("job_applications") \
            .select("job_description, company_name, job_title") \
            .eq("id", job_app_id) \
            .execute()
        
        if hasattr(job_response, 'data') and len(job_response.data) > 0:
            job_data = job_response.data[0]
            job_description = job_data.get("job_description", "")
            company_name = job_data.get("company_name", "the company")
            job_title = job_data.get("job_title", "the position")
    
    # If no job app linked, try to get from optimization's before_text or use generic
    if not job_description:
        job_description = "a challenging role that matches your skills and experience"
    
    # Step 4: Adjust tone in system prompt
    tone_adjustments = {
        'professional': "Maintain a formal, professional tone throughout.",
        'enthusiastic': "Use an enthusiastic and energetic tone while remaining professional.",
        'conversational': "Use a warm, conversational tone that feels personal and authentic."
    }
    
    tone_instruction = tone_adjustments.get(request.tone, tone_adjustments['professional'])
    
    # Step 5: Call Claude service to generate cover letter
    try:
        cover_letter_text = await generate_cl(
            resume_structured,
            job_description,
            company_name,
            job_title
        )
        
        # Add tone adjustment note to the prompt if needed
        # For now, the base function handles professional tone
        # You could extend claude_service.generate_cover_letter to accept tone parameter
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}"
        )
    
    # Step 6: Update optimizations table with generated cover letter
    try:
        supabase.table("optimizations") \
            .update({"cover_letter": cover_letter_text}) \
            .eq("id", request.optimization_id) \
            .execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to save cover letter to database: {str(e)}")
    
    # Step 7: Return response
    return {
        "cover_letter": cover_letter_text,
        "optimization_id": request.optimization_id
    }


@router.get("/{optimization_id}", response_model=CoverLetterResponse, summary="Get saved cover letter")
async def get_cover_letter(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves a previously generated cover letter for an optimization.
    Returns 404 if not yet generated.
    """
    user_id = current_user.get("user_id")
    
    # Get optimization record and verify ownership
    response = supabase.table("optimizations") \
        .select("cover_letter, user_id") \
        .eq("id", optimization_id) \
        .execute()
    
    if not hasattr(response, 'data') or len(response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    optimization = response.data[0]
    
    # Verify ownership
    if optimization.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    cover_letter = optimization.get("cover_letter")
    
    if not cover_letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not yet generated for this optimization."
        )
    
    return {
        "cover_letter": cover_letter,
        "optimization_id": optimization_id
    }


@router.get("/download/{optimization_id}", summary="Download cover letter as PDF")
async def download_cover_letter_pdf(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Downloads the cover letter as a professionally formatted PDF.
    Returns 404 if cover letter not yet generated.
    """
    user_id = current_user.get("user_id")
    
    # Get optimization and cover letter
    response = supabase.table("optimizations") \
        .select("cover_letter, user_id") \
        .eq("id", optimization_id) \
        .execute()
    
    if not hasattr(response, 'data') or len(response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    optimization = response.data[0]
    
    # Verify ownership
    if optimization.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    cover_letter = optimization.get("cover_letter")
    
    if not cover_letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not yet generated for this optimization."
        )
    
    # Get user profile for candidate name
    profile_response = supabase.table("user_profiles") \
        .select("full_name") \
        .eq("id", user_id) \
        .execute()
    
    candidate_name = "Candidate"
    if hasattr(profile_response, 'data') and len(profile_response.data) > 0:
        candidate_name = profile_response.data[0].get("full_name", "Candidate")
    
    # Generate PDF in temporary file
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        os.close(fd)  # Close the file descriptor
        
        # Generate the PDF
        generate_cover_letter_pdf(cover_letter, candidate_name, temp_path)
        
        # Return the file
        return FileResponse(
            path=temp_path,
            media_type="application/pdf",
            filename=f"cover_letter_{optimization_id[:8]}.pdf",
            background=None  # Don't delete immediately, let FastAPI handle it
        )
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )
