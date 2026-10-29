import os
import json
import base64
import re
import logging
from typing import List, Dict, Any, Optional

# Use AsyncGroq for non-blocking calls
from groq import AsyncGroq, APIStatusError

# --- CONFIGURATION & CONSTANTS ---

# API KEY REQUIREMENT:
# Environment Variable: 'GROQ_API_KEY'
# Action: Set this in your environment variables.
# Get your key here: https://console.groq.com/keys
try:
    from core.config import settings
    GROQ_API_KEY = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
except Exception:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Models
MODEL_TEXT = "llama-3.3-70b-versatile"
MODEL_AUDIO = "whisper-large-v3-turbo" # Optimized for speed

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_client() -> AsyncGroq:
    """
    Returns an asynchronous Groq client.
    Raises ValueError if API Key is missing.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY environment variable is not set.")
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return AsyncGroq(api_key=GROQ_API_KEY)

def _parse_json(text: str) -> Any:
    """
    Robustly parses JSON from LLM output.
    Handles markdown code blocks and conversational filler text.
    """
    try:
        # Remove markdown code blocks if present
        matches = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if matches:
            return json.loads(matches[0].strip())

        # Fallback: Find first '[' or '{' and parse
        # This handles lists starting with [ or objects with {
        start_idx = min(text.find('{'), text.find('['))
        if start_idx != -1:
            # Heuristic to find the matching end bracket
            # This is a simplified approach; for complex nested parsing, a stack is needed
            # but for LLM output, finding the last bracket is usually sufficient.
            end_idx = max(text.rfind('}'), text.rfind(']')) + 1
            if end_idx > start_idx:
                return json.loads(text[start_idx:end_idx])

        return json.loads(text) # Fallback attempt
    except json.JSONDecodeError as e:
        logger.error(f"JSON Decode Error: {e}. Raw text: {text[:200]}")
        raise ValueError("Failed to parse AI response.")

async def predict_interview_questions(job_description: str, resume_summary: str, role_title: str) -> List[Dict[str, Any]]:
    """
    Generates 10 interview questions using Groq API based on job description and resume.
    """
    client = get_client()

    prompt = f"""Generate exactly 10 interview questions for {role_title}.
JOB: {job_description[:1200]}
CANDIDATE: {resume_summary}
Return ONLY a JSON array of 10 objects:
[{{"question":"...","category":"behavioral|technical|situational|company",
"why_asked":"...","answer_framework":"...","sample_talking_points":["p1","p2","p3"]}}]"""

    try:
        logger.info(f"Generating interview questions for role: {role_title}")
        response = await client.chat.completions.create(
            model=MODEL_TEXT,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7
        )

        text = response.choices[0].message.content.strip()
        return _parse_json(text)

    except Exception as e:
        logger.error(f"Failed to generate questions: {str(e)}")
        # Return empty list or re-raise depending on desired frontend behavior
        raise RuntimeError("Failed to generate interview questions at this time.")

async def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribes audio file using Groq Whisper API (fast and reliable).
    Reads file synchronously (small blocking) but sends request asynchronously.
    """
    client = get_client()

    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

    try:
        # Note: Reading the file is synchronous I/O.
        # For high-throughput systems, use aiofiles for async reading.
        with open(audio_file_path, "rb") as audio_file:
            file_content = audio_file.read()
            filename = os.path.basename(audio_file_path)

            logger.info(f"Transcribing file: {filename}")
            transcription = await client.audio.transcriptions.create(
                file=(filename, file_content),
                model=MODEL_AUDIO,
            )
            return transcription.text

    except APIStatusError as e:
        logger.error(f"Groq API Error during transcription: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {e}")
        raise Exception(f"Failed to transcribe audio: {str(e)}")

async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """
    Helper to transcribe raw audio bytes directly without saving to disk.
    """
    client = get_client()

    try:
        logger.info("Transcribing audio from memory buffer...")
        transcription = await client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model=MODEL_AUDIO,
        )
        return transcription.text
    except Exception as e:
        logger.error(f"Error transcribing bytes: {e}")
        raise

async def transcribe_audio_base64(audio_base64: str, format: str = "wav") -> str:
    """
    Transcribes audio from base64 encoded string.
    Optimized to decode in memory and avoid disk I/O.
    """
    try:
        # Decode base64 to bytes
        audio_bytes = base64.b64decode(audio_base64)

        # Pass directly to the bytes transcription helper
        # This avoids the overhead of creating/cleaning up temp files
        return await transcribe_audio_bytes(audio_bytes, filename=f"audio.{format}")

    except base64.binascii.Error as e:
        logger.error(f"Base64 decoding failed: {e}")
        raise ValueError("Invalid base64 audio data")
    except Exception as e:
        logger.error(f"Error in base64 transcription: {e}")
        raise