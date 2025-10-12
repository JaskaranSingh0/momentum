# Vercel Deployment Guide for Momentum

This guide will help you deploy both the client and server to Vercel.

## Prerequisites

1. Install Vercel CLI globally (optional but recommended):
   ```bash
   npm install -g vercel
   ```

2. Create a Vercel account at https://vercel.com if you haven't already

## Project Structure

This is a monorepo with two parts:
- **client**: React + Vite frontend
- **server**: Express backend API

## Deployment Steps

### 1. Deploy the Server (Backend API)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N**
   - Project name: `momentum-server` (or your preferred name)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

4. After deployment, note the production URL (e.g., `https://momentum-server.vercel.app`)

5. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings on Vercel
   - Navigate to Settings > Environment Variables
   - Add the following variables:

   ```
   MONGO_URI=mongodb+srv://your-mongo-connection-string
   SESSION_SECRET=your-secure-random-secret-key
   CLIENT_URL=https://your-client-domain.vercel.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://momentum-server.vercel.app/auth/google/callback
   PORT=3001
   ```

6. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

### 2. Deploy the Client (Frontend)

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N**
   - Project name: `momentum-client` (or your preferred name)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings on Vercel
   - Navigate to Settings > Environment Variables
   - Add:

   ```
   VITE_SERVER_URL=https://momentum-server.vercel.app
   ```

5. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

### 3. Update Google OAuth Settings

After deploying both applications:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   https://your-server-domain.vercel.app/auth/google/callback
   ```
6. Add to **Authorized JavaScript origins**:
   ```
   https://your-client-domain.vercel.app
   ```

### 4. Update Server Environment Variables

After getting your client URL, update the server's `CLIENT_URL` environment variable:
1. Go to Vercel Dashboard > momentum-server > Settings > Environment Variables
2. Update `CLIENT_URL` to your actual client URL
3. Redeploy the server

## Alternative: Deploy via Vercel Dashboard

Instead of using CLI, you can:

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure two separate projects:
   - **momentum-server** with root directory: `server`
   - **momentum-client** with root directory: `client`
4. Add environment variables in each project's settings
5. Deploy!

## Important Notes

### Session Configuration for Production

The server's session configuration needs to be updated for production. In `server/src/index.js`, the cookie settings should use:
```javascript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30
}
```

### CORS Configuration

The CORS is already configured to use `process.env.CLIENT_URL`, which is correct for production.

### MongoDB Atlas

Make sure your MongoDB connection string is from MongoDB Atlas (cloud) and not localhost. Also:
- Whitelist Vercel's IP addresses or use `0.0.0.0/0` (allow all) in MongoDB Atlas Network Access
- Ensure your connection string includes credentials

## Testing the Deployment

1. Visit your client URL (e.g., `https://momentum-client.vercel.app`)
2. Try logging in with Google OAuth
3. Test creating tasks, diary entries, etc.

## Troubleshooting

### Check Logs
```bash
vercel logs <deployment-url>
```

### Common Issues

1. **CORS errors**: Ensure `CLIENT_URL` in server matches your actual client domain
2. **OAuth not working**: Check Google Cloud Console redirect URIs
3. **Database connection**: Verify MongoDB Atlas connection string and network access
4. **Session issues**: Make sure `SESSION_SECRET` is set and `secure` cookie setting is correct

## Continuous Deployment

Once connected to Git:
- Push to main branch → auto-deploys to production
- Push to other branches → creates preview deployments

## Environment Variables Summary

### Server (Backend)
- `MONGO_URI` - MongoDB connection string (Atlas)
- `SESSION_SECRET` - Random secure string for sessions
- `CLIENT_URL` - Your client's production URL
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_CALLBACK_URL` - Your server URL + /auth/google/callback
- `PORT` - 3001 (Vercel handles this automatically)

### Client (Frontend)
- `VITE_SERVER_URL` - Your server's production URL

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Express Apps on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Deploying Vite Apps on Vercel](https://vercel.com/docs/frameworks/vite)
