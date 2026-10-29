from groq import Groq
import os
import json

MODEL = "llama-3.3-70b-versatile"

def get_client():
    """Lazy load Groq client to avoid initialization errors."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return Groq(api_key=api_key)


async def optimize_resume(resume_text: str, job_description: str, missing_keywords: list) -> dict:
    """Optimize resume using Groq API to maximize ATS match."""
    
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
{"summary":"...","experience":[{"company":"","title":"","dates":"","bullets":[]}],
"skills":[],"keywords_added":[],"improvements_summary":""}"""

    user_message = f"""JOB DESCRIPTION: {job_description}
MISSING KEYWORDS TO ADD: {', '.join(missing_keywords[:10])}
RESUME TO OPTIMIZE: {resume_text}
Return only valid JSON."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        max_tokens=3000,
        temperature=0.3
    )
    
    text = response.choices[0].message.content.strip()
    
    # Clean markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)


async def generate_cover_letter(resume_structured: dict, job_description: str, company_name: str, job_title: str) -> str:
    """Generate a tailored cover letter using Groq API."""
    
    client = get_client()
    
    system_prompt = """Expert cover letter writer. Write exactly 3 paragraphs.
Para 1: Specific hook about company + role + why this candidate fits
Para 2: 2-3 specific achievements from resume matching requirements  
Para 3: Enthusiasm, culture fit, call to action
No cliches. Company-specific details required. Return only the letter text."""

    user_message = f"""COMPANY: {company_name}
ROLE: {job_title}
JOB DESCRIPTION: {job_description[:1500]}
CANDIDATE SUMMARY: {resume_structured.get('summary', '')}
TOP SKILLS: {', '.join(resume_structured.get('skills', [])[:8])}
Write the cover letter now."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        max_tokens=700,
        temperature=0.7
    )
    
    return response.choices[0].message.content.strip()


async def analyze_interview_answer(question: str, transcript: str, role_title: str) -> dict:
    """Analyze interview answer using Groq API."""
    
    client = get_client()
    
    prompt = f"""Rate this interview answer for a {role_title} role.
QUESTION: {question}
ANSWER: {transcript}
Return ONLY valid JSON:
{{"score":7,"grade":"Good","strengths":["s1","s2"],
"improvements":["i1","i2"],"better_opening":"...",
"missing_elements":["m1"],"overall_feedback":"..."}}"""

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.3
    )
    
    text = response.choices[0].message.content.strip()
    
    # Clean markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)
