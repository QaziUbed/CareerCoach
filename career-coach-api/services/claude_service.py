import os
import json
import re
import logging
from typing import List, Dict, Any, Optional

# NOTE: The 'groq' library provides both sync (Groq) and async (AsyncGroq) clients.
from groq import AsyncGroq, Groq, APIStatusError, APIConnectionError

# --- CONFIGURATION & CONSTANTS ---

# API KEY REQUIREMENT:
# You must set an environment variable named 'GROQ_API_KEY'.
# Obtain your API key from: https://console.groq.com/keys
# This key is mandatory to authenticate requests to the Groq API (Llama models).
try:
    from core.config import settings
    GROQ_API_KEY = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
except Exception:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Model selection
# Using the latest stable model for complex tasks
MODEL_MAIN = "llama-3.3-70b-versatile"
# Using a faster, cheaper model for simpler classification tasks
MODEL_FAST = "llama3-8b-8192"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_client() -> AsyncGroq:
    """
    Initializes and returns the asynchronous Groq client.
    Raises an error if the API key is missing.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY environment variable is not set.")
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it before running.")
    return AsyncGroq(api_key=GROQ_API_KEY)

def clean_json_response(text: str) -> str:
    """
    Extracts JSON content from a string that might contain markdown code blocks
    or conversational filler.
    """
    # Remove markdown code blocks if present (e.g., ```json ... ```)
    if "```" in text:
        # Use regex to extract content between code blocks
        matches = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if matches:
            return matches[0].strip()

    # Fallback: try to find the first '{' and last '}'
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end+1]

    return text.strip()

async def optimize_resume(resume_text: str, job_description: str, missing_keywords: List[str]) -> Dict[str, Any]:
    """
    Optimize resume using Groq API to maximize ATS match.
    Returns a structured dictionary of the resume.
    """
    client = get_client()

    system_prompt = """You are an expert resume writer and ATS specialist.
Rewrite the resume to maximize ATS match for the job description.
RULES:
1. Add missing keywords naturally into bullets and summary
2. Start every bullet with a strong action verb
3. Quantify achievements wherever possible
4. Never fabricate experience or skills
5. Keep same companies, titles, dates
Return ONLY valid JSON, no markdown:
{"summary":"...","experience":[{"company":"","title":"","dates":"","bullets":[]}],"skills":[],"keywords_added":[],"improvements_summary":""}"""

    # Safely handle missing keywords list
    keywords_str = ', '.join(missing_keywords[:10]) if missing_keywords else "None"

    user_message = f"""JOB DESCRIPTION: {job_description}
MISSING KEYWORDS TO ADD: {keywords_str}
RESUME TO OPTIMIZE: {resume_text}
Return only valid JSON."""

    try:
        logger.info("Requesting resume optimization from Groq...")
        response = await client.chat.completions.create(
            model=MODEL_MAIN,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=4000, # Increased token limit for full resume output
            temperature=0.3
        )

        raw_content = response.choices[0].message.content.strip()
        cleaned_content = clean_json_response(raw_content)

        return json.loads(cleaned_content)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}\nRaw Response: {raw_content}")
        raise ValueError("The AI returned a malformed response. Please try again.")
    except APIStatusError as e:
        logger.error(f"Groq API Error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in optimize_resume: {e}")
        raise

async def generate_cover_letter(resume_structured: Dict[str, Any], job_description: str, company_name: str, job_title: str) -> str:
    """Generate a tailored cover letter using Groq API."""

    client = get_client()

    system_prompt = """Expert cover letter writer. Write exactly 3 paragraphs.
Para 1: Specific hook about company + role + why this candidate fits
Para 2: 2-3 specific achievements from resume matching requirements
Para 3: Enthusiasm, culture fit, call to action
No cliches. Company-specific details required. Return only the letter text."""

    # Safely extract fields with defaults
    summary = resume_structured.get('summary', 'Experienced professional')
    skills = resume_structured.get('skills', [])
    skills_str = ', '.join(skills[:8]) if isinstance(skills, list) else str(skills)

    user_message = f"""COMPANY: {company_name}
ROLE: {job_title}
JOB DESCRIPTION: {job_description[:1500]}
CANDIDATE SUMMARY: {summary}
TOP SKILLS: {skills_str}
Write the cover letter now."""

    try:
        logger.info("Requesting cover letter generation...")
        response = await client.chat.completions.create(
            model=MODEL_MAIN,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=700,
            temperature=0.7
        )

        return response.choices[0].message.content.strip()

    except APIStatusError as e:
        logger.error(f"Groq API Error: {e}")
        raise

async def analyze_interview_answer(question: str, transcript: str, role_title: str) -> Dict[str, Any]:
    """Analyze interview answer using Groq API."""

    client = get_client()

    prompt = f"""Rate this interview answer for a {role_title} role.
QUESTION: {question}
ANSWER: {transcript}
Return ONLY valid JSON:
{{"score":7,"grade":"Good","strengths":["s1","s2"],"improvements":["i1","i2"],"better_opening":"...","missing_elements":["m1"],"overall_feedback":"..."}}"""

    try:
        logger.info("Analyzing interview answer...")
        response = await client.chat.completions.create(
            model=MODEL_FAST, # Using smaller model for speed/cost efficiency
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3
        )

        text = response.choices[0].message.content.strip()
        cleaned_content = clean_json_response(text)

        return json.loads(cleaned_content)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        raise ValueError("Failed to parse analysis response.")
    except APIStatusError as e:
        logger.error(f"Groq API Error: {e}")
        raise