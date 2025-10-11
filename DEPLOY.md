# Deploying Momentum to Render - Complete Guide

This comprehensive guide walks you through deploying your full-stack Momentum application (React client + Node.js server) to Render with detailed screenshots and explanations.

## 📋 Prerequisites Checklist

- [ ] GitHub account with this repository pushed
- [ ] Render account (create free at https://render.com)
- [ ] MongoDB Atlas account (free tier)
- [ ] Google OAuth credentials from Google Cloud Console
- [ ] ~15-20 minutes of your time

---

## 🗄️ PART 1: Set Up MongoDB Atlas (5-7 minutes)

### Step 1.1: Create MongoDB Atlas Account
1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** or **"Sign Up"**
3. Create account (use Google/GitHub for faster signup)
4. Choose **"Free Shared"** tier (M0)

### Step 1.2: Create a Cluster
1. After login, click **"Build a Database"**
2. Select **"M0 FREE"** tier
3. Choose a **Cloud Provider & Region** (AWS, us-east-1 is recommended)
4. Cluster Name: Keep default or name it `momentum-cluster`
5. Click **"Create"**
6. Wait 1-3 minutes for cluster creation

### Step 1.3: Create Database User
1. You'll see a security quickstart - **"Create a database user"**
2. **Username**: `momentum-admin` (or your choice)
3. **Password**: Click **"Autogenerate Secure Password"** and **SAVE IT** somewhere safe
4. Click **"Create User"**

### Step 1.4: Set Up Network Access
1. Under **"Where would you like to connect from?"**
2. Click **"Add My Current IP Address"** (for testing)
3. **IMPORTANT**: Also click **"Add IP Address"**
   - IP Address: `0.0.0.0/0`
   - Description: `Allow access from anywhere (Render)`
   - Click **"Add Entry"**
4. Click **"Finish and Close"**

### Step 1.5: Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string - looks like:
   ```
   mongodb+srv://momentum-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **IMPORTANT**: Replace `<password>` with the password you saved earlier
7. Add database name after `.net/`: 
   ```
   mongodb+srv://momentum-admin:yourpassword@cluster0.xxxxx.mongodb.net/momentum?retryWrites=true&w=majority
   ```
8. **SAVE THIS COMPLETE STRING** - you'll need it for Render

---

## 🔐 PART 2: Configure Google OAuth (3-5 minutes)

### Step 2.1: Open Google Cloud Console
1. Go to **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Select your existing project (or create new one)

### Step 2.2: Find Your OAuth Client
1. In left sidebar: **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (you should have one already)
3. Click the ✏️ **edit icon** to modify it

### Step 2.3: Add Production URLs
In **Authorized JavaScript origins**, add:
```
https://momentum-server.onrender.com
https://momentum-client.onrender.com
```

In **Authorized redirect URIs**, add:
```
https://momentum-server.onrender.com/auth/google/callback
```

**IMPORTANT NOTES:**
- Replace `momentum-server` and `momentum-client` with your actual service names if you change them in render.yaml
- Keep your existing `localhost` URLs for local development
- Click **"Save"** at the bottom

### Step 2.4: Note Your Credentials
You'll need these for Render (from the same credentials page):
- **Client ID**: Starts with numbers, ends with `.apps.googleusercontent.com`
- **Client Secret**: A long alphanumeric string

---

## 🚀 PART 3: Deploy to Render (10-15 minutes)

### Step 3.1: Create Render Account
1. Go to **https://render.com/**
2. Click **"Get Started"** or **"Sign Up"**
3. **Recommended**: Sign up with GitHub (easier repo connection)
4. Authorize Render to access your GitHub

### Step 3.2: Connect Your Repository
1. In Render Dashboard, click **"New +"** (top right)
2. Select **"Blueprint"**
3. Click **"Connect GitHub"** (if not already connected)
4. In the repository list, find **"momentum"**
5. Click **"Connect"** next to it

### Step 3.3: Review Blueprint
Render will read your `render.yaml` file and show:
- **2 services detected:**
  - `momentum-server` (Web Service)
  - `momentum-client` (Static Site)
- Click **"Apply"** - but WAIT! We need to set environment variables first

### Step 3.4: Configure Server Environment Variables

**BEFORE clicking Apply**, scroll down to **momentum-server** section:

Click **"Advanced"** or find environment variables section, then add:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGO_URI` | `mongodb+srv://momentum-admin:yourpassword@...` | Your full MongoDB connection string from Part 1 |
| `SESSION_SECRET` | Auto-generated | Render will generate this automatically |
| `GOOGLE_CLIENT_ID` | `254792691509-xxxxx.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://momentum-server.onrender.com/auth/google/callback` | Auto-configured in render.yaml |
| `CLIENT_URL` | `https://momentum-client.onrender.com` | Auto-configured in render.yaml |
| `PORT` | `10000` | Auto-configured in render.yaml |
| `NODE_ENV` | `production` | Auto-configured in render.yaml |

**Variables marked "Auto-configured" are already in render.yaml**, you only need to manually add:
- ✅ `MONGO_URI`
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`

### Step 3.5: Configure Client Environment Variables

For **momentum-client** service, the environment variable is already set in render.yaml:
- `VITE_SERVER_URL` → `https://momentum-server.onrender.com`

**No action needed** unless you changed service names.

### Step 3.6: Deploy!
1. Double-check all environment variables
2. Click **"Apply"** button
3. Render will now:
   - Create both services
   - Install dependencies
   - Build your applications
   - Deploy them

### Step 3.7: Monitor Build Progress

**Server Build (momentum-server):**
1. Click on **"momentum-server"** service
2. Go to **"Logs"** tab
3. You'll see:
   ```
   Installing dependencies...
   npm install
   Starting server...
   Server listening on http://localhost:10000
   ```
4. Build time: ~2-3 minutes
5. Status should show **"Live"** with a green dot

**Client Build (momentum-client):**
1. Click on **"momentum-client"** service
2. Go to **"Logs"** tab
3. You'll see:
   ```
   Installing dependencies...
   npm install
   Running build command...
   vite build
   ✓ built in 45s
   ```
4. Build time: ~3-5 minutes
5. Status should show **"Live"** with a green dot

### Step 3.8: Get Your URLs
Once deployed, find your URLs in the Render dashboard:

**Server URL:**
- Top of momentum-server page: `https://momentum-server.onrender.com`
- Or on free tier: `https://momentum-server-xxxx.onrender.com`

**Client URL:**
- Top of momentum-client page: `https://momentum-client.onrender.com`
- Or on free tier: `https://momentum-client-xxxx.onrender.com`

**SAVE THESE URLS** - you may need to update OAuth settings if they differ from expected names.

---

## ✅ PART 4: Verify Deployment (2-3 minutes)

### Step 4.1: Test Server Health
1. Open browser
2. Navigate to: `https://your-server-url.onrender.com/health`
3. Should see: `{"ok":true}`
4. ✅ Server is working!

### Step 4.2: Test Client
1. Navigate to: `https://your-client-url.onrender.com`
2. Should see the Momentum landing/login page
3. ✅ Client is working!

### Step 4.3: Test Google OAuth
1. Click **"Log in with Google"** button
2. Should redirect to Google login
3. Choose your Google account
4. Should redirect back to your app
5. Should see your dashboard/main app
6. ✅ OAuth is working!

### Step 4.4: Test Functionality
1. Try creating a task
2. Try adding a diary entry
3. Check if data persists after refresh
4. ✅ MongoDB is working!

---

## 🔧 PART 5: Troubleshooting Common Issues

### Issue 1: "Service Unavailable" or 503 Error
**Cause:** Free tier services spin down after 15 minutes of inactivity

**Solution:**
- Wait 30-60 seconds for service to wake up
- Refresh the page
- First request after wake-up is always slow

### Issue 2: "OAuth Error" or "Redirect URI Mismatch"
**Cause:** Google OAuth redirect URIs don't match

**Fix:**
1. Check your actual Render URLs
2. Go to Google Cloud Console → Credentials
3. Make sure redirect URI **exactly matches**: `https://your-actual-server-url.onrender.com/auth/google/callback`
4. No trailing slash, must be HTTPS
5. Save and wait 2-3 minutes for Google to update

### Issue 3: "Internal Server Error" or 500 Error
**Cause:** Usually MongoDB connection issue

**Fix:**
1. Go to Render Dashboard → momentum-server → Environment
2. Check `MONGO_URI` is correct:
   - Has username and password
   - Has database name (`/momentum`)
   - No `<password>` placeholder
3. Go to MongoDB Atlas → Network Access
4. Verify `0.0.0.0/0` is in allowed IPs
5. Restart server in Render: **Manual Deploy → Clear build cache & deploy**

### Issue 4: Client Can't Connect to Server (CORS Error)
**Cause:** Environment variables mismatch

**Fix:**
1. Check momentum-server environment: `CLIENT_URL` = actual client URL
2. Check momentum-client environment: `VITE_SERVER_URL` = actual server URL
3. Update and redeploy if needed

### Issue 5: Build Fails
**Server build fails:**
```bash
# Check Render logs for the specific error
# Common fixes:
```
1. Verify `package.json` exists in `server/` folder
2. Check Node version compatibility (Render uses Node 20 by default)
3. Clear build cache: Settings → Manual Deploy → Clear build cache

**Client build fails:**
```bash
# Check for Vite build errors in logs
```
1. Verify `package.json` exists in `client/` folder
2. Check all imports are correct (case-sensitive on Linux)
3. Verify `vite.config.js` is properly configured

### Issue 6: Session/Login Not Persisting
**Cause:** Cookie settings or session store issue

**Fix:**
1. Verify `SESSION_SECRET` is set in environment
2. Check MongoDB connection (sessions are stored there)
3. In browser DevTools → Application → Cookies:
   - Should see `connect.sid` cookie
   - Domain should match your server URL
   - Secure flag should be checked (HTTPS)

---

## 📊 PART 6: Monitoring & Maintenance

### View Logs
1. Go to Render Dashboard
2. Click on service name
3. Click **"Logs"** tab
4. See real-time logs
5. Filter by time or search for errors

### Check Metrics
1. Click **"Metrics"** tab on service page
2. See:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Set Up Alerts (Optional)
1. Service page → **Settings**
2. **"Notifications"** section
3. Add email for:
   - Deploy failures
   - Service crashes
   - Health check failures

### Update Your App
When you make code changes:

```powershell
# After making changes to your code
git add .
git commit -m "Your update message"
git push origin main
```

Render will **automatically detect the push** and redeploy:
1. You'll see build start in Render dashboard
2. New version deploys automatically
3. No downtime on free tier (brief pause during deploy)

### Manual Deploy
If auto-deploy doesn't work:
1. Go to service page
2. Click **"Manual Deploy"**
3. Select **"Deploy latest commit"**
4. Or **"Clear build cache & deploy"** if having issues

---

## 🌐 PART 7: Custom Domain (Optional)

### Add Custom Domain to Server
1. Buy domain from provider (Namecheap, Google Domains, etc.)
2. In Render: momentum-server → **Settings** → **Custom Domain**
3. Click **"Add Custom Domain"**
4. Enter: `api.yourdomain.com`
5. Render shows DNS records to add:
   ```
   Type: CNAME
   Name: api
   Value: momentum-server.onrender.com
   ```
6. Add these records in your domain provider's DNS settings
7. Wait for DNS propagation (5 minutes - 48 hours, usually ~1 hour)

### Add Custom Domain to Client
1. In Render: momentum-client → **Settings** → **Custom Domain**
2. Enter: `yourdomain.com` or `www.yourdomain.com`
3. Add DNS records as shown
4. Wait for verification

### Update Environment Variables
After adding custom domains:
1. Update `CLIENT_URL` in server → your custom client domain
2. Update `VITE_SERVER_URL` in client → your custom server domain
3. Update `GOOGLE_CALLBACK_URL` in server → new callback URL
4. **Update Google OAuth redirect URIs** with new domains
5. Redeploy both services

---

## 💰 Cost & Free Tier Limits

### Render Free Tier Includes:
- ✅ 750 hours/month (shared across all services)
- ✅ 512 MB RAM per service
- ✅ Automatic HTTPS/SSL
- ✅ Git-based auto-deploys
- ❌ No custom domain on free static sites
- ❌ Services spin down after 15 min inactivity

### MongoDB Atlas Free Tier:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Good for ~1000 users or development

### Upgrading (Optional):
**Render Pro ($7/month per service):**
- Always-on (no spin down)
- More RAM and CPU
- Custom domains on static sites

**MongoDB Atlas Paid ($9/month+):**
- More storage
- Better performance
- Automated backups

---

## 📞 Support Resources

### Official Documentation
- 📘 Render Docs: https://render.com/docs
- 📘 MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- 📘 Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2

### Common Commands

**View Render Service Info:**
```bash
# Render CLI (optional)
npm install -g @render/cli
render login
render services list
render logs <service-name>
```

**Check MongoDB Connection Locally:**
```bash
# In server directory
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGO_URI').then(() => console.log('Connected!')).catch(err => console.error(err));"
```

**Test API Endpoints:**
```bash
# Health check
curl https://your-server-url.onrender.com/health

# Auth check (should return 401 if not logged in)
curl https://your-server-url.onrender.com/auth/me
```

---

## ✨ Success Checklist

Before considering deployment complete, verify:

- [ ] ✅ Server shows "Live" status in Render
- [ ] ✅ Client shows "Live" status in Render  
- [ ] ✅ `/health` endpoint returns `{"ok":true}`
- [ ] ✅ Client page loads without errors
- [ ] ✅ Google OAuth login works
- [ ] ✅ Can create and view tasks
- [ ] ✅ Can create and view diary entries
- [ ] ✅ Data persists after page refresh
- [ ] ✅ MongoDB Atlas shows connections
- [ ] ✅ All environment variables are set correctly
- [ ] ✅ Google OAuth redirect URIs are updated
- [ ] ✅ No console errors in browser DevTools

---

## 🎉 Congratulations!

Your Momentum app is now live on Render! 

**Your Live URLs:**
- 🌐 **Client**: https://momentum-client.onrender.com
- 🔧 **Server**: https://momentum-server.onrender.com

**Next Steps:**
1. Share your app with friends and testers
2. Monitor logs for any issues
3. Keep developing new features
4. Consider upgrading to paid tier for better performance

---

## 📝 Quick Reference

### Environment Variables Summary

**Server (momentum-server):**
```bash
PORT=10000
NODE_ENV=production
CLIENT_URL=https://momentum-client.onrender.com
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/momentum
SESSION_SECRET=<auto-generated>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://momentum-server.onrender.com/auth/google/callback
```

**Client (momentum-client):**
```bash
VITE_SERVER_URL=https://momentum-server.onrender.com
```

### Service Configuration

**Folder Structure:**
```
momentum/
├── client/              # React app
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/              # Node.js API
│   ├── src/
│   └── package.json
└── render.yaml          # Deployment config
```

**Build Commands:**
- Server: `npm install` → `npm start`
- Client: `npm install && npm run build` → serves `dist/`

---

*Last updated: October 11, 2025*
*For issues or questions, check Render logs or MongoDB Atlas metrics first.*

### 1. Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get your connection string (looks like `mongodb+srv://username:password@cluster.mongodb.net/momentum`)

**Option B: Render PostgreSQL + Mongoose**
- You could use Render's managed database, but you'll need to use PostgreSQL with an adapter

### 2. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://momentum-server.onrender.com/auth/google/callback`
   - (Replace `momentum-server` with your chosen service name)
4. Add authorized JavaScript origins:
   - `https://momentum-server.onrender.com`
   - `https://momentum-client.onrender.com`

### 3. Deploy to Render

1. **Push your code to GitHub:**
   ```powershell
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create New Project in Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file

3. **Configure Environment Variables:**
   
   **For `momentum-server` service:**
   - `MONGO_URI`: Your MongoDB connection string
   - `SESSION_SECRET`: Auto-generated by Render (or create a random string)
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GOOGLE_CALLBACK_URL`: `https://YOUR-SERVER-NAME.onrender.com/auth/google/callback`
   - `CLIENT_URL`: `https://YOUR-CLIENT-NAME.onrender.com`
   
   **For `momentum-client` service:**
   - `VITE_SERVER_URL`: `https://YOUR-SERVER-NAME.onrender.com`

4. **Update render.yaml (if needed):**
   - Edit service names if you want different URLs
   - Update the `CLIENT_URL` and `GOOGLE_CALLBACK_URL` values to match your chosen server name
   - Update `VITE_SERVER_URL` to match your chosen server name

5. **Deploy:**
   - Click "Apply" to deploy both services
   - Render will build and deploy both the client and server
   - Server build: ~2-3 minutes
   - Client build: ~2-5 minutes

### 4. Verify Deployment

1. **Check Server Health:**
   - Visit `https://YOUR-SERVER-NAME.onrender.com/health`
   - Should return `{"ok": true}`

2. **Check Client:**
   - Visit `https://YOUR-CLIENT-NAME.onrender.com`
   - Should load the Momentum app

3. **Test Google Login:**
   - Click "Log in with Google"
   - Should redirect to Google, then back to your app

## Important Notes

### Free Tier Limitations
- Server will spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (shared across services)

### Working Directory Structure
The `render.yaml` is configured to work with your current structure:
```
momentum/
├── client/          # React app (static site on Render)
├── server/          # Node.js API (web service on Render)
└── render.yaml      # Render configuration
```

### Build Commands
- **Server:** `npm install` → `npm start`
- **Client:** `npm install && npm run build` → serves `dist/` folder

### Environment Variables Security
- Never commit `.env` files to Git
- All secrets are set via Render dashboard
- The `render.yaml` uses `sync: false` for sensitive values

## Troubleshooting

### Build Fails
- Check Render logs for errors
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `dependencies` (not just `devDependencies`)

### OAuth Errors
- Verify redirect URIs in Google Cloud Console
- Check `GOOGLE_CALLBACK_URL` matches exactly
- Ensure `CLIENT_URL` is set correctly

### CORS Errors
- Verify `CLIENT_URL` in server matches your client's actual URL
- Check that credentials are included in API calls (already configured)

### Database Connection Issues
- Verify MongoDB connection string is correct
- Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
- Test connection string locally first

### Session Issues
- Ensure `secure: true` for production (already configured)
- Verify `SESSION_SECRET` is set
- Check that cookies are being sent with credentials

## Updating Your App

After making changes:
```powershell
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically redeploy when it detects changes to the `main` branch.

## Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domain"
3. Follow instructions to add your domain
4. Update Google OAuth redirect URIs accordingly

## Monitoring

- View logs in Render dashboard
- Set up alerts for failed deployments
- Monitor free tier usage to avoid overages

## Support

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- Check server logs at: `https://dashboard.render.com/`
