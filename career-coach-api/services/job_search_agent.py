"""
Job Search Agent Service
Simulates searching across LinkedIn, Naukri, and Unstop and returns scored job results.
In production, this module would call real job board APIs / web scrapers.
"""
import time
import random
from typing import List, Dict, Optional
from services.ats_scorer import calculate_ats_score_simple


# ---------------------------------------------------------------------------
# Simulated job data (replace with real API calls in production)
# ---------------------------------------------------------------------------

_SAMPLE_JOBS: List[Dict] = [
    # Software Engineering
    {
        "title": "Senior Software Engineer",
        "company": "Razorpay",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/razorpay-sse",
        "description": "Build scalable payment systems using Python, FastAPI, PostgreSQL, Redis and Kafka. Lead backend services team.",
        "posted_days_ago": 1,
        "salary_lpa": 35,
    },
    {
        "title": "Software Engineer II",
        "company": "Google",
        "location": "Hyderabad",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/google-swe2",
        "description": "Work on Google Cloud infrastructure. Requires experience in Go, C++, distributed systems, and Kubernetes.",
        "posted_days_ago": 2,
        "salary_lpa": 45,
    },
    {
        "title": "Backend Engineer",
        "company": "Zepto",
        "location": "Mumbai",
        "job_type": "Startup",
        "source": "Naukri",
        "link": "https://naukri.com/job/zepto-backend",
        "description": "Design and build high-throughput backend services for 10-minute grocery delivery. Python, FastAPI, PostgreSQL, AWS.",
        "posted_days_ago": 3,
        "salary_lpa": 28,
    },
    {
        "title": "Full Stack Developer",
        "company": "Swiggy",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "Naukri",
        "link": "https://naukri.com/job/swiggy-fsd",
        "description": "React Native mobile apps, Node.js backend APIs, MongoDB, GraphQL, Firebase. Agile team.",
        "posted_days_ago": 1,
        "salary_lpa": 22,
    },
    {
        "title": "Cloud Solutions Architect",
        "company": "Infosys",
        "location": "Pune",
        "job_type": "MNC",
        "source": "Naukri",
        "link": "https://naukri.com/job/infosys-cloud",
        "description": "Design cloud architectures on AWS and Azure. Terraform, Kubernetes, Docker, CI/CD pipelines.",
        "posted_days_ago": 5,
        "salary_lpa": 30,
    },
    {
        "title": "React Native Developer",
        "company": "Meesho",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/meesho-rnd",
        "description": "Build consumer-facing React Native mobile app. TypeScript, Redux, Expo, REST APIs, E2E testing.",
        "posted_days_ago": 2,
        "salary_lpa": 25,
    },
    # Data Science
    {
        "title": "Senior Data Scientist",
        "company": "Flipkart",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/flipkart-ds",
        "description": "Machine learning models for recommendation engine. Python, TensorFlow, Spark, SQL, A/B testing expertise.",
        "posted_days_ago": 3,
        "salary_lpa": 38,
    },
    {
        "title": "ML Engineer",
        "company": "Ola",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "Naukri",
        "link": "https://naukri.com/job/ola-mle",
        "description": "Deploy ML models for ride demand prediction. MLflow, Kubernetes, Python, PyTorch, feature engineering.",
        "posted_days_ago": 4,
        "salary_lpa": 32,
    },
    {
        "title": "Data Engineer",
        "company": "CRED",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "Unstop",
        "link": "https://unstop.com/jobs/cred-de",
        "description": "Build robust data pipelines using Apache Airflow, Spark, Kafka, BigQuery, and dbt. Strong SQL skills required.",
        "posted_days_ago": 1,
        "salary_lpa": 26,
    },
    # Product Management
    {
        "title": "Senior Product Manager",
        "company": "PhonePe",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/phonepe-pm",
        "description": "Drive product strategy for UPI payments. Roadmap planning, user research, A/B testing, cross-functional collaboration.",
        "posted_days_ago": 2,
        "salary_lpa": 40,
    },
    {
        "title": "Product Manager - Growth",
        "company": "Zomato",
        "location": "Delhi",
        "job_type": "Full-time",
        "source": "Naukri",
        "link": "https://naukri.com/job/zomato-pm",
        "description": "Own user acquisition and retention metrics. Experimentation, funnel analysis, SQL proficiency, and stakeholder management.",
        "posted_days_ago": 6,
        "salary_lpa": 35,
    },
    # DevOps
    {
        "title": "DevOps Engineer",
        "company": "Freshworks",
        "location": "Chennai",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/freshworks-devops",
        "description": "CI/CD, Terraform, AWS, Kubernetes, Docker, monitoring with Prometheus and Grafana. SRE mindset required.",
        "posted_days_ago": 3,
        "salary_lpa": 20,
    },
    {
        "title": "Site Reliability Engineer",
        "company": "Paytm",
        "location": "Noida",
        "job_type": "Full-time",
        "source": "Naukri",
        "link": "https://naukri.com/job/paytm-sre",
        "description": "Ensure 99.99% uptime for payment services. Linux, Python scripting, Kubernetes, Prometheus, incident management.",
        "posted_days_ago": 2,
        "salary_lpa": 24,
    },
    # Design
    {
        "title": "Senior UX Designer",
        "company": "Myntra",
        "location": "Bangalore",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/myntra-ux",
        "description": "Design intuitive shopping experiences. Figma, user research, prototyping, design systems, mobile-first.",
        "posted_days_ago": 4,
        "salary_lpa": 22,
    },
    # Cybersecurity
    {
        "title": "Security Engineer",
        "company": "Druva",
        "location": "Pune",
        "job_type": "Full-time",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/druva-sec",
        "description": "Penetration testing, vulnerability assessments, SIEM, threat modelling, cloud security on AWS/Azure.",
        "posted_days_ago": 5,
        "salary_lpa": 28,
    },
    # Remote
    {
        "title": "Backend Engineer (Remote)",
        "company": "Hasura",
        "location": "Remote",
        "job_type": "Remote",
        "source": "Unstop",
        "link": "https://unstop.com/jobs/hasura-be",
        "description": "Build GraphQL engine features in Haskell and Go. Open-source contributor mindset, strong problem-solving skills.",
        "posted_days_ago": 1,
        "salary_lpa": 42,
    },
    {
        "title": "Data Scientist (Remote)",
        "company": "Sarvam AI",
        "location": "Remote",
        "job_type": "Remote",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/sarvam-ds",
        "description": "NLP research and model training for Indian languages. Python, HuggingFace, Transformers, PyTorch, research publications.",
        "posted_days_ago": 2,
        "salary_lpa": 36,
    },
    # Internship
    {
        "title": "Software Engineering Intern",
        "company": "Microsoft",
        "location": "Hyderabad",
        "job_type": "Internship",
        "source": "Unstop",
        "link": "https://unstop.com/jobs/microsoft-intern",
        "description": "6-month internship building Azure developer tools. C#/.NET or Python, data structures & algorithms, problem solving.",
        "posted_days_ago": 2,
        "salary_lpa": 8,
    },
    {
        "title": "Product Intern",
        "company": "Groww",
        "location": "Bangalore",
        "job_type": "Internship",
        "source": "Unstop",
        "link": "https://unstop.com/jobs/groww-intern",
        "description": "Support product team in building investment features. User research, PRD writing, data analysis, and coordination.",
        "posted_days_ago": 3,
        "salary_lpa": 5,
    },
    {
        "title": "Finance Analyst",
        "company": "Goldman Sachs",
        "location": "Mumbai",
        "job_type": "MNC",
        "source": "LinkedIn",
        "link": "https://linkedin.com/jobs/view/gs-finance",
        "description": "Financial modelling, valuation, equity research, risk analysis, Bloomberg terminal, CFA preferred.",
        "posted_days_ago": 7,
        "salary_lpa": 18,
    },
]


def _build_search_query(
    field: str,
    experience_level: str,
    profile_skills: Optional[List[str]] = None
) -> str:
    """Build a synthetic resume/query text for ATS matching."""
    parts = [field]
    if experience_level:
        parts.append(experience_level)
    if profile_skills:
        parts.extend(profile_skills[:10])
    return " ".join(parts)


def _filter_by_preferences(
    jobs: List[Dict],
    field: str,
    location: str,
    job_types: List[str],
    salary_min: int,
) -> List[Dict]:
    """Apply hard filters: location, job type, salary."""
    filtered = []
    
    field_lower = field.lower()
    loc_lower = location.lower().strip() if location else ""
    types_lower = [t.lower() for t in job_types] if job_types else []

    for job in jobs:
        # Location filter (soft – include Remote always, or match city)
        job_loc = job["location"].lower()
        if loc_lower and loc_lower != "remote":
            if job_loc != "remote" and loc_lower not in job_loc:
                continue

        # Job type filter
        if types_lower:
            job_type_lower = job["job_type"].lower()
            if not any(t in job_type_lower for t in types_lower):
                continue

        # Salary filter
        if salary_min > 0 and job.get("salary_lpa", 0) < salary_min:
            continue

        filtered.append(job)

    return filtered


def search_all_jobs(
    field: str,
    location: str,
    experience_level: str,
    job_types: List[str],
    salary_min: int,
    resume_text: str = "",
) -> List[Dict]:
    """
    Main function: search simulated job boards, filter by preferences,
    score each job against the resume, and return ranked results.

    Returns list of job dicts with match_score, keywords_present, keywords_missing.
    """
    # Simulate network latency (in production, remove this)
    # time.sleep(0.5)

    # Step 1: Filter candidates by preferences
    candidates = _filter_by_preferences(
        _SAMPLE_JOBS, field, location, job_types, salary_min
    )

    # If too few candidates after hard filter, loosen location constraint
    if len(candidates) < 5:
        candidates = _SAMPLE_JOBS

    # Step 2: Build query text representing the candidate's profile
    query_text = f"{field} {experience_level} developer engineer " + resume_text[:500]

    # Step 3: Score each job
    scored_jobs = []
    for job in candidates:
        job_text = f"{job['title']} {job['company']} {job['description']}"
        score, kw_present, kw_missing = calculate_ats_score_simple(query_text, job_text)

        scored_jobs.append({
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "job_type": job["job_type"],
            "source": job["source"],
            "link": job["link"],
            "match_score": score,
            "keywords_present": kw_present[:3],
            "keywords_missing": kw_missing[:2],
            "description_snippet": job["description"][:150] + "...",
            "posted_days_ago": job.get("posted_days_ago", random.randint(1, 7)),
            "salary_lpa": job.get("salary_lpa", 0),
        })

    # Step 4: Filter by minimum match score
    scored_jobs = [j for j in scored_jobs if j["match_score"] >= 40]

    # Step 5: Sort by match score
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    # Step 6: Return top 15
    return scored_jobs[:15]
