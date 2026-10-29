from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import stripe
import os
from core.config import settings
from core.database import supabase
from core.auth import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])
security = HTTPBearer(auto_error=False)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Price ID to plan name mapping
PRICE_TO_PLAN = {
    'price_jobseeker_monthly': 'job_seeker',
    'price_pro_monthly': 'pro',
    'price_careerplus_monthly': 'career_plus',
}


@router.post("/webhook", summary="Stripe Webhook Handler")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    No authentication required - this is called by Stripe.
    Verifies webhook signature for security.
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured"
        )
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payload: {str(e)}"
        )
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid signature: {str(e)}"
        )
    
    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']
    
    try:
        if event_type == 'customer.subscription.created':
            await handle_subscription_created(event_data)
        
        elif event_type == 'customer.subscription.updated':
            await handle_subscription_updated(event_data)
        
        elif event_type == 'customer.subscription.deleted':
            await handle_subscription_deleted(event_data)
        
        else:
            # Log unhandled event types
            print(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        print(f"Error handling webhook event {event_type}: {str(e)}")
        # Return 200 to acknowledge receipt even if processing failed
        # This prevents Stripe from retrying indefinitely
    
    return {"status": "success"}


async def handle_subscription_created(subscription):
    """
    Handle customer.subscription.created event.
    Updates user plan when subscription is created.
    """
    customer_id = subscription.get('customer')
    
    # Get price_id from subscription items
    items = subscription.get('items', {}).get('data', [])
    if not items:
        print(f"No items in subscription for customer {customer_id}")
        return
    
    price_id = items[0].get('price', {}).get('id')
    
    # Map price_id to plan name
    plan_name = PRICE_TO_PLAN.get(price_id)
    
    if not plan_name:
        print(f"Unknown price_id: {price_id}")
        # Default to free if price not recognized
        plan_name = 'free'
    
    # Update user plan in database
    try:
        # For development without database
        print(f"Subscription created: customer={customer_id}, plan={plan_name}")
        
        # Uncomment when database is ready:
        # response = supabase.table("user_profiles") \
        #     .update({"plan": plan_name}) \
        #     .eq("stripe_customer_id", customer_id) \
        #     .execute()
        # 
        # if not hasattr(response, 'data') or len(response.data) == 0:
        #     print(f"No user found with stripe_customer_id: {customer_id}")
    
    except Exception as e:
        print(f"Error updating user plan: {str(e)}")
        raise


async def handle_subscription_updated(subscription):
    """
    Handle customer.subscription.updated event.
    Updates user plan when subscription changes.
    """
    customer_id = subscription.get('customer')
    subscription_status = subscription.get('status')
    
    # Get price_id from subscription items
    items = subscription.get('items', {}).get('data', [])
    if not items:
        print(f"No items in subscription for customer {customer_id}")
        return
    
    price_id = items[0].get('price', {}).get('id')
    
    # Map price_id to plan name
    plan_name = PRICE_TO_PLAN.get(price_id, 'free')
    
    # If subscription is not active, set to free
    if subscription_status not in ['active', 'trialing']:
        plan_name = 'free'
    
    # Update user plan in database
    try:
        # For development without database
        print(f"Subscription updated: customer={customer_id}, plan={plan_name}, status={subscription_status}")
        
        # Uncomment when database is ready:
        # response = supabase.table("user_profiles") \
        #     .update({"plan": plan_name}) \
        #     .eq("stripe_customer_id", customer_id) \
        #     .execute()
        # 
        # if not hasattr(response, 'data') or len(response.data) == 0:
        #     print(f"No user found with stripe_customer_id: {customer_id}")
    
    except Exception as e:
        print(f"Error updating user plan: {str(e)}")
        raise


async def handle_subscription_deleted(subscription):
    """
    Handle customer.subscription.deleted event.
    Sets user plan to free when subscription is cancelled.
    """
    customer_id = subscription.get('customer')
    
    # Update user plan to free
    try:
        # For development without database
        print(f"Subscription deleted: customer={customer_id}, setting plan to free")
        
        # Uncomment when database is ready:
        # response = supabase.table("user_profiles") \
        #     .update({"plan": "free"}) \
        #     .eq("stripe_customer_id", customer_id) \
        #     .execute()
        # 
        # if not hasattr(response, 'data') or len(response.data) == 0:
        #     print(f"No user found with stripe_customer_id: {customer_id}")
    
    except Exception as e:
        print(f"Error updating user plan: {str(e)}")
        raise


@router.post("/create-portal-session", summary="Create Stripe Customer Portal Session")
async def create_portal_session(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Creates a Stripe Customer Portal session for the authenticated user.
    Returns the portal URL where users can manage their subscription.
    """
    # For development without auth, use mock user
    if not credentials:
        user_id = "dev-user-123"
        user_email = "dev@example.com"
    else:
        current_user = get_current_user(credentials)
        user_id = current_user.get("user_id")
        user_email = current_user.get("email")
    
    try:
        # Get user's stripe_customer_id from database
        stripe_customer_id = None
        
        # For development without database
        # Uncomment when database is ready:
        # response = supabase.table("user_profiles") \
        #     .select("stripe_customer_id") \
        #     .eq("id", user_id) \
        #     .execute()
        # 
        # if hasattr(response, 'data') and len(response.data) > 0:
        #     stripe_customer_id = response.data[0].get('stripe_customer_id')
        
        # If user doesn't have a Stripe customer ID, create one
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={
                    'user_id': user_id
                }
            )
            stripe_customer_id = customer.id
            
            # Save stripe_customer_id to database
            # For development without database
            print(f"Created Stripe customer: {stripe_customer_id} for user {user_id}")
            
            # Uncomment when database is ready:
            # supabase.table("user_profiles") \
            #     .update({"stripe_customer_id": stripe_customer_id}) \
            #     .eq("id", user_id) \
            #     .execute()
        
        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=os.getenv('APP_URL', 'http://localhost:8000') + '/settings',
        )
        
        return {
            "url": session.url
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portal session: {str(e)}"
        )
