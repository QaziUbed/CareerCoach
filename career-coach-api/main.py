from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import sys
from routers import resume, cover_letter, interview, applications, billing, profile, usage, agent, stats, practice
import uvicorn

app = FastAPI(
    title="Career Coach API",
    description="Backend API for the Career Coach application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router,        prefix="/api/resume")
app.include_router(cover_letter.router,  prefix="/api/cover-letter")
app.include_router(interview.router,     prefix="/api/interview")
app.include_router(applications.router,  prefix="/api/applications")
app.include_router(billing.router,       prefix="/api/billing")
app.include_router(profile.router,       prefix="/api/profile")
app.include_router(usage.router,         prefix="/api")
app.include_router(agent.router,         prefix="/api/agent")
app.include_router(stats.router,         prefix="/api")
app.include_router(practice.router,      prefix="/api/practice")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    body = await request.body()
    try:
        print(f"VALIDATION ERROR: {exc.errors()}", file=sys.stderr)
    except Exception:
        pass
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    return {"message": "Career Coach API is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
