from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta

from core.auth import get_current_user
from core.database import supabase

router = APIRouter(prefix="/stats", tags=["stats"])


class DashboardStatsResponse(BaseModel):
    total_applications: int
    average_ats_score: float
    interview_sessions_week: int
    best_ats_score: int


@router.get("/dashboard", response_model=DashboardStatsResponse, summary="Get dashboard statistics")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns statistics for the home dashboard.
    """
    user_id = current_user.get("user_id")
    
    try:
        # Get total applications count
        try:
            apps_response = supabase.table("job_applications") \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .is_("deleted_at", None) \
                .execute()
            total_applications = len(apps_response.data) if hasattr(apps_response, 'data') else 0
        except Exception:
            total_applications = 0
        
        # Get ATS scores from optimizations
        ats_scores = []
        try:
            opt_response = supabase.table("optimizations") \
                .select("after_ats_score") \
                .eq("user_id", user_id) \
                .execute()
            
            if hasattr(opt_response, 'data'):
                ats_scores = [opt["after_ats_score"] for opt in opt_response.data if opt.get("after_ats_score")]
        except Exception:
            pass
        
        average_ats_score = sum(ats_scores) / len(ats_scores) if ats_scores else 0
        best_ats_score = max(ats_scores) if ats_scores else 0
        
        # Get interview sessions from this week
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        try:
            sessions_response = supabase.table("interview_sessions") \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .gte("created_at", week_ago) \
                .execute()
            interview_sessions_week = len(sessions_response.data) if hasattr(sessions_response, 'data') else 0
        except Exception:
            interview_sessions_week = 0
        
        return {
            "total_applications": total_applications,
            "average_ats_score": round(average_ats_score, 1),
            "interview_sessions_week": interview_sessions_week,
            "best_ats_score": best_ats_score
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )
