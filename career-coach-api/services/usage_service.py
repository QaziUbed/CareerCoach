from core.database import supabase
from datetime import datetime
from fastapi import HTTPException
import json

# limits for each plan
PLAN_LIMITS = {
    'free': {
        'resume_optimize': 2,
        'interview_practice': 5,
        'cover_letters': 3,
        'job_applications': 10
    },
    'job_seeker': {
        'resume_optimize': 20,
        'interview_practice': 50,
        'cover_letters': 20,
        'job_applications': 100
    },
    'pro': {
        'resume_optimize': 100,
        'interview_practice': -1,  # unlimited
        'cover_letters': 100,
        'job_applications': -1
    },
    'career_plus': {
        'resume_optimize': -1,
        'interview_practice': -1,
        'cover_letters': -1,
        'job_applications': -1
    }
}

def _get_period():
    """Returns the current month in YYYY-MM format"""
    return datetime.utcnow().strftime('%Y-%m')

async def check_limit(user_id: str, action: str, plan_name: str = 'free'):
    """
    Checks if the user has reached their usage limit for a specific action.
    Raises HTTPException 429 if limit reached.
    """
    try:
        # 1. Get current usage
        period = _get_period()
        response = supabase.table("usage_stats") \
            .select("count") \
            .eq("user_id", user_id) \
            .eq("action", action) \
            .eq("period", period) \
            .execute()
            
        current_count = 0
        if hasattr(response, 'data') and len(response.data) > 0:
            current_count = response.data[0].get('count', 0)
            
        # 2. Get limit for the plan
        plan_limits = PLAN_LIMITS.get(plan_name, PLAN_LIMITS['free'])
        limit = plan_limits.get(action, 0)
        
        # 3. Check if exceeded (-1 means unlimited)
        if limit != -1 and current_count >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Usage limit reached for {action} on {plan_name} plan. Please upgrade for more access."
            )
            
        return True
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking usage limit: {str(e)}")
        # If database fails, we fail open (allow the request)
        return True

async def increment_usage(user_id: str, action: str):
    """Increments the usage count for a user and action in the current period"""
    try:
        period = _get_period()
        
        # We use an RPC call or a select+upsert approach
        # For simplicity, we'll select then insert/update
        response = supabase.table("usage_stats") \
            .select("id, count") \
            .eq("user_id", user_id) \
            .eq("action", action) \
            .eq("period", period) \
            .execute()
            
        if hasattr(response, 'data') and len(response.data) > 0:
            stat_id = response.data[0]['id']
            new_count = response.data[0]['count'] + 1
            supabase.table("usage_stats") \
                .update({"count": new_count, "updated_at": "now()"}) \
                .eq("id", stat_id) \
                .execute()
        else:
            supabase.table("usage_stats").insert({
                "user_id": user_id,
                "action": action,
                "period": period,
                "count": 1
            }).execute()
            
    except Exception as e:
        print(f"Error incrementing usage: {str(e)}")

async def get_usage_stats(user_id: str, plan_name: str = 'free'):
    """Returns total usage and limits for all actions"""
    period = _get_period()
    plan_limits = PLAN_LIMITS.get(plan_name, PLAN_LIMITS['free'])
    current_counts = {}

    try:
        response = supabase.table("usage_stats") \
            .select("action, count") \
            .eq("user_id", user_id) \
            .eq("period", period) \
            .execute()

        if hasattr(response, 'data') and response.data:
            for item in response.data:
                current_counts[item['action']] = item.get('count', 0)
    except Exception as e:
        print(f"Error fetching usage stats: {str(e)}")

    stats = {}
    for action, limit in plan_limits.items():
        used = current_counts.get(action, 0)
        stats[action] = {
            "used": used,
            "limit": limit,
            "remaining": 9999 if limit == -1 else max(limit - used, 0),
        }

    return stats
