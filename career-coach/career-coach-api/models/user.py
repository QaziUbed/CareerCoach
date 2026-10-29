from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    experience_yrs: Optional[int] = None
    plan: Optional[str] = None

class ProfileUpdate(BaseModel):
    target_role: Optional[str] = None
    experience_yrs: Optional[int] = None
