from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from core.auth import get_current_user
from core.database import supabase
from services.openai_service import predict_interview_questions, transcribe_audio
from services.claude_service import analyze_interview_answer as analyze_cl_interview
from services.storage_service import upload_file
from services.usage_service import check_limit, increment_usage
import tempfile, os, time

router = APIRouter()


class QuestionsRequest(BaseModel):
    optimization_id: str


class QuestionsResponse(BaseModel):
    questions: List[Dict[str, Any]]
    optimization_id: str


class FeedbackResponse(BaseModel):
    session_id: str
    transcript: str
    score: int
    grade: str
    feedback: str
    strengths: List[str]
    improvements: List[str]
    better_opening: str
    audio_url: str


class InterviewSession(BaseModel):
    id: str
    question: str
    transcript: Optional[str]
    score: Optional[int]
    feedback: Optional[str]
    strengths: Optional[List[str]]
    improvements: Optional[List[str]]
    duration_secs: Optional[int]
    created_at: str


@router.api_route("/questions", methods=["GET", "POST"], response_model=QuestionsResponse, summary="Generate interview questions")
async def generate_interview_questions(
    request: QuestionsRequest = None,
    optimization_id: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Generates 10 interview questions based on the job and resume.
    Caches questions in the optimization record.
    Accepts optimization_id as either query parameter (GET) or request body (POST).
    """
    user_id = current_user.get("user_id")
    
    # Get optimization_id from either query param or request body
    opt_id = optimization_id if optimization_id else (request.optimization_id if request else None)
    
    if not opt_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="optimization_id is required"
        )
    
    # Step 1: Get optimization from DB and verify ownership
    opt_response = supabase.table("optimizations").select("*").eq("id", opt_id).execute()
    
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
    
    # Step 2: Check if questions already cached
    existing_questions = optimization.get("interview_questions")
    if existing_questions:
        return {
            "questions": existing_questions,
            "optimization_id": opt_id
        }
    
    # Step 3: Get job application data
    job_description = ""
    role_title = "the position"
    
    job_app_id = optimization.get("job_app_id")
    if job_app_id:
        job_response = supabase.table("job_applications") \
            .select("job_description, job_title") \
            .eq("id", job_app_id) \
            .execute()
        
        if hasattr(job_response, 'data') and len(job_response.data) > 0:
            job_data = job_response.data[0]
            job_description = job_data.get("job_description", "")
            role_title = job_data.get("job_title", "the position")
    
    if not job_description:
        job_description = "a challenging role that matches your skills and experience"
    
    # Step 4: Get resume summary
    resume_id = optimization.get("resume_id")
    resume_summary = ""
    
    if resume_id:
        resume_response = supabase.table("resumes") \
            .select("structured") \
            .eq("id", resume_id) \
            .execute()
        
        if hasattr(resume_response, 'data') and len(resume_response.data) > 0:
            structured = resume_response.data[0].get("structured", {})
            resume_summary = structured.get("summary", "")
            
            # If no summary, use experience text
            if not resume_summary:
                resume_summary = structured.get("experience_text", "")[:500]
    
    if not resume_summary:
        resume_summary = "Experienced professional seeking new opportunities"
    
    # Step 5: Generate questions using Groq
    try:
        questions = await predict_interview_questions(
            job_description,
            resume_summary,
            role_title
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}"
        )
    
    # Step 6: Save questions to optimization record
    try:
        supabase.table("optimizations") \
            .update({"interview_questions": questions}) \
            .eq("id", opt_id) \
            .execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to cache interview questions: {str(e)}")
    
    # Step 7: Return questions
    return {
        "questions": questions,
        "optimization_id": opt_id
    }


@router.post("/feedback", response_model=FeedbackResponse, summary="Analyze interview answer")
async def analyze_interview_answer(
    optimization_id: str = Form(...),
    question: str = Form(...),
    question_index: int = Form(...),
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyzes an interview answer from audio recording.
    Transcribes audio, provides feedback, and saves session to database.
    """
    user_id = current_user.get("user_id")
    
    # Step 1: Get user's plan for usage limit check
    try:
        profile_response = supabase.table("user_profiles").select("plan").eq("id", user_id).execute()
        user_plan = 'free'
        if hasattr(profile_response, 'data') and len(profile_response.data) > 0:
            user_plan = profile_response.data[0].get('plan', 'free')
    except Exception:
        user_plan = 'free'
    
    # Step 2: Check usage limit (5 voice sessions for free plan)
    await check_limit(user_id, 'interview_practice', user_plan)
    
    # Step 3: Verify optimization ownership
    opt_response = supabase.table("optimizations") \
        .select("user_id, job_app_id") \
        .eq("id", optimization_id) \
        .execute()
    
    if not hasattr(opt_response, 'data') or len(opt_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    optimization = opt_response.data[0]
    
    if optimization.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    # Get role title for context
    role_title = "the position"
    job_app_id = optimization.get("job_app_id")
    if job_app_id:
        job_response = supabase.table("job_applications") \
            .select("job_title") \
            .eq("id", job_app_id) \
            .execute()
        
        if hasattr(job_response, 'data') and len(job_response.data) > 0:
            role_title = job_response.data[0].get("job_title", "the position")
    
    # Step 4: Save audio file to temp location
    audio_content = await audio.read()
    
    # Determine file extension
    file_extension = "m4a"
    if audio.filename:
        file_extension = audio.filename.split('.')[-1] if '.' in audio.filename else "m4a"
    
    fd, temp_path = tempfile.mkstemp(suffix=f".{file_extension}")
    
    try:
        with os.fdopen(fd, 'wb') as temp_file:
            temp_file.write(audio_content)
        
        # Step 5: Upload audio to Supabase Storage
        timestamp = int(time.time())
        storage_path = f"voice/{user_id}/{timestamp}.{file_extension}"
        
        try:
            audio_url = await upload_file(temp_path, storage_path)
        except Exception as e:
            print(f"Failed to upload audio to storage: {str(e)}")
            audio_url = ""
        
        # Step 6: Transcribe audio using HF Whisper
        try:
            transcript = await transcribe_audio(temp_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to transcribe audio: {str(e)}"
            )
        
        # Step 7: Analyze answer using Groq (via claude_service)
        try:
            analysis = await analyze_cl_interview(
                question,
                transcript,
                role_title
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to analyze answer: {str(e)}"
            )
        
        # Step 8: Save interview session to database
        session_payload = {
            "user_id": user_id,
            "optimization_id": optimization_id,
            "question": question,
            "transcript": transcript,
            "score": analysis.get("score", 0),
            "feedback": analysis.get("overall_feedback", ""),
            "strengths": analysis.get("strengths", []),
            "improvements": analysis.get("improvements", [])
        }
        
        try:
            session_response = supabase.table("interview_sessions").insert(session_payload).execute()
            
            if not hasattr(session_response, 'data') or len(session_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save interview session."
                )
            
            session_id = session_response.data[0].get("id")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save session: {str(e)}"
            )
        
        # Step 9: Increment usage count
        await increment_usage(user_id, 'interview_practice')
        
        # Step 10: Return response
        return {
            "session_id": session_id,
            "transcript": transcript,
            "score": analysis.get("score", 0),
            "grade": analysis.get("grade", "Good"),
            "feedback": analysis.get("overall_feedback", ""),
            "strengths": analysis.get("strengths", []),
            "improvements": analysis.get("improvements", []),
            "better_opening": analysis.get("better_opening", ""),
            "audio_url": audio_url
        }
        
    finally:
        # Step 11: Delete temp audio file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("/history/{optimization_id}", summary="Get interview history")
async def get_interview_history(
    optimization_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves all past interview sessions for an optimization.
    Groups sessions by question.
    """
    user_id = current_user.get("user_id")
    
    # Verify optimization ownership
    opt_response = supabase.table("optimizations") \
        .select("user_id") \
        .eq("id", optimization_id) \
        .execute()
    
    if not hasattr(opt_response, 'data') or len(opt_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    if opt_response.data[0].get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization not found."
        )
    
    # Get all interview sessions for this optimization
    sessions_response = supabase.table("interview_sessions") \
        .select("*") \
        .eq("optimization_id", optimization_id) \
        .order("created_at", desc=True) \
        .execute()
    
    if not hasattr(sessions_response, 'data'):
        return {"sessions": [], "grouped_by_question": {}}
    
    sessions = sessions_response.data
    
    # Group sessions by question
    grouped = {}
    for session in sessions:
        question = session.get("question", "Unknown Question")
        if question not in grouped:
            grouped[question] = []
        grouped[question].append(session)
    
    return {
        "sessions": sessions,
        "grouped_by_question": grouped,
        "total_sessions": len(sessions)
    }
