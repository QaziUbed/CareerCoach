from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone, date
import logging

# Internal imports (assuming these exist in your project structure)
from core.auth import get_current_user
from core.database import supabase  # Ensure this is initialized correctly

# --- CONFIGURATION & LOGGING ---

router = APIRouter()
logger = logging.getLogger(__name__)

# --- PYDANTIC MODELS ---

class ApplicationBase(BaseModel):
    """Shared fields for application data."""
    company_name: str = Field(..., min_length=1, max_length=255)
    job_title: str = Field(..., min_length=1, max_length=255)
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None

class CreateApplicationRequest(ApplicationBase):
    status: Literal['applied', 'interview', 'offer', 'rejected'] = "applied"
    # Accept ISO string or YYYY-MM-DD
    applied_date: Optional[date] = None

class UpdateApplicationRequest(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1)
    job_title: Optional[str] = Field(None, min_length=1)
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[Literal['applied', 'interview', 'offer', 'rejected']] = None
    notes: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: str
    user_id: str
    status: str
    applied_date: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# --- HELPER FUNCTIONS ---

def get_db():
    """Dependency to get the Supabase client."""
    # In a real app, you might want to initialize the client here
    # to handle connection errors gracefully at startup.
    return supabase

# --- API ENDPOINTS ---

@router.post("", summary="Create job application", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    request: CreateApplicationRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Creates a new job application record.
    """
    now = datetime.now(timezone.utc).isoformat()

    # Prepare data for insertion
    # Note: Supabase expects ISO format strings for dates
    application_data = {
        "user_id": current_user['user_id'],
        "company_name": request.company_name,
        "job_title": request.job_title,
        "job_description": request.job_description,
        "job_url": request.job_url,
        "status": request.status,
        "notes": request.notes,
        # Use provided date or default to today
        "applied_date": request.applied_date.isoformat() if request.applied_date else date.today().isoformat(),
        "created_at": now,
        "updated_at": now,
    }

    try:
        response = db.table("job_applications").insert(application_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create application record.")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the application."
        )


@router.get("", summary="List all applications", response_model=List[ApplicationResponse])
async def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Returns a paginated list of job applications for the user.
    """
    try:
        query = db.table("job_applications") \
            .select("*") \
            .eq("user_id", current_user['user_id']) \
            .order("created_at", desc=True) \
            .range(skip, skip + limit - 1)

        # Prefer soft-delete filter when the column exists; fall back if schema differs
        try:
            response = query.is_("deleted_at", None).execute()
        except Exception:
            response = db.table("job_applications") \
                .select("*") \
                .eq("user_id", current_user['user_id']) \
                .order("created_at", desc=True) \
                .range(skip, skip + limit - 1) \
                .execute()

        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        # Fail soft for dashboard/home so missing tables don't brick the app
        return []


@router.get("/{app_id}", summary="Get application by ID", response_model=ApplicationResponse)
async def get_application(
    app_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Returns full application details.
    """
    try:
        response = db.table("job_applications") \
            .select("*") \
            .eq("id", app_id) \
            .eq("user_id", current_user['user_id']) \
            .is_("deleted_at", None) \
            .maybe_single() \
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found."
            )

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching application {app_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch application."
        )


@router.patch("/{app_id}", summary="Update application", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    request: UpdateApplicationRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Updates application details.
    """
    # model_dump(exclude_unset=True) ensures we only update fields that were actually provided
    update_data = request.model_dump(exclude_unset=True)

    if not update_data:
        # Nothing to update, just return current state to avoid empty DB calls
        return await get_application(app_id, current_user, db)

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        response = db.table("job_applications") \
            .update(update_data) \
            .eq("id", app_id) \
            .eq("user_id", current_user['user_id']) \
            .is_("deleted_at", None) \
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found or unauthorized."
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application {app_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update application."
        )


@router.delete("/{app_id}", summary="Delete application", status_code=status.HTTP_200_OK)
async def delete_application(
    app_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Soft deletes an application (sets deleted_at timestamp).
    """
    now = datetime.now(timezone.utc).isoformat()

    try:
        response = db.table("job_applications") \
            .update({"deleted_at": now}) \
            .eq("id", app_id) \
            .eq("user_id", current_user['user_id']) \
            .is_("deleted_at", None) \
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found or already deleted."
            )

        return {"message": "Application deleted successfully", "id": app_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting application {app_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete application."
        )