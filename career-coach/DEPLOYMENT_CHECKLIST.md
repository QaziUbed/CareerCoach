# CAREER COACH - DEPLOYMENT CHECKLIST

Use this checklist to prepare your app for production deployment.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ BACKEND (career-coach-api/)

#### Environment Variables
- [ ] Update `.env` with real Supabase credentials
- [ ] Update `.env` with real Groq API key (already has one)
- [ ] Update `.env` with real Stripe keys
- [ ] Update `.env` with real HuggingFace token
- [ ] Set `ENVIRONMENT=production` in production `.env`

#### Security
- [ ] Enable RLS in Supabase for all 6 tables
- [ ] Update CORS to specific domains (not `["*"]`)
- [ ] Verify all endpoints have authentication
- [ ] Test Stripe webhook signature verification

#### Database
- [ ] Run SQL migration for `optimizations.optimized_pdf_url` column
- [ ] Create all required tables in Supabase
- [ ] Set up RLS policies for each table
- [ ] Test database connections

#### Testing
- [ ] Install test dependencies: `pip install pytest pytest-asyncio httpx`
- [ ] Run tests: `pytest tests/ -v`
- [ ] Verify all tests pass
- [ ] Test file upload with real PDF
- [ ] Test ATS scoring with real resume

---

### ✅ FRONTEND (CareerCoach/)

#### Environment Variables
- [ ] Update `EXPO_PUBLIC_SUPABASE_ANON_KEY` with real key
- [ ] Update `EXPO_PUBLIC_REVENUECAT_IOS_KEY` with real key
- [ ] Update `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` with real key
- [ ] Update `EXPO_PUBLIC_API_URL` for production

#### App Configuration
- [ ] Create app icon (1024x1024) - use `assets/icon-generator.html`
- [ ] Create splash screen (1284x2778)
- [ ] Create Android adaptive icons
- [ ] Update `app.json` with correct bundle identifiers
- [ ] Set up Expo project ID for push notifications

#### RevenueCat Setup
- [ ] Create RevenueCat account
- [ ] Set up iOS app in RevenueCat
- [ ] Set up Android app in RevenueCat
- [ ] Create products/subscriptions
- [ ] Configure entitlement: `pro_access`
- [ ] Test purchases on TestFlight/Google Play Internal Testing

#### Stripe Setup
- [ ] Create Stripe account
- [ ] Create subscription products
- [ ] Set up webhook endpoint
- [ ] Test webhook with Stripe CLI
- [ ] Configure customer portal

---

## 🧪 TESTING CHECKLIST

### Backend Tests
```bash
cd career-coach-api
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

Expected: 15+ tests passing

### Manual Testing
- [ ] Health check: `curl http://localhost:8000/health`
- [ ] Upload resume (with auth)
- [ ] Optimize resume
- [ ] Generate cover letter
- [ ] Practice interview
- [ ] Track job application
- [ ] Test usage limits
- [ ] Test paywall
- [ ] Test upgrade flow

### Frontend Tests
- [ ] Login/Signup flow
- [ ] Resume upload
- [ ] Resume optimization
- [ ] Interview practice
- [ ] Job tracking
- [ ] Settings screen
- [ ] Upgrade screen
- [ ] Push notifications
- [ ] Haptic feedback (physical device)

---

## 🚀 DEPLOYMENT STEPS

### 1. Backend Deployment (Heroku/Railway/Render)

#### Heroku:
```bash
cd career-coach-api
heroku create career-coach-api
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_SERVICE_KEY=your_key
# ... set all env vars
git push heroku main
```

#### Railway:
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

#### Render:
1. Create new Web Service
2. Connect GitHub repo
3. Add environment variables
4. Deploy

### 2. Frontend Deployment (Expo)

#### Build for iOS:
```bash
cd CareerCoach
eas build --platform ios
```

#### Build for Android:
```bash
eas build --platform android
```

#### Submit to App Store:
```bash
eas submit --platform ios
```

#### Submit to Google Play:
```bash
eas submit --platform android
```

---

## 🔒 SECURITY CHECKLIST

### Backend
- [x] All endpoints authenticated (except health & webhook)
- [x] All queries filtered by user_id
- [x] File upload validation (PDF only, 5MB max)
- [x] Temp file cleanup in finally blocks
- [x] Stripe webhook signature verification
- [ ] CORS restricted to specific domains (production)
- [ ] RLS enabled in Supabase
- [ ] Environment variables secured

### Frontend
- [x] API calls use auth headers
- [x] 401 responses trigger token refresh
- [x] Sensitive data not logged
- [x] Error boundary catches crashes
- [ ] Real API keys (not placeholders)
- [ ] Production API URL configured

---

## 📊 MONITORING SETUP

### Recommended Tools
- [ ] **Sentry** - Error tracking
- [ ] **LogRocket** - Session replay
- [ ] **Mixpanel/Amplitude** - Analytics
- [ ] **Stripe Dashboard** - Payment monitoring
- [ ] **Supabase Dashboard** - Database monitoring

### Metrics to Track
- [ ] API response times
- [ ] Error rates
- [ ] User signups
- [ ] Resume optimizations
- [ ] Subscription conversions
- [ ] Churn rate

---

## 📱 APP STORE REQUIREMENTS

### iOS App Store
- [ ] App icon (1024x1024)
- [ ] Screenshots (6.5" and 5.5" displays)
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support URL
- [ ] Age rating
- [ ] In-app purchase setup

### Google Play Store
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Content rating
- [ ] In-app purchase setup

---

## 🎯 POST-DEPLOYMENT CHECKLIST

### Immediate (Day 1)
- [ ] Verify health endpoint responds
- [ ] Test user signup
- [ ] Test resume upload
- [ ] Test optimization
- [ ] Test payment flow
- [ ] Monitor error logs
- [ ] Check database connections

### Week 1
- [ ] Monitor user feedback
- [ ] Track conversion rates
- [ ] Check error rates
- [ ] Verify push notifications
- [ ] Test on multiple devices
- [ ] Monitor API performance

### Month 1
- [ ] Analyze usage patterns
- [ ] Review subscription metrics
- [ ] Optimize slow endpoints
- [ ] Fix reported bugs
- [ ] Plan feature updates

---

## 🆘 TROUBLESHOOTING

### Common Issues

#### "401 Unauthorized"
- Check JWT token is valid
- Verify Supabase JWT secret
- Check token expiration

#### "File upload fails"
- Verify file is PDF
- Check file size < 5MB
- Verify temp directory permissions

#### "Stripe webhook fails"
- Verify webhook secret
- Check signature verification
- Test with Stripe CLI

#### "Push notifications not working"
- Verify Expo project ID
- Check device permissions
- Test on physical device (not simulator)

#### "RevenueCat purchase fails"
- Verify API keys
- Check product IDs match
- Test with sandbox account

---

## 📞 SUPPORT RESOURCES

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **Expo**: https://docs.expo.dev/
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **RevenueCat**: https://docs.revenuecat.com/

### Community
- **FastAPI Discord**: https://discord.gg/fastapi
- **Expo Discord**: https://chat.expo.dev/
- **Supabase Discord**: https://discord.supabase.com/

---

## ✅ FINAL CHECKLIST

Before going live:
- [ ] All tests passing
- [ ] All env vars configured
- [ ] RLS enabled
- [ ] CORS configured
- [ ] App icons created
- [ ] Stripe configured
- [ ] RevenueCat configured
- [ ] Push notifications tested
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 🎉 YOU'RE READY!

Once all items are checked, your Career Coach app is ready for production!

Good luck with your launch! 🚀

---

**Need help?** Refer to:
- `COMPLETE_AUDIT_REPORT.md` - Detailed audit findings
- `AUDIT_SUMMARY.md` - Quick summary
- `tests/test_routes.py` - Test examples
