#!/usr/bin/env python3
"""
Test script for Stripe billing webhook
Run this to test webhook handling locally
"""

import requests
import json
import time
import hmac
import hashlib

# Configuration
API_URL = "http://localhost:8000/api/billing/webhook"
WEBHOOK_SECRET = "whsec_test_secret"  # Replace with your actual webhook secret

def generate_stripe_signature(payload: str, secret: str) -> str:
    """Generate a valid Stripe signature for testing"""
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"

def test_subscription_created():
    """Test customer.subscription.created webhook"""
    print("\n🧪 Testing: customer.subscription.created")
    
    payload = {
        "id": "evt_test_123",
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "active",
                "items": {
                    "data": [
                        {
                            "price": {
                                "id": "price_pro_monthly"
                            }
                        }
                    ]
                }
            }
        }
    }
    
    payload_str = json.dumps(payload)
    signature = generate_stripe_signature(payload_str, WEBHOOK_SECRET)
    
    headers = {
        "stripe-signature": signature,
        "Content-Type": "application/json"
    }
    
    response = requests.post(API_URL, data=payload_str, headers=headers)
    
    if response.status_code == 200:
        print("✅ Success! Subscription created webhook handled")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(f"   Response: {response.text}")

def test_subscription_updated():
    """Test customer.subscription.updated webhook"""
    print("\n🧪 Testing: customer.subscription.updated")
    
    payload = {
        "id": "evt_test_456",
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "active",
                "items": {
                    "data": [
                        {
                            "price": {
                                "id": "price_careerplus_monthly"
                            }
                        }
                    ]
                }
            }
        }
    }
    
    payload_str = json.dumps(payload)
    signature = generate_stripe_signature(payload_str, WEBHOOK_SECRET)
    
    headers = {
        "stripe-signature": signature,
        "Content-Type": "application/json"
    }
    
    response = requests.post(API_URL, data=payload_str, headers=headers)
    
    if response.status_code == 200:
        print("✅ Success! Subscription updated webhook handled")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(f"   Response: {response.text}")

def test_subscription_deleted():
    """Test customer.subscription.deleted webhook"""
    print("\n🧪 Testing: customer.subscription.deleted")
    
    payload = {
        "id": "evt_test_789",
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "canceled"
            }
        }
    }
    
    payload_str = json.dumps(payload)
    signature = generate_stripe_signature(payload_str, WEBHOOK_SECRET)
    
    headers = {
        "stripe-signature": signature,
        "Content-Type": "application/json"
    }
    
    response = requests.post(API_URL, data=payload_str, headers=headers)
    
    if response.status_code == 200:
        print("✅ Success! Subscription deleted webhook handled")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(f"   Response: {response.text}")

def test_invalid_signature():
    """Test webhook with invalid signature"""
    print("\n🧪 Testing: Invalid signature")
    
    payload = {
        "id": "evt_test_invalid",
        "type": "customer.subscription.created",
        "data": {"object": {}}
    }
    
    payload_str = json.dumps(payload)
    
    headers = {
        "stripe-signature": "t=123456789,v1=invalid_signature",
        "Content-Type": "application/json"
    }
    
    response = requests.post(API_URL, data=payload_str, headers=headers)
    
    if response.status_code == 400:
        print("✅ Success! Invalid signature rejected")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed! Expected 400, got {response.status_code}")
        print(f"   Response: {response.text}")

def test_create_portal_session():
    """Test create portal session endpoint"""
    print("\n🧪 Testing: Create portal session")
    
    url = "http://localhost:8000/api/billing/create-portal-session"
    
    response = requests.post(url)
    
    if response.status_code == 200:
        print("✅ Success! Portal session created")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(f"   Response: {response.text}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Stripe Billing Webhook Test Suite")
    print("=" * 60)
    print("\n⚠️  Make sure your FastAPI server is running on localhost:8000")
    print("   Run: uvicorn main:app --reload")
    print("\n" + "=" * 60)
    
    try:
        # Test webhook events
        test_subscription_created()
        test_subscription_updated()
        test_subscription_deleted()
        test_invalid_signature()
        
        # Test portal session
        test_create_portal_session()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print("   Make sure FastAPI server is running on localhost:8000")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
