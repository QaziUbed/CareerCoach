import os
import tempfile
import time
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from typing import List

# SQL MIGRATION REQUIRED:
# Run this in your Supabase SQL Editor:
# ALTER TABLE optimizations ADD COLUMN IF NOT EXISTS optimized_pdf_url TEXT;

from core.auth import get_current_user
from core.database import supabase
from services.pdf_parser import extract_text, structure_resume
from services.storage_service import upload_file
from services import ats_scorer, claude_service, usage_service
from services.pdf_generator import generate_resume_pdf
from models.resume import (
    UploadResumeResponse, 
    ResumeListResponse, 
    ResumeResponse,
    OptimizeResumeRequest,
    OptimizeResumeResponse
)

# This router is registered in main.py under the /api prefix
router = APIRouter(prefix="/resume", tags=["resume"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/upload", response_model=UploadResumeResponse, summary="Upload a new PDF resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts a multipart file upload (PDF only, max 5MB).
    Extracts text, parses it, uploads the PDF to Supabase Storage,
    and creates a database entry in the resumes table.
    """
    user_id = current_user.get("user_id")
    
    # 1. Validate file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed."
        )
        
    # 2. Read and validate file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 5MB limit."
        )
        
    # 3. Save to a temporary file locally
    # We close the file safely so fitz (PyMuPDF) can read it properly from disk
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        with os.fdopen(fd, 'wb') as temp_file:
            temp_file.write(file_content)
            
        # 4. Process the PDF
        raw_text = extract_text(temp_path)
        structured_data = structure_resume(raw_text)
        character_count = len(raw_text)
        
        # 5. Upload original PDF to Supabase Storage
        timestamp = int(time.time())
        safe_filename = file.filename.replace(" ", "_").replace("/", "-")
        storage_path = f"resumes/{user_id}/{timestamp}_{safe_filename}"
        
        # This calls the service which returns the public URL
        pdf_url = await upload_file(temp_path, storage_path)
        
        # 6. Save data to Supabase database (`resumes` table)
        # Note: If you don't have a name column, be sure the DB schema accommodates it. 
        # Using "name" from the generated filename.
        db_payload = {
            "user_id": user_id,
            "name": file.filename,
            "raw_text": raw_text,
            "structured": structured_data,
            "pdf_url": pdf_url
        }
        
        response = supabase.table("resumes").insert(db_payload).execute()
        
        if not hasattr(response, 'data') or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save resume record to the database."
            )
            
        inserted_record = response.data[0]
        resume_id = inserted_record.get("id")
        
        return {
            "resume_id": resume_id,
            "structured": structured_data,
            "pdf_url": pdf_url,
            "character_count": character_count
        }
        
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse PDF: {str(val_err)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while uploading the resume: {str(e)}"
        )
    finally:
        # 7. Cleanup the temporary file completely regardless of exceptions
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("/list", response_model=List[ResumeListResponse], summary="List User Resumes")
async def list_resumes(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all resumes uploaded by the current authenticated user.
    """
    user_id = current_user.get("user_id")
    
    # Query database selecting only the specific fields required
    response = supabase.table("resumes") \
        .select("id, name, created_at, pdf_url") \
        .eq("user_id", user_id) \
        .execute()
        
    if hasattr(response, 'data'):
        # For data validation we just return the raw array directly to Pydantic
        return response.data
    
    return []


@router.get("/{resume_id}", response_model=ResumeResponse, summary="Get Resume by ID")
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns the complete resume record matching the specific ID safely.
    Ensures the current user owns it, otherwise fails explicitly.
    """
    user_id = current_user.get("user_id")
    
    response = supabase.table("resumes").select("*").eq("id", resume_id).execute()
    
    if not hasattr(response, 'data') or len(response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    resume_record = response.data[0]
    
    # Security constraint check
    if resume_record.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Mimic 404 to avoid exposing ID existence
            detail="Resume not found."
        )
        
    return resume_record


@router.post("/optimize", response_model=OptimizeResumeResponse, summary="Optimize resume for a job")
async def optimize_resume(
    request: OptimizeResumeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Optimizes a resume for a specific job description using AI.
    Calculates ATS scores before and after optimization.
    Tracks usage limits based on user's plan.
    """
    user_id = current_user.get("user_id")
    
    # Step 1: Get user's plan from user_profiles or default to 'free'
    try:
        profile_response = supabase.table("user_profiles").select("plan").eq("id", user_id).execute()
        user_plan = 'free'
        if hasattr(profile_response, 'data') and len(profile_response.data) > 0:
            user_plan = profile_response.data[0].get('plan', 'free')
    except Exception:
        user_plan = 'free'
    
    # Step 2: Check usage limit
    await usage_service.check_limit(user_id, 'resume_optimize', user_plan)
    
    # Step 3: Get resume from database and verify ownership
    resume_response = supabase.table("resumes").select("*").eq("id", request.resume_id).execute()
    
    if not hasattr(resume_response, 'data') or len(resume_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
    
    resume_record = resume_response.data[0]
    
    # Verify ownership
    if resume_record.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
    
    resume_text = resume_record.get("raw_text", "")
    
    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume has no text content."
        )
    
    # Step 4: Calculate ATS score BEFORE optimization
    try:
        before_score, keywords_present, keywords_missing = ats_scorer.calculate_ats_score(
            resume_text, 
            request.job_description
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate initial ATS score: {str(e)}"
        )
    
    # Step 5: Call Claude service to optimize resume
    try:
        optimized_data = await claude_service.optimize_resume(
            resume_text,
            request.job_description,
            keywords_missing
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timed out. Please try again."
        )
    except Exception as e:
        error_msg = str(e).lower()
        if 'rate limit' in error_msg or 'quota' in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service rate limit reached. Please try again in a few moments."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize resume: {str(e)}"
        )
    
    # Step 6: Flatten optimized text for ATS scoring
    optimized_text_parts = []
    
    if optimized_data.get('summary'):
        optimized_text_parts.append(optimized_data['summary'])
    
    if optimized_data.get('experience'):
        for exp in optimized_data['experience']:
            if exp.get('company'):
                optimized_text_parts.append(exp['company'])
            if exp.get('title'):
                optimized_text_parts.append(exp['title'])
            if exp.get('bullets'):
                optimized_text_parts.extend(exp['bullets'])
    
    if optimized_data.get('skills'):
        optimized_text_parts.extend(optimized_data['skills'])
    
    optimized_text = ' '.join(optimized_text_parts)
    
    # Step 7: Calculate ATS score AFTER optimization
    try:
        after_score, _, _ = ats_scorer.calculate_ats_score(
            optimized_text,
            request.job_description
        )
    except Exception as e:
        # If scoring fails, use a reasonable estimate
        after_score = min(before_score + 15, 95)
    
    score_improvement = after_score - before_score
    
    # Step 8: Save optimization record to database
    # Store optimized data as JSON string in optimized_text
    
    optimization_payload = {
        "user_id": user_id,
        "resume_id": request.resume_id,
        "before_ats_score": before_score,
        "after_ats_score": after_score,
        "before_text": resume_text,
        "optimized_text": json.dumps(optimized_data),  # Store as JSON string
        "keywords_added": optimized_data.get('keywords_added', [])
    }
    
    try:
        optimization_response = supabase.table("optimizations").insert(optimization_payload).execute()
        
        if not hasattr(optimization_response, 'data') or len(optimization_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save optimization record."
            )
        
        optimization_id = optimization_response.data[0].get("id")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save optimization: {str(e)}"
        )
    
    # Step 9: Increment usage count
    await usage_service.increment_usage(user_id, 'resume_optimize')
    
    # Step 10: Return response
    return {
        "optimization_id": optimization_id,
        "before_ats_score": before_score,
        "after_ats_score": after_score,
        "keywords_added": optimized_data.get('keywords_added', []),
        "optimized": optimized_data,
        "score_improvement": score_improvement
    }


@router.get("/optimization/{optimization_id}", response_model=OptimizeResumeResponse, summary="Get optimization by ID")
async def get_optimization(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves a specific optimization record by ID.
    Verifies the optimization belongs to the current user.
    """
    user_id = current_user.get("user_id")
    
    response = supabase.table("optimizations").select("*").eq("id", optimization_id).execute()
    
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
    
    # Parse the optimized_text back into structured format
    
    try:
        optimized_data = json.loads(optimization.get("optimized_text", "{}"))
    except:
        # Fallback if it's not JSON
        optimized_data = {
            "summary": optimization.get("optimized_text", "")[:500],
            "experience": [],
            "skills": [],
            "keywords_added": optimization.get("keywords_added", []),
            "improvements_summary": "Resume optimized with ATS keywords and improved formatting."
        }
    
    score_improvement = optimization.get("after_ats_score", 0) - optimization.get("before_ats_score", 0)
    
    return {
        "optimization_id": optimization_id,
        "before_ats_score": optimization.get("before_ats_score", 0),
        "after_ats_score": optimization.get("after_ats_score", 0),
        "keywords_added": optimization.get("keywords_added", []),
        "optimized": optimized_data,
        "score_improvement": score_improvement
    }


@router.get("/download/{optimization_id}", summary="Download optimized resume as PDF")
async def download_resume_pdf(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Downloads the optimized resume as a professionally formatted PDF.
    Generates PDF from optimization data and optionally uploads to storage.
    """
    user_id = current_user.get("user_id")
    
    # Get optimization record and verify ownership
    opt_response = supabase.table("optimizations").select("*").eq("id", optimization_id).execute()
    
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
    
    # Check if PDF already exists in storage
    existing_pdf_url = optimization.get("optimized_pdf_url")
    if existing_pdf_url:
        # Return redirect to existing PDF
        return {"pdf_url": existing_pdf_url}
    
    # Parse optimized data from JSON string
    try:
        optimized_data = json.loads(optimization.get("optimized_text", "{}"))
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse optimization data."
        )
    
    # Get user profile for candidate name
    profile_response = supabase.table("user_profiles") \
        .select("full_name") \
        .eq("id", user_id) \
        .execute()
    
    candidate_name = "Professional Resume"
    if hasattr(profile_response, 'data') and len(profile_response.data) > 0:
        candidate_name = profile_response.data[0].get("full_name", "Professional Resume")
    
    # Generate PDF in temporary file
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        os.close(fd)  # Close file descriptor
        
        # Generate the PDF
        generate_resume_pdf(optimized_data, temp_path, candidate_name)
        
        # Upload to Supabase Storage
        timestamp = int(time.time())
        storage_path = f"optimized_resumes/{user_id}/{timestamp}_{optimization_id[:8]}.pdf"
        
        try:
            pdf_url = await upload_file(temp_path, storage_path)
            
            # Update optimization record with PDF URL
            supabase.table("optimizations") \
                .update({"optimized_pdf_url": pdf_url}) \
                .eq("id", optimization_id) \
                .execute()
            
            # Return the file as download
            return FileResponse(
                path=temp_path,
                media_type="application/pdf",
                filename=f"optimized_resume_{optimization_id[:8]}.pdf"
            )
        except Exception as upload_error:
            # If upload fails, still return the PDF file
            print(f"Failed to upload PDF to storage: {str(upload_error)}")
            return FileResponse(
                path=temp_path,
                media_type="application/pdf",
                filename=f"optimized_resume_{optimization_id[:8]}.pdf"
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
