import asyncio
import os
from dotenv import load_dotenv

import json

# Force loading .env
load_dotenv()

from services.claude_service import optimize_resume as optimize_resume_ai

async def main():
    try:
        data = await optimize_resume_ai("Senior software engineer", "Looking for python dev", ["python", "django"])
        print(data)
    except Exception as e:
        print(f"FAILED WITH Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
