# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a new cluster (free tier is fine)
- [ ] Create a database user with password
- [ ] Whitelist IP addresses (use 0.0.0.0/0 for Vercel or add specific IPs)
- [ ] Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/momentum`)

### 2. Google OAuth Setup
- [ ] Go to https://console.cloud.google.com/
- [ ] Create a new project (or use existing)
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials (OAuth client ID)
- [ ] Note down your Client ID and Client Secret
- [ ] You'll add redirect URIs after deployment

### 3. Local Testing (Optional but Recommended)
- [ ] Test the app works locally with production-like env variables
- [ ] Verify MongoDB Atlas connection works
- [ ] Verify Google OAuth works

## Deployment Steps

### Step 1: Deploy Server (Backend)

#### Using Vercel Dashboard (Recommended for beginners):
1. [ ] Go to https://vercel.com/new
2. [ ] Import your Git repository (push to GitHub first if not already)
3. [ ] Configure project:
   - [ ] Name: `momentum-server`
   - [ ] Framework Preset: `Other`
   - [ ] Root Directory: `server`
   - [ ] Build Command: (leave empty)
   - [ ] Output Directory: (leave empty)
4. [ ] Add Environment Variables:
   ```
   MONGO_URI=mongodb+srv://...
   SESSION_SECRET=<generate-random-32-char-string>
   CLIENT_URL=https://your-client-will-go-here.vercel.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-server-url.vercel.app/auth/google/callback
   NODE_ENV=production
   ```
5. [ ] Click "Deploy"
6. [ ] **Note your server URL** (e.g., `https://momentum-server-xyz.vercel.app`)

#### Using Vercel CLI:
```bash
cd server
vercel
# Follow prompts
# After deployment, add environment variables via dashboard
vercel --prod
```

### Step 2: Deploy Client (Frontend)

#### Using Vercel Dashboard:
1. [ ] Go to https://vercel.com/new
2. [ ] Import your Git repository (same repo, different project)
3. [ ] Configure project:
   - [ ] Name: `momentum-client`
   - [ ] Framework Preset: `Vite`
   - [ ] Root Directory: `client`
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
4. [ ] Add Environment Variables:
   ```
   VITE_SERVER_URL=https://your-actual-server-url.vercel.app
   ```
5. [ ] Click "Deploy"
6. [ ] **Note your client URL** (e.g., `https://momentum-client-xyz.vercel.app`)

#### Using Vercel CLI:
```bash
cd ../client
vercel
# Follow prompts
# After deployment, add environment variables via dashboard
vercel --prod
```

### Step 3: Update Environment Variables

Now that both are deployed:

#### Update Server Environment Variables:
1. [ ] Go to Vercel Dashboard > momentum-server project
2. [ ] Settings > Environment Variables
3. [ ] Update `CLIENT_URL` with your actual client URL
4. [ ] Redeploy: Deployments > (latest) > ⋯ > Redeploy

#### Update Client Environment Variables:
1. [ ] Go to Vercel Dashboard > momentum-client project
2. [ ] Settings > Environment Variables
3. [ ] Verify `VITE_SERVER_URL` is correct
4. [ ] If you changed it, redeploy

### Step 4: Update Google OAuth Settings

1. [ ] Go to https://console.cloud.google.com/
2. [ ] Select your project
3. [ ] APIs & Services > Credentials
4. [ ] Click on your OAuth 2.0 Client ID
5. [ ] Under "Authorized JavaScript origins", add:
   ```
   https://your-client-url.vercel.app
   ```
6. [ ] Under "Authorized redirect URIs", add:
   ```
   https://your-server-url.vercel.app/auth/google/callback
   ```
7. [ ] Click "Save"

## Testing

### Test the Deployed Application:
1. [ ] Visit your client URL
2. [ ] Click "Sign in with Google"
3. [ ] Complete OAuth flow
4. [ ] Test creating a task
5. [ ] Test creating a diary entry
6. [ ] Test viewing stats
7. [ ] Test theme switching
8. [ ] Test logout

### Check for Issues:
- [ ] Open browser DevTools (F12)
- [ ] Check Console for errors
- [ ] Check Network tab for failed requests
- [ ] Check Vercel logs for backend errors

## Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Problem: "Access to fetch blocked by CORS policy"
- Solution: Verify `CLIENT_URL` in server env variables matches your actual client domain
- Check: Server logs in Vercel dashboard

#### 2. OAuth Not Working
- Problem: "OAuth redirect error" or "invalid redirect_uri"
- Solution: Double-check Google Cloud Console redirect URIs
- Ensure: HTTPS is used in production URLs

#### 3. Database Connection Failed
- Problem: "MongoNetworkError" or connection timeout
- Solution: 
  - Check MongoDB Atlas network access (whitelist 0.0.0.0/0)
  - Verify connection string is correct
  - Ensure database user has correct permissions

#### 4. Session Issues
- Problem: "Not authenticated" or session not persisting
- Solution:
  - Verify `SESSION_SECRET` is set
  - Check cookie settings (secure, sameSite)
  - Ensure MongoDB connection is working (sessions stored there)

#### 5. Environment Variables Not Working
- Problem: App can't find env variables
- Solution:
  - Vercel env vars require redeployment to take effect
  - For client, env vars must start with `VITE_`
  - Check they're set in the correct project

### View Logs:
```bash
# Using Vercel CLI
vercel logs <deployment-url>

# Or via Dashboard
# Go to project > Deployments > (select deployment) > Runtime Logs
```

## Post-Deployment

### Set Up Continuous Deployment:
- [ ] Connect Vercel to your Git repository
- [ ] Configure production branch (usually `main`)
- [ ] Now every push to main will auto-deploy

### Add Custom Domain (Optional):
1. [ ] Go to Vercel Dashboard > Project > Settings > Domains
2. [ ] Add your custom domain
3. [ ] Update DNS settings as instructed
4. [ ] Update environment variables to use new domain
5. [ ] Update Google OAuth settings with new domain

### Monitor Your App:
- [ ] Check Vercel Analytics
- [ ] Set up error monitoring (optional: Sentry, LogRocket)
- [ ] Monitor MongoDB Atlas metrics

## Security Checklist

- [ ] `SESSION_SECRET` is a strong random string (not "dev_secret_change_me")
- [ ] MongoDB user has limited permissions (not admin)
- [ ] Google OAuth credentials are kept secret
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] CORS is restricted to your client domain only
- [ ] Rate limiting is considered (for future)

## Environment Variables Reference

### Server (Backend)
| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/momentum` | Yes | Use MongoDB Atlas |
| `SESSION_SECRET` | Random 32+ char string | Yes | Keep secret! |
| `CLIENT_URL` | `https://momentum-client.vercel.app` | Yes | Your frontend URL |
| `GOOGLE_CLIENT_ID` | From Google Console | Yes* | *If using OAuth |
| `GOOGLE_CLIENT_SECRET` | From Google Console | Yes* | *If using OAuth |
| `GOOGLE_CALLBACK_URL` | `https://momentum-server.vercel.app/auth/google/callback` | Yes* | *If using OAuth |
| `NODE_ENV` | `production` | Yes | Set automatically by Vercel |

### Client (Frontend)
| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `VITE_SERVER_URL` | `https://momentum-server.vercel.app` | Yes | Your backend URL |

## Done! 🎉

Your Momentum app should now be live and accessible to anyone with the URL!

**Next Steps:**
- Share your app URL with friends
- Consider adding a custom domain
- Monitor usage and performance
- Plan new features
- Set up monitoring and error tracking

**Useful Commands:**
```bash
# Check deployment status
vercel ls

# View project info
vercel inspect <deployment-url>

# Pull environment variables locally
vercel env pull

# View logs
vercel logs <deployment-url>
```
