# Stripe Billing - Quick Reference

## ✅ What's Implemented

### File: `routers/billing.py`

**Endpoints:**
1. `POST /api/billing/webhook` - Handle Stripe webhooks (no auth)
2. `POST /api/billing/create-portal-session` - Create customer portal (requires auth)

**Webhook Events:**
- ✅ `customer.subscription.created` → Updates user plan
- ✅ `customer.subscription.updated` → Updates user plan
- ✅ `customer.subscription.deleted` → Sets plan to free

**Security:**
- ✅ Webhook signature verification
- ✅ Uses `stripe.Webhook.construct_event()`
- ✅ Returns 400 on invalid signature

---

## 🚀 Quick Start

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Login
stripe login
```

### 2. Start Webhook Listener
```bash
stripe listen --forward-to localhost:8000/api/billing/webhook
```

Copy the webhook secret (starts with `whsec_`)

### 3. Update .env
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
APP_URL=http://localhost:8000
```

### 4. Start Server
```bash
cd career-coach-api
uvicorn main:app --reload
```

### 5. Test Webhooks
```bash
# Terminal 3
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## 🎯 Price ID Mapping

**IMPORTANT:** Create these exact Price IDs in Stripe Dashboard:

```python
PRICE_TO_PLAN = {
    'price_jobseeker_monthly': 'job_seeker',   # $14.99/month
    'price_pro_monthly': 'pro',                 # $24.99/month
    'price_careerplus_monthly': 'career_plus',  # $39.99/month
}
```

---

## 📊 Database Setup

Run this SQL in Supabase:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
ON user_profiles(stripe_customer_id);
```

---

## 🔗 Frontend Integration

### Open Customer Portal

```typescript
import { post } from '../../services/api';
import { Linking } from 'react-native';

const handleManageSubscription = async () => {
  const response = await post('/api/billing/create-portal-session', {});
  await Linking.openURL(response.url);
};
```

### Add to SettingsScreen

```typescript
<TouchableOpacity onPress={handleManageSubscription}>
  <Text>Manage Subscription</Text>
</TouchableOpacity>
```

---

## 🧪 Testing

### Run Test Script
```bash
cd career-coach-api
python test_stripe_webhook.py
```

### Manual Testing
```bash
# Test subscription created
curl -X POST http://localhost:8000/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=123,v1=abc" \
  -d '{"type":"customer.subscription.created","data":{"object":{}}}'
```

---

## 🔐 Production Setup

### 1. Create Products in Stripe
- Go to https://dashboard.stripe.com/products
- Create 3 products with exact Price IDs above

### 2. Configure Webhook
- Go to https://dashboard.stripe.com/webhooks
- Add endpoint: `https://yourdomain.com/api/billing/webhook`
- Select events: subscription.created, updated, deleted
- Copy signing secret

### 3. Update Production .env
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx (from dashboard)
APP_URL=https://yourdomain.com
```

---

## 📝 Checklist

- [ ] Stripe CLI installed
- [ ] Webhook listener running
- [ ] `.env` updated with secrets
- [ ] Products created in Stripe Dashboard
- [ ] Price IDs match exactly
- [ ] Database column added
- [ ] Server running
- [ ] Webhooks tested
- [ ] Portal session tested
- [ ] Frontend integration added

---

## 🐛 Common Issues

**Signature verification fails:**
- Use secret from `stripe listen` for local testing
- Use secret from Stripe Dashboard for production

**Plan not updating:**
- Check Price IDs match exactly
- Uncomment database code in `billing.py`
- Verify `stripe_customer_id` exists

**Portal fails:**
- Check `STRIPE_SECRET_KEY` is set
- Verify authentication is working
- Ensure `APP_URL` is correct

---

## 📚 Files

- `routers/billing.py` - Main implementation
- `STRIPE_BILLING_GUIDE.md` - Full documentation
- `test_stripe_webhook.py` - Test script
- `.env` - Configuration

---

## 🎉 You're Done!

Your Stripe billing is ready! Just:
1. Configure products in Stripe
2. Set up webhooks
3. Test locally
4. Deploy to production

Check `STRIPE_BILLING_GUIDE.md` for detailed instructions!
