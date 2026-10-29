from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List, Optional

router = APIRouter()

# Expo Push API endpoint
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

class PushTokenRequest(BaseModel):
    user_id: str
    push_token: str
    platform: str

class SendNotificationRequest(BaseModel):
    to: str | List[str]  # Expo push token(s)
    title: str
    body: str
    data: Optional[dict] = None
    sound: Optional[str] = "default"
    badge: Optional[int] = None
    priority: Optional[str] = "high"

# In-memory storage for push tokens (replace with database in production)
push_tokens_db = {}

@router.post("/profile/push-token")
async def save_push_token(request: PushTokenRequest):
    """
    Save user's Expo push token for sending notifications
    """
    push_tokens_db[request.user_id] = {
        "token": request.push_token,
        "platform": request.platform
    }
    return {
        "success": True,
        "message": "Push token saved successfully",
        "user_id": request.user_id
    }

@router.get("/profile/push-token/{user_id}")
async def get_push_token(user_id: str):
    """
    Get user's push token
    """
    token_data = push_tokens_db.get(user_id)
    if not token_data:
        raise HTTPException(status_code=404, detail="Push token not found")
    return token_data

@router.post("/notifications/send")
async def send_push_notification(request: SendNotificationRequest):
    """
    Send push notification via Expo Push API
    For admin use: send notifications to specific users
    """
    try:
        # Prepare notification payload
        messages = []
        
        # Handle single token or list of tokens
        tokens = [request.to] if isinstance(request.to, str) else request.to
        
        for token in tokens:
            message = {
                "to": token,
                "sound": request.sound,
                "title": request.title,
                "body": request.body,
                "data": request.data or {},
                "priority": request.priority,
            }
            
            if request.badge is not None:
                message["badge"] = request.badge
                
            messages.append(message)
        
        # Send to Expo Push API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Expo Push API error: {response.text}"
                )
            
            result = response.json()
            
            # Check for errors in response
            errors = []
            for idx, ticket in enumerate(result.get("data", [])):
                if ticket.get("status") == "error":
                    errors.append({
                        "token": tokens[idx],
                        "error": ticket.get("message", "Unknown error")
                    })
            
            return {
                "success": len(errors) == 0,
                "sent": len(tokens) - len(errors),
                "failed": len(errors),
                "errors": errors if errors else None,
                "tickets": result.get("data", [])
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {str(e)}"
        )

@router.post("/notifications/send-to-user/{user_id}")
async def send_notification_to_user(user_id: str, title: str, body: str, data: Optional[dict] = None):
    """
    Send notification to a specific user by user_id
    Convenience endpoint that looks up the user's push token
    """
    token_data = push_tokens_db.get(user_id)
    if not token_data:
        raise HTTPException(status_code=404, detail="User push token not found")
    
    request = SendNotificationRequest(
        to=token_data["token"],
        title=title,
        body=body,
        data=data
    )
    
    return await send_push_notification(request)

@router.post("/notifications/broadcast")
async def broadcast_notification(title: str, body: str, data: Optional[dict] = None):
    """
    Send notification to all registered users
    For admin use: weekly tips, announcements, etc.
    """
    if not push_tokens_db:
        return {
            "success": True,
            "message": "No users to send notifications to",
            "sent": 0
        }
    
    # Get all push tokens
    tokens = [token_data["token"] for token_data in push_tokens_db.values()]
    
    request = SendNotificationRequest(
        to=tokens,
        title=title,
        body=body,
        data=data
    )
    
    return await send_push_notification(request)

@router.delete("/profile/push-token/{user_id}")
async def delete_push_token(user_id: str):
    """
    Delete user's push token (e.g., on logout)
    """
    if user_id in push_tokens_db:
        del push_tokens_db[user_id]
        return {"success": True, "message": "Push token deleted"}
    
    raise HTTPException(status_code=404, detail="Push token not found")
