from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from core.auth import get_current_user
from core.database import supabase
from services import usage_service

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/stats", summary="Get usage statistics")
async def get_usage_stats(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns usage statistics for the current user for the current month.
    """
    user_id = current_user.get("user_id")

    try:
        # Get user's plan from database
        plan_name = 'free'
        try:
            profile_response = supabase.table("user_profiles").select("plan").eq("id", user_id).execute()
            if hasattr(profile_response, 'data') and len(profile_response.data) > 0:
                plan_name = profile_response.data[0].get('plan', 'free')
        except Exception:
            pass  # Default to free plan if can't fetch

        stats = await usage_service.get_usage_stats(user_id, plan_name)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage stats: {str(e)}"
        )
