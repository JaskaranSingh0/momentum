# Quick Deployment Reference

## 🚀 Fast Track Deployment (5 minutes)

### Prerequisites
1. GitHub account with your code pushed
2. Vercel account (free): https://vercel.com/signup
3. MongoDB Atlas cluster: https://www.mongodb.com/cloud/atlas
4. Google OAuth credentials: https://console.cloud.google.com/

---

## Step-by-Step

### 1️⃣ Deploy Server (2 min)
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Settings:
   - Root Directory: `server`
   - Framework: Other
4. Add these environment variables:
   ```
   MONGO_URI=mongodb+srv://...your-atlas-connection...
   SESSION_SECRET=create-a-random-32-character-string-here
   CLIENT_URL=https://will-fill-after-client-deploy.vercel.app
   GOOGLE_CLIENT_ID=your-id-from-google-console
   GOOGLE_CLIENT_SECRET=your-secret-from-google-console
   GOOGLE_CALLBACK_URL=https://your-server-url.vercel.app/auth/google/callback
   NODE_ENV=production
   ```
5. Deploy
6. **Copy server URL** → (e.g., `momentum-server-abc123.vercel.app`)

### 2️⃣ Deploy Client (2 min)
1. Go to https://vercel.com/new (again, new project)
2. Import same GitHub repository
3. Settings:
   - Root Directory: `client`
   - Framework: Vite
4. Add environment variable:
   ```
   VITE_SERVER_URL=https://your-server-url-from-step-1.vercel.app
   ```
5. Deploy
6. **Copy client URL** → (e.g., `momentum-client-xyz789.vercel.app`)

### 3️⃣ Update Server CLIENT_URL (1 min)
1. Go to Vercel → momentum-server → Settings → Environment Variables
2. Edit `CLIENT_URL` → paste your client URL from step 2
3. Go to Deployments → Redeploy latest

### 4️⃣ Configure Google OAuth (1 min)
1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials → Your OAuth Client
3. Authorized JavaScript origins:
   ```
   https://your-client-url.vercel.app
   ```
4. Authorized redirect URIs:
   ```
   https://your-server-url.vercel.app/auth/google/callback
   ```
5. Save

### 5️⃣ Test! ✅
Visit `https://your-client-url.vercel.app` and try logging in!

---

## 📋 Files Created

Your project now has these Vercel configuration files:

```
momentum/
├── DEPLOYMENT.md              ← Full deployment guide
├── DEPLOYMENT_CHECKLIST.md    ← Detailed checklist
├── .vercelignore             ← Files to ignore
├── client/
│   ├── vercel.json           ← Client config
│   └── .env.example          ← Client env template
└── server/
    ├── vercel.json           ← Server config
    └── .env.example          ← Server env template
```

---

## 🔑 Environment Variables Quick Reference

### Server needs:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `SESSION_SECRET` - Random secure string (32+ chars)
- `CLIENT_URL` - Your deployed client URL
- `GOOGLE_CLIENT_ID` - From Google Console
- `GOOGLE_CLIENT_SECRET` - From Google Console
- `GOOGLE_CALLBACK_URL` - Your server URL + `/auth/google/callback`
- `NODE_ENV` - Set to `production`

### Client needs:
- `VITE_SERVER_URL` - Your deployed server URL

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| CORS error | Check `CLIENT_URL` matches your actual client domain |
| OAuth fails | Verify redirect URIs in Google Console |
| Can't connect to DB | Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access |
| Session not working | Check `SESSION_SECRET` is set and MongoDB is connected |
| Env vars not working | Redeploy after adding/changing variables |

---

## 📱 Useful Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from CLI
cd server
vercel --prod

cd ../client
vercel --prod

# Check logs
vercel logs <deployment-url>

# List deployments
vercel ls
```

---

## ✨ What Changed in Your Code

✅ Updated `server/src/index.js` - Cookie security for production  
✅ Created `server/vercel.json` - Server deployment config  
✅ Created `client/vercel.json` - Client deployment config  
✅ Created `.vercelignore` - Files to exclude  
✅ Created `.env.example` files - Environment variable templates  

---

## 🎯 Next Steps After Deployment

1. **Test everything** - Login, create tasks, diary entries
2. **Monitor** - Check Vercel dashboard for errors
3. **Custom domain** (optional) - Add in Vercel project settings
4. **Share** - Send your URL to friends!

---

## 📚 Full Documentation

- See `DEPLOYMENT.md` for complete guide
- See `DEPLOYMENT_CHECKLIST.md` for detailed checklist
- Check `.env.example` files for all environment variables

---

## 🆘 Need Help?

1. Check the detailed guides mentioned above
2. View Vercel logs: Vercel Dashboard → Project → Deployments → Runtime Logs
3. Check browser console for frontend errors (F12)
4. Verify all environment variables are set correctly

**Your app is ready to deploy! 🚀**
