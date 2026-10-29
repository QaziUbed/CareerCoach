from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import resume, cover_letter, interview, voice, applications, billing, profile, stats, usage, notifications
from core.auth import get_current_user

# Initialize the FastAPI application
app = FastAPI(
    title="Career Coach API",
    description="Backend API for the Career Coach application",
    version="1.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
# Allowing all origins as requested for development/production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Register routers with /api prefix
app.include_router(profile.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/health", summary="Health Check Endpoint")
async def health_check():
    """
    Health check endpoint to ensure the API is running and responsive.
    Returns status and the current version of the API.
    """
    return {"status": "ok", "version": "1.0.0"}

@app.get("/api/me", summary="Get Current User")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Test endpoint to verify the Supabase JWT token.
    Returns the decoded user_id and email payload.
    """
    return current_user

@app.get("/", summary="Root Endpoint")
async def root():
    """
    Root endpoint for the API.
    Returns a simple welcome message indicating the service is up.
    """
    return {"message": "Career Coach API is running"}
