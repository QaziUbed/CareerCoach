import os
import json
import re
import logging
from typing import Dict, Any, List, Optional

# Use AsyncGroq for non-blocking calls in an async context
from groq import AsyncGroq, APIStatusError

# --- CONFIGURATION & CONSTANTS ---

# API KEY REQUIREMENT:
# Environment Variable: 'GROQ_API_KEY'
# Action: Set this in your production environment or .env file.
# Get your key here: https://console.groq.com/keys
try:
    from core.config import settings
    GROQ_API_KEY = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
except Exception:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Model definitions
MODEL = "llama-3.3-70b-versatile"       # High intelligence model
FAST_MODEL = "llama3-8b-8192"           # Faster, cheaper model

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_client() -> AsyncGroq:
    """
    Returns an asynchronous Groq client.
    Raises ValueError if API Key is missing.
    """
    if not GROQ_API_KEY:
        logger.error("FATAL: GROQ_API_KEY environment variable is not set.")
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return AsyncGroq(api_key=GROQ_API_KEY)

def _parse_json(text: str) -> dict:
    """
    Robustly parses JSON from LLM output.
    Handles markdown code blocks and conversational filler text.
    """
    try:
        # 1. Attempt to extract JSON from markdown code blocks (```json ... ```)
        # Regex explanation: look for ``` followed by optional 'json', then capture content until next ```
        matches = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if matches:
            return json.loads(matches[0].strip())

        # 2. Fallback: Find the first '{' and last '}' to extract the JSON object
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            json_str = text[start:end]
            return json.loads(json_str)

        # 3. If no structure found, raise error
        raise ValueError("No JSON object found in response")

    except json.JSONDecodeError as e:
        logger.error(f"JSON Decode Error: {e}. Raw text snippet: {text[:100]}...")
        raise ValueError("Failed to parse AI response as JSON")

async def analyze_resume_deeply(resume_text: str, structured: dict) -> dict:
    """
    Deep analysis of a resume. Called automatically on upload.
    Returns a rich structured report.
    """
    client = get_client()

    system_prompt = """You are a world-class career coach and ATS expert.
Analyse this resume and return ONLY valid JSON, no markdown:
{
  "overall_score": 72,
  "score_breakdown": {
    "ats_compatibility": 68,
    "content_quality": 75,
    "impact_language": 70,
    "skills_relevance": 80,
    "formatting": 65
  },
  "candidate_level": "Mid-level",
  "years_experience": 3,
  "primary_field": "Software Engineering",
  "top_skills": ["Python", "React", "SQL"],
  "missing_critical_skills": ["Docker", "AWS", "System Design"],
  "strengths": [
    "Strong quantified achievements in 2 bullet points",
    "Good educational background",
    "Relevant project experience"
  ],
  "critical_gaps": [
    "No mention of cloud platforms (AWS/GCP/Azure)",
    "Missing soft skills section",
    "Summary is too generic — not targeted to any specific role"
  ],
  "quick_wins": [
    "Add AWS or GCP to your skills section if you have any exposure",
    "Rewrite your summary to mention your target role specifically",
    "Quantify 3 more bullet points with numbers or percentages"
  ],
  "best_fit_roles": ["Software Engineer", "Full Stack Developer", "Backend Developer"],
  "best_fit_companies": ["Startups", "Mid-size tech companies", "Product companies"],
  "salary_range_estimate": "$80K-120K",
  "readiness_verdict": "Your resume is getting you past 30% of ATS filters. With targeted improvements, you can reach 75%+."
}
Be specific and honest. Reference actual content from the resume. Provide exactly 3 items for strengths, critical_gaps, and quick_wins."""

    try:
        logger.info("Starting deep resume analysis...")
        # Using Async client
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyse this resume:\n\n{resume_text[:4000]}"}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        return _parse_json(response.choices[0].message.content)

    except Exception as e:
        logger.warning(f"Deep analysis failed, returning fallback data: {str(e)}")
        # Graceful degradation: Return a valid structure so UI doesn't break
        return {
            "overall_score": 60,
            "score_breakdown": {
                "ats_compatibility": 55,
                "content_quality": 65,
                "impact_language": 60,
                "skills_relevance": 60,
                "formatting": 60
            },
            "candidate_level": "Entry to Mid-level",
            "years_experience": 2,
            "primary_field": "General",
            "top_skills": structured.get("skills", [])[:3] if structured else [],
            "missing_critical_skills": ["Analysis unavailable - please try again"],
            "strengths": ["Resume uploaded successfully", "Text extracted properly", "Ready for optimization"],
            "critical_gaps": ["Full analysis unavailable", "Try optimizing for specific job", "Add more details to resume"],
            "quick_wins": ["Add quantified achievements", "Include relevant keywords", "Tailor to target role"],
            "best_fit_roles": ["Various roles"],
            "best_fit_companies": ["Various companies"],
            "salary_range_estimate": "Varies by role",
            "readiness_verdict": "Upload successful. Optimize your resume for a specific job to get detailed analysis."
        }

async def analyze_skill_gap(
    resume_text: str,
    job_description: str,
    company_name: str,
    job_title: str,
) -> dict:
    """
    Perform a detailed gap analysis comparing a resume against a specific
    company + role job description. Returns structured JSON.
    """
    client = get_client()

    system_prompt = """You are an expert career coach doing a deep gap analysis.
Compare the resume against the job requirements and return ONLY valid JSON:
{
  "readiness_score": 65,
  "readiness_label": "Partially Ready",
  "skills_comparison": [
    {
      "skill": "Docker",
      "company_needs": "Required",
      "candidate_has": "Not found",
      "gap_level": "missing",
      "how_to_close": "Complete Docker getting-started tutorial (2 days)"
    },
    {
      "skill": "Python",
      "company_needs": "Required",
      "candidate_has": "Strong",
      "gap_level": "match",
      "how_to_close": ""
    }
  ],
  "experience_gap": {
    "required_years": 3,
    "candidate_years": 2,
    "verdict": "1 year short but strong project portfolio can compensate",
    "compensation_tips": ["Highlight freelance projects", "Add personal projects"]
  },
  "language_gaps": ["microservices", "agile", "CI/CD", "REST APIs"],
  "language_matches": ["Python", "JavaScript", "Git"],
  "roadmap": {
    "week_1": ["Add Docker to skills — complete getting-started guide", "Rewrite summary to mention company specifically"],
    "week_2": ["Build one CI/CD pipeline on GitHub Actions", "Complete AWS Cloud Practitioner free tier"],
    "week_3": ["Add 2 quantified achievements to your experience section", "Do 3 mock interviews"],
    "week_4": ["Final resume polish", "Apply and follow up on LinkedIn"]
  },
  "honest_verdict": "You have 70% of what the company wants. The Docker and CI/CD gaps are closeable in 2 weeks."
}
Be specific to this company's culture and known hiring bar. Provide at least 5 skills in skills_comparison."""

    try:
        logger.info(f"Analyzing skill gap for {job_title} at {company_name}...")
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Company: {company_name}\n"
                        f"Role: {job_title}\n\n"
                        f"JD:\n{job_description[:2000]}\n\n"
                        f"Resume:\n{resume_text[:2000]}"
                    ),
                },
            ],
            max_tokens=2000,
            temperature=0.3,
        )
        return _parse_json(response.choices[0].message.content)

    except Exception as e:
        logger.warning(f"Skill gap analysis failed: {str(e)}")
        # Fallback structure
        return {
            "readiness_score": 50,
            "readiness_label": "Analysis Unavailable",
            "skills_comparison": [],
            "experience_gap": {
                "required_years": 0,
                "candidate_years": 0,
                "verdict": "Could not determine — please try again",
                "compensation_tips": [],
            },
            "language_gaps": [],
            "language_matches": [],
            "roadmap": {
                "week_1": ["Re-run analysis for personalised recommendations"],
                "week_2": [],
                "week_3": [],
                "week_4": [],
            },
            "honest_verdict": "Unable to complete analysis at this time. Please retry.",
        }

async def generate_standard_jd(company_name: str, job_title: str) -> str:
    """
    Generate a realistic job description when the user doesn't paste one.
    Uses the faster/cheaper model for simple text generation.
    """
    client = get_client()

    try:
        logger.info(f"Generating JD for {job_title}...")
        response = await client.chat.completions.create(
            model=FAST_MODEL, # Cheaper model is sufficient for this task
            messages=[
                {
                    "role": "system",
                    "content": "You write realistic job descriptions. Return ONLY the job description text, no markdown.",
                },
                {
                    "role": "user",
                    "content": (
                        f"Write a realistic job description for {job_title} at "
                        f"{company_name}. Include: overview, responsibilities "
                        f"(5-7 bullets), requirements (5-7 bullets), nice-to-haves "
                        f"(3-4 bullets). Use the company's known tech stack and "
                        f"culture if applicable."
                    ),
                },
            ],
            max_tokens=800,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"JD generation failed: {str(e)}")
        return (
            f"Job Title: {job_title} at {company_name}\n\n"
            f"We are looking for a {job_title} to join our team. "
            f"Requirements include strong problem-solving skills, "
            f"relevant technical experience, good communication, "
            f"and a passion for building great products."
        )