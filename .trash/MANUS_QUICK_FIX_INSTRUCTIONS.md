# 🚀 QUICK FIX: Add Environment Variables to Vercel (5 minutes)

Hi Manus,

The code is all there! The issue is that Vercel doesn't have the Supabase environment variables set. Here's the exact fix:

## 📝 Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on the **apex-backend** project
3. Go to **Settings** tab
4. Click on **Environment Variables** (left sidebar)

## 📝 Step 2: Add These Environment Variables

Click "Add Variable" and add each of these:

### Required Variables:

```
Name: SUPABASE_URL
Value: https://twigokrtbvigiqnaybfy.supabase.co
Environment: Production, Preview, Development
```

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24
Environment: Production, Preview, Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Get this from Supabase Dashboard - Settings → API → service_role key]
Environment: Production, Preview, Development
```

### To get the SERVICE_ROLE_KEY:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the "service_role" key (starts with eyJ...)

## 📝 Step 3: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment

## ✅ Step 4: Verify It Works

After deployment, test this URL:
```
https://apex-backend-vercel-alh0xjd6q-seans-projects-aabd20b2.vercel.app/api/health
```

Should show:
- No errors about Supabase
- Version info
- "VERCEL SERVER IS WORKING!"

## 🎯 What This Fixes

Once these environment variables are added:
1. ✅ Backend connects to Supabase database
2. ✅ Retrieves organization's VAPI API key (already stored in DB)
3. ✅ Initializes VAPI service with correct credentials
4. ✅ Campaigns can start making calls!

## ⏱️ Time: 5 minutes total

The code is perfect, it just needs these environment variables to connect to the database!

---

**That's it! Once these env vars are added and Vercel redeploys, the calling functionality should work immediately.**