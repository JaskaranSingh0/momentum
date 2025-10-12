# 🔍 OAuth Working But Not Logged In - Debug Guide

## The Issue
OAuth redirect works, but user is not logged in after returning to the frontend.

## Common Causes & Solutions

### 1. CORS / Cookie Issue ⚠️ Most Common

**Problem:** Cookies not being sent/received between different domains.

**Check Server Environment Variables:**
```
CLIENT_URL=https://momentum-dl24.vercel.app
NODE_ENV=production
```

**Verify in Vercel:**
- Go to Server Project → Settings → Environment Variables
- Make sure `CLIENT_URL` matches your EXACT client URL
- Make sure `NODE_ENV=production`
- If you changed anything, **REDEPLOY**

---

### 2. MongoDB Session Store Not Connected

**Problem:** Sessions can't be saved because MongoDB isn't connected.

**Check:**
- Server environment has `MONGO_URI` with MongoDB Atlas connection string
- MongoDB Atlas Network Access allows `0.0.0.0/0`
- Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/momentum`

**Verify:**
- Check Vercel Server → Deployments → Latest → Runtime Logs
- Look for MongoDB connection errors

---

### 3. Session Cookie Not Being Set

**Check Browser DevTools:**

1. Open `https://momentum-dl24.vercel.app`
2. Press F12 → **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Look under **Cookies** → `https://momentum-dl24.vercel.app`
4. After OAuth, you should see a cookie named `connect.sid`

**If no cookie:**
- Check Network tab during OAuth callback
- Look for `Set-Cookie` header in the callback response
- If missing, server isn't setting the cookie properly

---

### 4. Client Not Sending Credentials

**Already configured correctly in your code:**
```javascript
credentials: 'include'
```

This should be working since it's in your `api.js` file.

---

## 🧪 Debug Steps

### Step 1: Check Server Logs

1. Go to Vercel Dashboard → Server Project
2. Deployments → Latest Deployment → **Runtime Logs**
3. Look for:
   - MongoDB connection errors
   - Session errors
   - OAuth callback errors

### Step 2: Test Auth Endpoint Directly

Open browser and visit:
```
https://momentum-phi-wheat.vercel.app/health
```

Should return: `{"ok":true}`

Then try:
```
https://momentum-phi-wheat.vercel.app/auth/me
```

Should return: `{"user":null}` or `401` if not logged in

### Step 3: Check Network Tab During OAuth

1. Open `https://momentum-dl24.vercel.app`
2. F12 → **Network** tab → Check "Preserve log"
3. Click "Sign in with Google"
4. Complete OAuth
5. Look for the redirect back from Google to your server
6. Check the response headers for `Set-Cookie`

**Example of what you should see:**
```
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; Secure; SameSite=None
```

### Step 4: Check CORS Headers

In Network tab, check the OPTIONS preflight request:
```
Access-Control-Allow-Origin: https://momentum-dl24.vercel.app
Access-Control-Allow-Credentials: true
```

---

## ✅ Quick Fix Checklist

- [ ] Server env var `CLIENT_URL=https://momentum-dl24.vercel.app` (exact match, no trailing slash)
- [ ] Server env var `NODE_ENV=production`
- [ ] Server env var `SESSION_SECRET` is set (not the default)
- [ ] Server env var `MONGO_URI` is MongoDB Atlas connection string
- [ ] MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- [ ] Server redeployed after any env var changes
- [ ] Client env var `VITE_SERVER_URL=https://momentum-phi-wheat.vercel.app`
- [ ] Client redeployed after env var changes
- [ ] Tested in Incognito/Private mode (no cached cookies)

---

## 🔧 Most Likely Fix

### Update Server Environment Variables:

1. Vercel → Server Project → Settings → Environment Variables
2. Make sure you have:
   ```
   CLIENT_URL=https://momentum-dl24.vercel.app
   NODE_ENV=production
   SESSION_SECRET=your-secret-here-not-dev-secret
   MONGO_URI=mongodb+srv://your-atlas-connection
   GOOGLE_CLIENT_ID=your-id
   GOOGLE_CLIENT_SECRET=your-secret
   GOOGLE_CALLBACK_URL=https://momentum-phi-wheat.vercel.app/auth/google/callback
   ```

3. **Redeploy Server** (Required!)

### Test Flow:

1. Clear browser cookies for `momentum-dl24.vercel.app`
2. Visit `https://momentum-dl24.vercel.app`
3. F12 → Network tab (Preserve log checked)
4. Click "Sign in with Google"
5. After redirect, check:
   - Network tab for `/auth/me` request
   - Application tab for `connect.sid` cookie
   - Console for any errors

---

## 🆘 Still Not Working?

Share the following:
1. Server Runtime Logs from Vercel
2. Network tab screenshot showing the OAuth callback
3. Console errors (if any)
4. Whether you see `connect.sid` cookie in Application tab

---

## 💡 Production vs Development

**Development (localhost):**
- `sameSite: 'lax'`
- `secure: false`
- Works on same domain

**Production (Vercel):**
- `sameSite: 'none'` (required for cross-site cookies)
- `secure: true` (required for sameSite=none)
- Works across different domains

Your code already handles this correctly! Just need to ensure `NODE_ENV=production` is set.
