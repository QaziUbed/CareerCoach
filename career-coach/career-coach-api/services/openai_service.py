from groq import Groq
import os
import json
import requests

# Initialize Groq client
def get_groq_client():
    """Lazy load Groq client to avoid initialization errors."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return Groq(api_key=api_key)


async def predict_interview_questions(job_description: str, resume_summary: str, role_title: str) -> list:
    """
    Generates 10 interview questions using Groq API based on job description and resume.
    
    Args:
        job_description: The job description text
        resume_summary: Summary of the candidate's resume
        role_title: The job title/role
        
    Returns:
        List of 10 interview question objects with metadata
    """
    groq_client = get_groq_client()
    
    prompt = f"""Generate exactly 10 interview questions for {role_title}.
JOB: {job_description[:1200]}
CANDIDATE: {resume_summary}
Return ONLY a JSON array of 10 objects:
[{{"question":"...","category":"behavioral|technical|situational|company",
"why_asked":"...","answer_framework":"...","sample_talking_points":["p1","p2","p3"]}}]"""
    
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        temperature=0.7
    )
    
    text = response.choices[0].message.content.strip()
    
    # Clean markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)


async def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribes audio file using Hugging Face Whisper API (free).
    
    Args:
        audio_file_path: Path to the audio file
        
    Returns:
        Transcribed text
    """
    hf_token = os.getenv('HF_TOKEN')
    
    if not hf_token:
        raise ValueError("HF_TOKEN environment variable is not set")
    
    API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
    headers = {"Authorization": f"Bearer {hf_token}"}
    
    # Read audio file
    with open(audio_file_path, "rb") as f:
        audio_data = f.read()
    
    # Make API request
    try:
        response = requests.post(API_URL, headers=headers, data=audio_data, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        # Extract transcription text
        if isinstance(result, dict) and 'text' in result:
            return result['text']
        elif isinstance(result, list) and len(result) > 0 and 'text' in result[0]:
            return result[0]['text']
        else:
            raise ValueError(f"Unexpected response format: {result}")
            
    except requests.exceptions.Timeout:
        raise TimeoutError("Audio transcription timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to transcribe audio: {str(e)}")


async def transcribe_audio_base64(audio_base64: str, format: str = "wav") -> str:
    """
    Transcribes audio from base64 encoded string using Hugging Face Whisper API.
    
    Args:
        audio_base64: Base64 encoded audio data
        format: Audio format (wav, mp3, etc.)
        
    Returns:
        Transcribed text
    """
    import base64
    import tempfile
    
    # Decode base64 to bytes
    audio_bytes = base64.b64decode(audio_base64)
    
    # Write to temporary file
    with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as temp_file:
        temp_file.write(audio_bytes)
        temp_path = temp_file.name
    
    try:
        # Transcribe using the file path
        transcription = await transcribe_audio(temp_path)
        return transcription
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
