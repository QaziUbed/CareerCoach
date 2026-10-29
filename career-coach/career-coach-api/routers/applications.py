from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
import uuid

router = APIRouter(prefix="/applications", tags=["applications"])
security = HTTPBearer(auto_error=False)

# In-memory storage for development
applications_db: Dict[str, dict] = {}


class CreateApplicationRequest(BaseModel):
    user_id: str
    company_name: str
    job_title: str
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = "applied"
    notes: Optional[str] = None
    applied_date: Optional[str] = None


class UpdateApplicationRequest(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[Literal['applied', 'interview', 'offer', 'rejected']] = None
    notes: Optional[str] = None


@router.post("", summary="Create job application")
async def create_application(
    request: CreateApplicationRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Creates a new job application record.
    """
    app_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    application = {
        "id": app_id,
        "user_id": request.user_id,
        "company_name": request.company_name,
        "job_title": request.job_title,
        "job_description": request.job_description,
        "job_url": request.job_url,
        "status": request.status or "applied",
        "notes": request.notes,
        "applied_date": request.applied_date or datetime.utcnow().date().isoformat(),
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    
    applications_db[app_id] = application
    return application


@router.get("", summary="List all applications")
async def list_applications(
    user_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Returns all job applications for the user.
    """
    result = [
        app for app in applications_db.values()
        if app["user_id"] == user_id and app["deleted_at"] is None
    ]
    return sorted(result, key=lambda x: x["created_at"], reverse=True)


@router.get("/{app_id}", summary="Get application by ID")
async def get_application(
    app_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Returns full application details.
    """
    if app_id not in applications_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    application = applications_db[app_id]
    if application["deleted_at"] is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    return application


@router.patch("/{app_id}", summary="Update application")
async def update_application(
    app_id: str,
    request: UpdateApplicationRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Updates application.
    """
    if app_id not in applications_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    application = applications_db[app_id]
    if application["deleted_at"] is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            application[key] = value
    
    application["updated_at"] = datetime.utcnow().isoformat()
    return application


@router.delete("/{app_id}", summary="Delete application")
async def delete_application(
    app_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Soft deletes an application.
    """
    if app_id not in applications_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    application = applications_db[app_id]
    if application["deleted_at"] is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )
    
    application["deleted_at"] = datetime.utcnow().isoformat()
    return {"message": "Application deleted successfully", "id": app_id}
