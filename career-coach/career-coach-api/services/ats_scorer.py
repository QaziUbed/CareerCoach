import os
import requests

def extract_keywords(text: str) -> set:
    """
    Extracts lowercase keywords from text by splitting into words,
    removing stopwords, punctuation, and words shorter than 3 characters
    or purely numeric.
    """
    stopwords = {
        'the','a','an','and','or','but','in','on','at','to',
        'for','of','with','by','from','is','are','was','were','be','been',
        'have','has','had','do','does','did','will','would','could','should',
        'may','might','i','you','he','she','it','we','they','this','that',
        'these','those','my','your','his','her','our','their','what','which',
        'who','how','when','where','why','not','no','so','if','as','up','out',
        'about','into','than','then','its','also','can','all','each','their'
    }
    
    # Simple punctuation removal from start and end of words
    words = text.lower().split()
    keywords = set()
    
    for word in words:
        # Strip common punctuation
        clean_word = word.strip(".,;:!?()[]{}'\"")
        
        # Keep word if it meets rules
        if len(clean_word) >= 3 and not clean_word.isdigit() and clean_word not in stopwords:
            keywords.add(clean_word)
            
    return keywords

def calculate_ats_score_simple(resume_text: str, job_description: str) -> tuple:
    """
    Fallback ATS scoring logic that doesn't use the Hugging Face API.
    Uses purely keyword matching with a hardcoded semantic score of 0.5.
    
    Returns:
        tuple: (score: int, keywords_present: list, keywords_missing: list)
    """
    jd_keywords = extract_keywords(job_description)
    resume_keywords = extract_keywords(resume_text)
    
    if not jd_keywords:
        return 50, [], []
        
    matched = jd_keywords.intersection(resume_keywords)
    missing = jd_keywords - resume_keywords
    keyword_ratio = len(matched) / len(jd_keywords)
    
    semantic_score = 0.5
    
    final_score = (keyword_ratio * 0.7 + semantic_score * 0.3) * 100
    final_score = int(max(10, min(98, final_score)))
    
    return (
        final_score,
        sorted(list(matched))[:20],
        sorted(list(missing), key=len, reverse=True)[:15]
    )

def calculate_ats_score(resume_text: str, job_description: str) -> tuple:
    """
    Scores the ATS match rate using traditional keyword subsetting combined with 
    a semantic similarity check against a Hugging Face Sentence Transformer model.
    Falls back to simple logic if HF_TOKEN is not configured.
    
    Returns:
        tuple: (score: int, keywords_present: list, keywords_missing: list)
    """
    hf_token = os.getenv('HF_TOKEN')
    
    # Fallback to simple logic if no HuggingFace token is set in environment
    if not hf_token:
        return calculate_ats_score_simple(resume_text, job_description)
        
    API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {hf_token}"}
    payload = {
        "inputs": {
            "source_sentence": job_description[:1000],
            "sentences": [resume_text[:1000]]
        }
    }
    
    semantic_score = 0.5
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            semantic_score = float(response.json()[0])
    except Exception:
        pass
        
    jd_keywords = extract_keywords(job_description)
    resume_keywords = extract_keywords(resume_text)
    
    if not jd_keywords:
        return 50, [], []
        
    matched = jd_keywords.intersection(resume_keywords)
    missing = jd_keywords - resume_keywords
    keyword_ratio = len(matched) / len(jd_keywords)
    
    final_score = (keyword_ratio * 0.7 + semantic_score * 0.3) * 100
    final_score = int(max(10, min(98, final_score)))
    
    return (
        final_score,
        sorted(list(matched))[:20],
        sorted(list(missing), key=len, reverse=True)[:15]
    )

if __name__ == '__main__':
    resume = "Python developer with 3 years experience in FastAPI REST APIs and PostgreSQL database management. Built machine learning pipelines and deployed Docker containers on AWS."
    jd = "Looking for Python developer experienced in FastAPI, PostgreSQL, AWS deployment, Docker, and REST API development."
    
    score, present, missing = calculate_ats_score_simple(resume, jd)
    print(f"Score: {score}")
    print(f"Present: {present[:5]}")
    print(f"Missing: {missing[:5]}")
    
    assert score >= 50, "Score should be high when resume matches JD"
    print("Test passed!")
