from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from core.auth import get_current_user
from models.user import UserProfile, ProfileUpdate

# Prefix logic is often handled in main.py but we specify /profile here so that
# when registered with prefix /api, the resulting URL is /api/profile
router = APIRouter(prefix="/profile", tags=["profile"])
security = HTTPBearer(auto_error=False)

@router.get("", response_model=UserProfile, summary="Get Current User Profile")
async def get_profile(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Fetches the user's profile.
    Returns mock data for development.
    """
    # Mock response for development
    return {
        "id": "dev-user-123",
        "email": "dev@example.com",
        "full_name": "Dev User",
        "plan": "free",
        "target_role": None,
        "experience_yrs": None,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }

@router.put("", response_model=UserProfile, summary="Update Current User Profile")
async def update_profile(profile_update: ProfileUpdate, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Updates the user profile.
    Returns mock data for development.
    """
    # Mock response for development
    return {
        "id": "dev-user-123",
        "email": "dev@example.com",
        "full_name": "Dev User",
        "plan": "free",
        "target_role": profile_update.target_role,
        "experience_yrs": profile_update.experience_yrs,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
