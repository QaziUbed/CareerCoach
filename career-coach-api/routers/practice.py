from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from core.auth import get_current_user
import random

router = APIRouter()

# --- MOCK DATA FOR APTITUDE ---
APTITUDE_TOPICS = [
    {"id": "english", "title": "English Aptitude", "description": "Vocabulary, Grammar, Reading Comprehension", "question_count": 50},
    {"id": "reasoning", "title": "Logical Reasoning", "description": "Puzzles, Syllogisms, Blood Relations", "question_count": 75},
    {"id": "quant", "title": "Quantitative Aptitude", "description": "Algebra, Time & Work, Probability", "question_count": 100},
    {"id": "data", "title": "Data Interpretation", "description": "Charts, Graphs, Tables", "question_count": 40},
]

APTITUDE_QUESTIONS = [
    {
        "id": "q1",
        "topic_id": "english",
        "question": "Choose the synonym for 'Eloquent'.",
        "options": ["Silent", "Articulate", "Confused", "Boring"],
        "correct_index": 1,
        "explanation": "'Eloquent' means fluent or persuasive in speaking or writing. 'Articulate' is the closest synonym."
    },
    {
        "id": "q2",
        "topic_id": "reasoning",
        "question": "If A is the brother of B; B is the sister of C; and C is the father of D, how D is related to A?",
        "options": ["Nephew", "Niece", "Cannot be determined", "Uncle"],
        "correct_index": 2,
        "explanation": "If C is the father of D, D could be male or female. Thus, the exact relationship to A (who is C's brother) cannot be determined without knowing D's gender."
    }
]

# --- MOCK DATA FOR COMPANIES ---
COMPANIES = [
    {"id": "google", "name": "Google", "industry": "Technology", "logo_emoji": "🔍"},
    {"id": "microsoft", "name": "Microsoft", "industry": "Technology", "logo_emoji": "🪟"},
    {"id": "amazon", "name": "Amazon", "industry": "E-Commerce", "logo_emoji": "📦"},
    {"id": "tcs", "name": "Tata Consultancy Services", "industry": "IT Services", "logo_emoji": "🏢"},
    {"id": "infosys", "name": "Infosys", "industry": "IT Services", "logo_emoji": "🌐"},
    {"id": "wipro", "name": "Wipro", "industry": "IT Services", "logo_emoji": "💡"},
    {"id": "meta", "name": "Meta", "industry": "Technology", "logo_emoji": "📱"},
    {"id": "apple", "name": "Apple", "industry": "Technology", "logo_emoji": "🍎"},
]

# Provide just a list of generic companies to reach ~30-40 as requested.
ADDITIONAL_COMPANIES = ["Accenture", "Cognizant", "Capgemini", "IBM", "HCL Tech", "Tech Mahindra", "Deloitte", "PwC", "EY", "KPMG", "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Cisco", "Intel", "Qualcomm", "Oracle", "SAP", "Salesforce", "Adobe", "Uber", "Airbnb", "Flipkart", "Walmart", "Paytm", "PhonePe", "Zomato", "Swiggy", "Netflix", "Atlassian", "Stripe", "PluralSight"]
for i, comp in enumerate(ADDITIONAL_COMPANIES):
    COMPANIES.append({"id": comp.lower().replace(" ", "_"), "name": comp, "industry": "Various", "logo_emoji": "🏢"})

COMPANY_QUESTIONS = [
    {
        "id": "cq1",
        "company_id": "google",
        "question": "Given an array of integers, return indices of the two numbers such that they add up to a specific target. (Two Sum)",
        "difficulty": "Easy",
        "frequency": "High",
        "category": "Coding"
    },
    {
        "id": "cq2",
        "company_id": "amazon",
        "question": "Tell me about a time you had to deal with ambiguity.",
        "difficulty": "Medium",
        "frequency": "High",
        "category": "Behavioral"
    },
    {
        "id": "cq3",
        "company_id": "microsoft",
        "question": "How would you design a URL shortener like TinyURL?",
        "difficulty": "Hard",
        "frequency": "Medium",
        "category": "System Design"
    }
]

# --- MOCK DATA FOR CODING ---
CODING_TOPICS = [
    {"id": "arrays", "title": "Arrays & Strings", "description": "Core logic building with basic data structures."},
    {"id": "hashmaps", "title": "Hashmaps & Sets", "description": "Frequency counting and O(1) lookups."},
    {"id": "dp", "title": "Dynamic Programming", "description": "Optimization and overlapping subproblems."},
]

CODING_QUESTIONS = [
    {
        "id": "code1",
        "topic_id": "arrays",
        "title": "Reverse an Array",
        "description": "Write a function to reverse an array in-place without using extra memory.",
        "difficulty": "Easy",
        "solution_snippet": "for i in range(len(arr) // 2):\n    arr[i], arr[n-i-1] = arr[n-i-1], arr[i]"
    }
]


@router.get("/aptitude/topics")
async def get_aptitude_topics(current_user: dict = Depends(get_current_user)):
    return {"topics": APTITUDE_TOPICS}

@router.get("/aptitude/questions/{topic_id}")
async def get_aptitude_questions(topic_id: str, current_user: dict = Depends(get_current_user)):
    # Return questions matching topic or random if not found in mock data
    questions = [q for q in APTITUDE_QUESTIONS if q["topic_id"] == topic_id]
    if not questions:
        # Give some dummy ones just to make it functional
        return {"questions": [
            {
                "id": f"rand_{i}",
                "topic_id": topic_id,
                "question": f"Sample practicing question {i} for {topic_id}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_index": 0,
                "explanation": "This is a sample explanation."
            } for i in range(1, 6)
        ]}
    return {"questions": questions}

@router.get("/companies")
async def get_companies(current_user: dict = Depends(get_current_user)):
    return {"companies": COMPANIES}

@router.get("/companies/{company_id}/questions")
async def get_company_questions(company_id: str, current_user: dict = Depends(get_current_user)):
    questions = [q for q in COMPANY_QUESTIONS if q["company_id"] == company_id]
    if not questions:
        # Default mock questions
        return {"questions": [
            {
                "id": f"cq_rand_{i}",
                "company_id": company_id,
                "question": f"Frequently asked {['Behavioral', 'Technical', 'System Design'][i%3]} question for {company_id}.",
                "difficulty": ["Easy", "Medium", "Hard"][i%3],
                "frequency": "High",
                "category": ["Behavioral", "Technical", "System Design"][i%3]
            } for i in range(1, 4)
        ]}
    return {"questions": questions}

@router.get("/coding/topics")
async def get_coding_topics(current_user: dict = Depends(get_current_user)):
    return {"topics": CODING_TOPICS}

@router.get("/coding/questions/{topic_id}")
async def get_coding_questions(topic_id: str, current_user: dict = Depends(get_current_user)):
    questions = [q for q in CODING_QUESTIONS if q["topic_id"] == topic_id]
    if not questions:
        return {"questions": [
            {
                "id": f"code_rand_{i}",
                "topic_id": topic_id,
                "title": f"Coding Problem {i}",
                "description": f"Solve this generic logic building problem for {topic_id}.",
                "difficulty": "Medium",
                "solution_snippet": "def solve():\n    pass"
            } for i in range(1, 4)
        ]}
    return {"questions": questions}
