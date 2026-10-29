import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from core.config import settings

# Load .env file
load_dotenv()

security = HTTPBearer()

# Development user for testing without real auth (using valid UUID format)
DEV_USER = {
    "user_id": "00000000-0000-0000-0000-000000000001",
    "email": "dev@example.com"
}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials

    # Allow dev token in development mode
    environment = os.getenv("ENVIRONMENT", "production")
    if environment == "development" and token == "dev-mock-token":
        return DEV_USER

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
