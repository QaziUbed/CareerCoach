from datetime import datetime
from core.database import supabase
from fastapi import HTTPException, status

# Usage limits per plan per month
USAGE_LIMITS = {
    'free': {
        'resume_optimize': 3,
        'cover_letter_generate': 2,
        'interview_practice': 5,
    },
    'job_seeker': {
        'resume_optimize': -1,  # -1 means unlimited
        'cover_letter_generate': -1,
        'interview_practice': -1,
    },
    'pro': {
        'resume_optimize': -1,
        'cover_letter_generate': -1,
        'interview_practice': -1,
    },
    'career_plus': {
        'resume_optimize': -1,
        'cover_letter_generate': -1,
        'interview_practice': -1,
    }
}

def get_current_period() -> str:
    """Returns the current month period in YYYY-MM format."""
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"

async def check_limit(user_id: str, action: str, plan: str = 'free') -> bool:
    """
    Check if user has reached their usage limit for the given action.
    
    Args:
        user_id: The user's ID
        action: The action type (e.g., 'resume_optimize')
        plan: The user's plan type (default: 'free')
        
    Returns:
        bool: True if user can proceed, raises HTTPException if limit reached
    """
    # Get limit for this plan and action
    plan_limits = USAGE_LIMITS.get(plan, USAGE_LIMITS['free'])
    limit = plan_limits.get(action, 0)
    
    # -1 means unlimited
    if limit == -1:
        return True
    
    # Get usage count for current period
    period = get_current_period()
    
    response = supabase.table("usage_tracking") \
        .select("count") \
        .eq("user_id", user_id) \
        .eq("action", action) \
        .eq("period", period) \
        .execute()
    
    current_count = 0
    if hasattr(response, 'data') and len(response.data) > 0:
        current_count = response.data[0].get('count', 0)
    
    if current_count >= limit:
        action_names = {
            'resume_optimize': 'optimizations',
            'cover_letter_generate': 'cover letters',
            'interview_practice': 'interview practices'
        }
        action_name = action_names.get(action, 'actions')
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f'You have used all {limit} free {action_name} this month. Upgrade to continue.'
        )
    
    return True

async def increment_usage(user_id: str, action: str) -> None:
    """
    Increment the usage count for a user action.
    Uses upsert to handle existing records.
    
    Args:
        user_id: The user's ID
        action: The action type (e.g., 'resume_optimize')
    """
    period = get_current_period()
    
    try:
        # Check if record exists
        response = supabase.table("usage_tracking") \
            .select("id, count") \
            .eq("user_id", user_id) \
            .eq("action", action) \
            .eq("period", period) \
            .execute()
        
        if hasattr(response, 'data') and len(response.data) > 0:
            # Update existing record
            record = response.data[0]
            new_count = record.get('count', 0) + 1
            supabase.table("usage_tracking") \
                .update({"count": new_count}) \
                .eq("id", record['id']) \
                .execute()
        else:
            # Insert new record
            supabase.table("usage_tracking").insert({
                "user_id": user_id,
                "action": action,
                "period": period,
                "count": 1
            }).execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to increment usage: {str(e)}")

async def get_usage_stats(user_id: str) -> dict:
    """
    Get usage statistics for the current user for the current month.
    
    Args:
        user_id: The user's ID
        
    Returns:
        dict: Usage counts by action type
    """
    period = get_current_period()
    
    try:
        response = supabase.table("usage_tracking") \
            .select("action, count") \
            .eq("user_id", user_id) \
            .eq("period", period) \
            .execute()
        
        if not hasattr(response, 'data'):
            return {}
    except Exception as e:
        print(f"Failed to fetch usage tracking (API Error / missing table): {str(e)}")
        return {}
    
    # Build stats dictionary
    stats = {}
    for record in response.data:
        action = record.get("action")
        count = record.get("count", 0)
        stats[action] = count
    
    return stats
