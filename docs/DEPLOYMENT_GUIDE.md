# Trinity Labs AI Deployment Guide

## 🚀 Deployment Architecture

- **Frontend**: Netlify (React/Vite)
- **Backend**: Railway (Node.js/Express)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Voice AI**: Trinity Voice Engine

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Netlify (Frontend)
1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add the following variables from `.env.netlify.example`:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (set to your Railway backend URL)
   - `VITE_STRIPE_PUBLISHABLE_KEY`

#### Railway (Backend)
1. Go to Railway Dashboard > Your Project > Variables
2. Add all variables from `.env.railway.example`
3. Ensure `PORT` is set (Railway provides this automatically)

### 2. Database Setup (Supabase)

```sql
-- Run these SQL commands in Supabase SQL Editor
-- The phone_numbers table should already exist
-- Verify with:
SELECT * FROM phone_numbers LIMIT 5;
```

### 3. Build Commands

#### Frontend (Netlify)
```bash
npm install && npm run build
```

#### Backend (Railway)
```bash
npm install && npm run build
```

## 🔧 Deployment Steps

### Deploy Frontend to Netlify

#### Option 1: Via Git (Recommended)
1. Push code to GitHub
2. Connect GitHub repo to Netlify
3. Set build command: `npm install && npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy

#### Option 2: Manual Deploy
```bash
# Build locally
npm install
npm run build

# Deploy using Netlify CLI
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```

### Deploy Backend to Railway

#### Option 1: Via GitHub (Recommended)
1. Create new project in Railway
2. Connect GitHub repo
3. Select the `/apps/backend` directory as root
4. Railway will auto-detect Node.js
5. Add environment variables
6. Deploy

#### Option 2: Via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project in apps/backend
cd apps/backend
railway init

# Link to existing project or create new
railway link

# Deploy
railway up
```

## 🔍 Post-Deployment Verification

### 1. Frontend Health Check
- Visit: `https://your-site.netlify.app`
- Check console for errors
- Test login functionality
- Verify API calls reach backend

### 2. Backend Health Check
- Visit: `https://your-app.railway.app/health`
- Check logs in Railway dashboard
- Test API endpoints:
  ```bash
  curl https://your-app.railway.app/api/health
  ```

### 3. Database Connection
- Verify Supabase connection from backend
- Check if leads can be created
- Test phone_numbers table access

### 4. Integration Tests
- [ ] User registration/login (Clerk)
- [ ] Lead import functionality
- [ ] Campaign creation
- [ ] API key generation
- [ ] Webhook reception

## 🐛 Troubleshooting

### Common Netlify Issues
1. **Build fails**: Check Node version (should be 18+)
2. **404 on routes**: Ensure `_redirects` file exists
3. **API calls fail**: Verify `netlify.toml` redirects

### Common Railway Issues
1. **App crashes**: Check logs for missing env vars
2. **Port issues**: Ensure using `process.env.PORT`
3. **Memory issues**: May need to upgrade plan

### CORS Issues
Ensure backend has proper CORS configuration:
```javascript
app.use(cors({
  origin: ['https://your-site.netlify.app', 'http://localhost:5522'],
  credentials: true
}));
```

## 📊 Monitoring

### Netlify
- Analytics: Netlify Dashboard > Analytics
- Build logs: Netlify Dashboard > Deploys
- Function logs: Netlify Dashboard > Functions

### Railway
- Logs: Railway Dashboard > Deployments > View Logs
- Metrics: Railway Dashboard > Metrics
- Health: Set up health endpoint monitoring

## 🔄 Continuous Deployment

### Auto-deploy on push
1. **Netlify**: Automatically deploys on push to main branch
2. **Railway**: Automatically deploys on push to main branch

### Deployment Webhooks
```bash
# Trigger Netlify rebuild
curl -X POST https://api.netlify.com/build_hooks/YOUR_BUILD_HOOK_ID

# Railway will auto-deploy on git push
```

## 📝 Environment-Specific Notes

### Development
```bash
# Frontend
npm run dev

# Backend
cd apps/backend
npm run dev
```

### Staging (Optional)
- Create separate Netlify site for staging
- Create separate Railway environment
- Use different environment variables

### Production
- Enable Netlify Analytics
- Set up error tracking (Sentry)
- Configure rate limiting
- Enable Railway autoscaling

## 🔐 Security Checklist

- [ ] All API keys are in environment variables
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection headers set
- [ ] Authentication required for sensitive endpoints
- [ ] Webhook secrets configured

## 📞 Support Contacts

- **Netlify Support**: https://www.netlify.com/support/
- **Railway Support**: https://railway.app/help
- **Supabase Support**: https://supabase.com/support

## 🚨 Emergency Rollback

### Netlify
1. Go to Deploys tab
2. Find last working deploy
3. Click "Publish deploy"

### Railway
1. Go to Deployments
2. Find last working deployment
3. Click "Rollback"

---

## Quick Deploy Commands

```bash
# Full deployment from project root
./scripts/deploy-all.sh

# Frontend only
./scripts/deploy-frontend.sh

# Backend only
cd apps/backend && railway up
```