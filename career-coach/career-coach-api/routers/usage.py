from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict

from core.auth import get_current_user
from services import usage_service

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/stats", summary="Get usage statistics")
async def get_usage_stats(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, int]:
    """
    Returns usage statistics for the current user for the current month.
    """
    user_id = current_user.get("user_id")
    
    try:
        stats = await usage_service.get_usage_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage stats: {str(e)}"
        )
