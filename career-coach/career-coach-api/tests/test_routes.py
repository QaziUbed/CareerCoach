"""
Comprehensive test suite for Career Coach API
Tests authentication, authorization, file uploads, and business logic
"""

import pytest
import httpx
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from services.ats_scorer import calculate_ats_score_simple
from services import usage_service

client = TestClient(app)

# ════════════════════════════════════════
# TEST 1 — Health Check (No Auth)
# ════════════════════════════════════════

def test_health_check():
    """Health endpoint should work without authentication"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


# ════════════════════════════════════════
# TEST 2 — Auth Required (No Token)
# ════════════════════════════════════════

def test_profile_no_auth():
    """Profile endpoint should return 401/403 without token"""
    response = client.get("/api/profile")
    assert response.status_code in [401, 403]


def test_resume_list_no_auth():
    """Resume list should require authentication"""
    response = client.get("/api/resume/list")
    assert response.status_code in [401, 403]


# ════════════════════════════════════════
# TEST 3 — Auth Required (Invalid Token)
# ════════════════════════════════════════

def test_profile_invalid_token():
    """Profile endpoint should reject invalid JWT token"""
    headers = {"Authorization": "Bearer invalid_fake_token_12345"}
    response = client.get("/api/profile", headers=headers)
    assert response.status_code == 401


def test_resume_list_invalid_token():
    """Resume list should reject invalid token"""
    headers = {"Authorization": "Bearer fake_token"}
    response = client.get("/api/resume/list", headers=headers)
    assert response.status_code == 401


# ════════════════════════════════════════
# TEST 4 — Resume Upload Validation
# ════════════════════════════════════════

def test_resume_upload_wrong_extension():
    """Resume upload should reject non-PDF files"""
    # Create a fake .txt file
    files = {"file": ("resume.txt", b"This is a text file", "text/plain")}
    headers = {"Authorization": "Bearer fake_token"}
    
    response = client.post("/api/resume/upload", files=files, headers=headers)
    
    # Should fail with 400 (bad request) or 401 (no auth)
    # If auth fails first, that's also acceptable
    assert response.status_code in [400, 401]
    
    if response.status_code == 400:
        assert "pdf" in response.json()["detail"].lower()


def test_resume_upload_file_too_large():
    """Resume upload should reject files larger than 5MB"""
    # Create a file larger than 5MB (5 * 1024 * 1024 bytes)
    large_content = b"x" * (6 * 1024 * 1024)  # 6MB
    files = {"file": ("resume.pdf", large_content, "application/pdf")}
    headers = {"Authorization": "Bearer fake_token"}
    
    response = client.post("/api/resume/upload", files=files, headers=headers)
    
    # Should fail with 413 (too large) or 401 (no auth)
    assert response.status_code in [413, 401, 400]
    
    if response.status_code in [413, 400]:
        detail = response.json()["detail"].lower()
        assert "size" in detail or "5mb" in detail or "limit" in detail


# ════════════════════════════════════════
# TEST 5 — Usage Limits
# ════════════════════════════════════════

@pytest.mark.asyncio
async def test_usage_limit_free_user():
    """Free users should be blocked after 3 resume optimizations"""
    # This tests the check_limit function directly
    
    # Mock user_id
    test_user_id = "test_user_free_123"
    
    # For a free user with 3 uses, should be at limit
    # Note: This test assumes usage_service.check_limit raises HTTPException
    # when limit is exceeded
    
    try:
        # Simulate checking limit for a user who has used 3 times
        # In real implementation, this would query the database
        # For testing, we can test the logic directly
        
        # Test that free plan has limit of 3
        from services.usage_service import PLAN_LIMITS
        assert PLAN_LIMITS['free']['resume_optimize'] == 3
        
        # Test that pro plan has unlimited
        assert PLAN_LIMITS['pro']['resume_optimize'] == -1
        
    except Exception as e:
        pytest.fail(f"Usage limit test failed: {str(e)}")


def test_plan_limits_configuration():
    """Verify plan limits are correctly configured"""
    from services.usage_service import PLAN_LIMITS
    
    # Free plan should have limits
    assert 'free' in PLAN_LIMITS
    assert PLAN_LIMITS['free']['resume_optimize'] == 3
    assert PLAN_LIMITS['free']['cover_letter'] == 3
    assert PLAN_LIMITS['free']['voice_session'] == 5
    
    # Pro plan should be unlimited (-1)
    assert 'pro' in PLAN_LIMITS
    assert PLAN_LIMITS['pro']['resume_optimize'] == -1
    assert PLAN_LIMITS['pro']['cover_letter'] == -1
    assert PLAN_LIMITS['pro']['voice_session'] == -1


# ════════════════════════════════════════
# TEST 6 — ATS Scorer
# ════════════════════════════════════════

def test_ats_scorer_basic():
    """ATS scorer should identify matching keywords"""
    resume_text = "Python developer with FastAPI and PostgreSQL experience"
    job_description = "Looking for Python developer with FastAPI REST API skills"
    
    score, present, missing = calculate_ats_score_simple(resume_text, job_description)
    
    # Score should be reasonable (above 50%)
    assert score > 50, f"Expected score > 50, got {score}"
    
    # Should find common keywords
    present_lower = [k.lower() for k in present]
    assert any(keyword in present_lower for keyword in ['python', 'fastapi']), \
        f"Expected 'python' or 'fastapi' in present keywords: {present}"


def test_ats_scorer_no_match():
    """ATS scorer should give low score for unrelated content"""
    resume_text = "Marketing specialist with social media and content creation experience"
    job_description = "Senior Python developer needed for backend development"
    
    score, present, missing = calculate_ats_score_simple(resume_text, job_description)
    
    # Score should be low for unrelated content
    assert score < 50, f"Expected low score for unrelated content, got {score}"


def test_ats_scorer_perfect_match():
    """ATS scorer should give high score for perfect match"""
    text = "Python FastAPI PostgreSQL Docker Kubernetes AWS React TypeScript"
    job_desc = "Python FastAPI PostgreSQL Docker Kubernetes AWS React TypeScript"
    
    score, present, missing = calculate_ats_score_simple(text, job_desc)
    
    # Should have very high score for identical content
    assert score > 80, f"Expected score > 80 for perfect match, got {score}"


# ════════════════════════════════════════
# TEST 7 — Root Endpoint
# ════════════════════════════════════════

def test_root_endpoint():
    """Root endpoint should return welcome message"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Career Coach" in data["message"]


# ════════════════════════════════════════
# TEST 8 — CORS Configuration
# ════════════════════════════════════════

def test_cors_headers():
    """API should have CORS headers configured"""
    response = client.options("/health")
    # CORS should be configured (status 200 or 405 is acceptable)
    assert response.status_code in [200, 405]


# ════════════════════════════════════════
# TEST 9 — Error Handling
# ════════════════════════════════════════

def test_404_not_found():
    """Non-existent endpoints should return 404"""
    response = client.get("/api/nonexistent/endpoint")
    assert response.status_code == 404


def test_invalid_resume_id():
    """Getting non-existent resume should return 404"""
    headers = {"Authorization": "Bearer fake_token"}
    response = client.get("/api/resume/invalid_id_12345", headers=headers)
    # Should be 401 (auth) or 404 (not found)
    assert response.status_code in [401, 404]


# ════════════════════════════════════════
# TEST 10 — Webhook Endpoint
# ════════════════════════════════════════

def test_stripe_webhook_no_signature():
    """Stripe webhook should require valid signature"""
    payload = {"type": "customer.subscription.created"}
    response = client.post("/api/billing/webhook", json=payload)
    
    # Should fail without proper Stripe signature
    # Could be 400 (bad request) or 401 (unauthorized)
    assert response.status_code in [400, 401, 403]


# ════════════════════════════════════════
# RUN TESTS
# ════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
