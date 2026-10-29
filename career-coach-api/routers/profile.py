from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from core.auth import get_current_user
from core.database import supabase
from models.user import UserProfile, ProfileUpdate

router = APIRouter()


class PushTokenRequest(BaseModel):
    user_id: Optional[str] = None
    push_token: str
    platform: Optional[str] = None


def _fallback_profile(current_user: dict, overrides: Optional[Dict[str, Any]] = None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "id": current_user["user_id"],
        "email": current_user.get("email", "user@example.com"),
        "full_name": current_user.get("full_name", "User"),
        "plan": "free",
        "target_role": None,
        "experience_yrs": None,
        "created_at": now,
        "updated_at": now,
    }
    if overrides:
        data.update({k: v for k, v in overrides.items() if v is not None})
    return data


@router.get("", response_model=UserProfile, summary="Get Current User Profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated user's profile from Supabase, with a safe fallback."""
    user_id = current_user["user_id"]
    try:
        response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if response.data:
            row = response.data
            return {
                "id": row.get("id", user_id),
                "email": row.get("email", current_user.get("email")),
                "full_name": row.get("full_name"),
                "plan": row.get("plan", "free"),
                "target_role": row.get("target_role"),
                "experience_yrs": row.get("experience_yrs"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
            }
    except Exception as e:
        print(f"get_profile DB error: {e}")

    return _fallback_profile(current_user)


@router.get("/usage/stats")
async def get_usage_stats(current_user: dict = Depends(get_current_user)):
    from services.usage_service import get_usage_stats as fetch_usage_stats

    user_id = current_user["user_id"]
    plan_name = "free"
    try:
        profile_response = (
            supabase.table("user_profiles")
            .select("plan")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if profile_response.data:
            plan_name = profile_response.data.get("plan", "free") or "free"
    except Exception:
        pass

    return await fetch_usage_stats(user_id, plan_name)


@router.put("", response_model=UserProfile, summary="Update Current User Profile")
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Full profile update with DB persistence when available."""
    user_id = current_user["user_id"]
    payload = profile_update.model_dump(exclude_unset=True)
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        existing = (
            supabase.table("user_profiles")
            .select("id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if existing.data:
            response = (
                supabase.table("user_profiles")
                .update(payload)
                .eq("id", user_id)
                .execute()
            )
        else:
            payload["id"] = user_id
            payload["email"] = current_user.get("email")
            payload["created_at"] = datetime.now(timezone.utc).isoformat()
            response = supabase.table("user_profiles").insert(payload).execute()

        if response.data:
            row = response.data[0]
            return {
                "id": row.get("id", user_id),
                "email": row.get("email", current_user.get("email")),
                "full_name": row.get("full_name"),
                "plan": row.get("plan", "free"),
                "target_role": row.get("target_role"),
                "experience_yrs": row.get("experience_yrs"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
            }
    except Exception as e:
        print(f"update_profile DB error: {e}")

    return _fallback_profile(current_user, payload)


@router.patch("", summary="Partially update user profile")
async def patch_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Partial profile update (plan, target_role, etc.)."""
    allowed = {"full_name", "target_role", "experience_yrs", "plan"}
    clean = {k: v for k, v in update_data.items() if k in allowed}
    profile_update = ProfileUpdate(**clean)
    return await update_profile(profile_update, current_user)


@router.post("/push-token", summary="Save device push notification token")
async def save_push_token(
    body: PushTokenRequest,
    current_user: dict = Depends(get_current_user),
):
    """Persist Expo push tokens when a devices table exists; otherwise acknowledge."""
    user_id = current_user["user_id"]
    try:
        supabase.table("user_push_tokens").upsert(
            {
                "user_id": user_id,
                "push_token": body.push_token,
                "platform": body.platform,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
    except Exception as e:
        print(f"save_push_token DB error (non-fatal): {e}")

    return {"status": "ok", "user_id": user_id}
