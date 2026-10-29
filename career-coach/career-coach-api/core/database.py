from supabase import create_client, Client
from core.config import settings

# Initialize the Supabase client using settings
supabase: Client = create_client(
    settings.SUPABASE_URL.strip(), 
    settings.SUPABASE_SERVICE_KEY.strip()
)

# ════════════════════════════════════════════════════════════════
# IMPORTANT: Row Level Security (RLS) Configuration
# ════════════════════════════════════════════════════════════════
# The following Supabase tables MUST have RLS enabled for security:
#
# 1. user_profiles - Users can only access their own profile
# 2. resumes - Users can only access their own resumes
# 3. job_applications - Users can only access their own applications
# 4. optimizations - Users can only access their own optimizations
# 5. interview_sessions - Users can only access their own sessions
# 6. usage_tracking - Users can only access their own usage data
#
# RLS Policies should filter by: auth.uid() = user_id
# ════════════════════════════════════════════════════════════════
