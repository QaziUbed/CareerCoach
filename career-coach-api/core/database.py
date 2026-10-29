"""
Supabase client bootstrap.

Fails softly when credentials are missing so local tooling (OpenAPI, health)
still starts. Route handlers that need the DB will raise clear errors.
"""

from typing import Optional

from supabase import Client, create_client

from core.config import settings

supabase: Optional[Client] = None


def get_supabase() -> Client:
    """Return the shared Supabase client, initializing it on first use."""
    global supabase
    if supabase is not None:
        return supabase

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
        )

    if "your_" in settings.SUPABASE_URL or "your_" in settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase credentials still contain placeholder values. Update career-coach-api/.env"
        )

    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return supabase


try:
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY and "your_" not in settings.SUPABASE_URL:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
except Exception as exc:
    print(f"Warning: Supabase client failed to initialize at import time: {exc}")
    supabase = None
