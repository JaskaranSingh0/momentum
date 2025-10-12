# ⚡ IMMEDIATE FIX - OAuth Not Working

## The Problem
Your client is deployed at `https://momentum-dl24.vercel.app` but trying to use OAuth callback at `localhost:3001` ❌

## Immediate Solution (5 Steps)

### 🔍 First, Check If Server Is Deployed

Go to https://vercel.com/dashboard and check:
- Do you have TWO projects? (one for client, one for server)
- Or just ONE project?

---

## If You Have TWO Projects ✅

### Your server URL is likely one of these based on your screenshots:
- `https://momentum-dl24-jgmhg0x2ljaskaran-singhs-projects-b84f6949.vercel.app`
- `https://momentum-imtyff075-jaskaran-singhs-projects-b84f6949.vercel.app`

### Steps:

1. **Find your server URL** in Vercel dashboard (the one that's NOT `momentum-dl24`)

2. **Update Google Cloud Console** (https://console.cloud.google.com/):
   - APIs & Services → Credentials → Your OAuth Client
   - **Authorized redirect URIs**, add:
   ```
   https://momentum-phi-wheat.vercel.app/auth/google/callback
   ```
   - **Authorized JavaScript origins**, add:
   ```
   https://momentum-dl24.vercel.app
   ```
   - Save

3. **Update Server Env Vars** (Vercel → Server Project → Settings → Environment Variables):
   ```
   CLIENT_URL=https://momentum-dl24.vercel.app
   GOOGLE_CALLBACK_URL=https://your-server-url.vercel.app/auth/google/callback
   ```

4. **Update Client Env Vars** (Vercel → momentum-dl24 → Settings → Environment Variables):
   ```
   VITE_SERVER_URL=https://your-server-url.vercel.app
   ```

5. **Redeploy Both** (Deployments → Latest → ⋯ → Redeploy)

---

## If You Have ONLY ONE Project ❌

You only deployed the client! Need to deploy server:

### Quick Deploy Server:

1. **Via Vercel Dashboard**:
   - Go to https://vercel.com/new
   - Import your `momentum` repository again
   - **IMPORTANT Settings**:
     - Project name: `momentum-server`
     - **Root Directory**: `server` ⚠️ 
     - Framework: Other
   
   - **Add ALL these environment variables**:
     ```
     MONGO_URI=your-mongodb-connection-string
     SESSION_SECRET=random-secret-minimum-32-characters
     CLIENT_URL=https://momentum-dl24.vercel.app
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_CALLBACK_URL=https://will-update-after-deploy.vercel.app/auth/google/callback
     NODE_ENV=production
     ```
   
   - Click Deploy

2. **After Server Deploys**:
   - Copy the server URL (e.g., `https://momentum-server-xyz.vercel.app`)
   
3. **Update Google OAuth**:
   - Go to https://console.cloud.google.com/
   - APIs & Services → Credentials → OAuth Client
   - Add redirect URI:
     ```
     https://your-server-url.vercel.app/auth/google/callback
     ```
   - Add JavaScript origin:
     ```
     https://momentum-dl24.vercel.app
     ```

4. **Update Server Env Var**:
   - Vercel → Server Project → Settings → Environment Variables
   - Edit `GOOGLE_CALLBACK_URL` to your actual server URL
   - Redeploy

5. **Update Client Env Var**:
   - Vercel → momentum-dl24 → Settings → Environment Variables
   - Add:
     ```
     VITE_SERVER_URL=https://your-server-url.vercel.app
     ```
   - Redeploy

---

## Quick Test

After all updates:
1. Visit `https://momentum-dl24.vercel.app`
2. Click "Sign in with Google"
3. Should redirect properly now! ✅

---

## Still Getting Error?

**Check these:**
- [ ] Google Cloud Console redirect URI is EXACTLY: `https://server-url.vercel.app/auth/google/callback`
- [ ] No typos in URLs (common: extra `/`, missing `https://`)
- [ ] Both projects redeployed after env var changes
- [ ] Wait 1-2 minutes for Google changes to propagate
- [ ] Try in incognito/private browsing mode

---

## Get Help Fast

**Check Vercel Runtime Logs:**
- Vercel → Server Project → Deployments → Latest → Runtime Logs
- Look for errors related to OAuth or sessions

**Check Browser Console:**
- Press F12 on `https://momentum-dl24.vercel.app`
- Look for network errors or CORS issues

---

**TL;DR**: Deploy server to Vercel, update Google OAuth with the Vercel URLs, not localhost! 🚀
