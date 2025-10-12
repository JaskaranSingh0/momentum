# 🔧 Fix Google OAuth Error 400: redirect_uri_mismatch

## Current Issue
❌ Google OAuth is trying to redirect to `http://localhost:3001/auth/google/callback`  
✅ Your client is deployed at: `https://momentum-dl24.vercel.app`  
⚠️ Your server needs proper Vercel deployment URL

## Quick Fix Steps

### Step 1: Find Your Server Deployment URL

Based on your Vercel dashboard, you should have a server deployment. Look for:
- Project name like `momentum-server` or similar
- URL pattern: `https://momentum-[something].vercel.app`

**Check your Vercel projects:**
1. Go to https://vercel.com/dashboard
2. Look for your server/backend project
3. Copy the production URL

If you don't see a server project, you need to deploy it first (see Step 2).

### Step 2: Deploy Server (If Not Already Deployed)

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository (same one: `momentum`)
3. Configure:
   - **Project Name**: `momentum-server` (or `momentum-api`)
   - **Framework Preset**: Other
   - **Root Directory**: `server` ⚠️ IMPORTANT!
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

4. **Add Environment Variables** (CRITICAL):
   ```
   MONGO_URI=your-mongodb-atlas-connection-string
   SESSION_SECRET=your-random-secret-32-chars
   CLIENT_URL=https://momentum-dl24.vercel.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-server-url.vercel.app/auth/google/callback
   NODE_ENV=production
   ```
   
   ⚠️ **For now, put a placeholder for `GOOGLE_CALLBACK_URL`, we'll update it after getting the server URL**

5. Click **Deploy**

6. Once deployed, **copy the server URL** (e.g., `https://momentum-server-abc.vercel.app`)

#### Option B: Via Vercel CLI
```powershell
cd C:\under-construction\WORKING\momentum\server
vercel --prod
```

### Step 3: Update Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Update the following:

**Authorized JavaScript origins:**
```
https://momentum-dl24.vercel.app
```

**Authorized redirect URIs:**
```
https://YOUR-SERVER-URL.vercel.app/auth/google/callback
```

Replace `YOUR-SERVER-URL` with your actual Vercel server URL.

Example:
```
https://momentum-server-jgmhg0x2ljaskaran-singhs-projects-b84f6949.vercel.app/auth/google/callback
```

6. Click **Save**

### Step 4: Update Server Environment Variables

Now that you have the server URL:

1. Go to Vercel Dashboard → Your Server Project → **Settings** → **Environment Variables**
2. Update/Add these variables:

```
GOOGLE_CALLBACK_URL=https://your-actual-server-url.vercel.app/auth/google/callback
CLIENT_URL=https://momentum-dl24.vercel.app
```

3. **Redeploy** the server:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **⋯** (three dots)
   - Click **Redeploy**

### Step 5: Update Client Environment Variables

1. Go to Vercel Dashboard → **momentum-dl24** (client) → **Settings** → **Environment Variables**
2. Add/Update:

```
VITE_SERVER_URL=https://your-actual-server-url.vercel.app
```

3. **Redeploy** the client:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **⋯** (three dots)
   - Click **Redeploy**

### Step 6: Test!

1. Visit `https://momentum-dl24.vercel.app`
2. Click **Sign in with Google**
3. Should work now! ✅

---

## Common Issues & Solutions

### Issue 1: Still getting redirect_uri_mismatch
**Solution:**
- Double-check the URL in Google Cloud Console matches EXACTLY (including `https://` and `/auth/google/callback`)
- Wait 1-2 minutes for Google to propagate changes
- Clear browser cache or try incognito mode

### Issue 2: CORS Error after OAuth
**Solution:**
- Verify `CLIENT_URL` in server environment variables is correct
- Must be `https://momentum-dl24.vercel.app` (no trailing slash)
- Redeploy server after changing

### Issue 3: Server Environment Variables Not Working
**Solution:**
- Environment variable changes require **redeployment** to take effect
- After adding/changing any env var, you MUST redeploy

### Issue 4: Can't Find Server Deployment
**Solution:**
- You might need to deploy the server separately
- Follow Step 2 above to deploy server
- Make sure Root Directory is set to `server`

---

## Quick Reference: Your URLs

| Component | URL |
|-----------|-----|
| **Client (Frontend)** | `https://momentum-dl24.vercel.app` |
| **Server (Backend)** | `https://[YOUR-SERVER-PROJECT].vercel.app` |
| **OAuth Callback** | `https://[YOUR-SERVER-PROJECT].vercel.app/auth/google/callback` |

---

## Environment Variables Summary

### Server Environment Variables
```env
MONGO_URI=mongodb+srv://...
SESSION_SECRET=random-32-char-string
CLIENT_URL=https://momentum-dl24.vercel.app
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-server-url.vercel.app/auth/google/callback
NODE_ENV=production
```

### Client Environment Variables
```env
VITE_SERVER_URL=https://your-server-url.vercel.app
```

---

## Verification Checklist

- [ ] Server is deployed to Vercel
- [ ] Server environment variables are set correctly
- [ ] Client environment variable `VITE_SERVER_URL` points to server
- [ ] Google Cloud Console has correct redirect URI
- [ ] Google Cloud Console has correct JavaScript origin
- [ ] Both projects redeployed after env var changes
- [ ] Tested OAuth flow - it works!

---

## Need to Check Your Deployments?

**Vercel Dashboard**: https://vercel.com/dashboard

Look for two projects:
1. One for client (should be `momentum-dl24`)
2. One for server (should be `momentum-server` or similar)

If you only see one project, you need to deploy the server!

---

## Still Stuck?

1. Check Vercel **Runtime Logs** for both projects
2. Check browser console (F12) for errors
3. Verify all URLs use `https://` not `http://`
4. Make sure there are no typos in environment variables
5. Try clearing browser cache and cookies

**The key issue**: You're trying to use localhost server with a production client. Both need to be on Vercel!
