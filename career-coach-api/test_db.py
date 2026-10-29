import asyncio
from datetime import datetime
from core.database import supabase
import sys
import json

async def test_insert():
    now = datetime.utcnow().isoformat()
    application = {
        "user_id": "00000000-0000-0000-0000-000000000001",
        "company_name": "Test",
        "job_title": "Test Title",
        "applied_date": datetime.utcnow().date().isoformat(),
        "created_at": now,
        "updated_at": now,
    }
    try:
        res = supabase.table("job_applications").insert(application).execute()
        with open('out.log', 'w') as f:
            f.write("Success")
    except Exception as e:
        with open('out.log', 'w') as f:
            f.write(str(e))

if __name__ == '__main__':
    asyncio.run(test_insert())
