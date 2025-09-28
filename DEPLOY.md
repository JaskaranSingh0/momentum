# Deploying Momentum

This guide covers several production-ready options to deploy the React client and Node/Express API with MongoDB + Google OAuth.

## What you have
- Client: Vite + React (port 5173 in dev)
- Server: Express with sessions, Passport Google OAuth, MongoDB via Mongoose (port 3001 in dev)
- CORS and cookie-based auth. In prod, cookies are configured for cross-site by default.

Client uses `VITE_SERVER_URL` to reach the server. Server uses `CLIENT_URL` for CORS.

## Recommended setups

### Option A (Recommended): Vercel (client) + Render (server) + MongoDB Atlas
- Best separation of concerns, simple pricing, good DX.
- Vercel serves the React static build with a custom domain.
- Render hosts the Node API with persistent sessions stored in MongoDB Atlas.

### Option B: Fly.io (single app with two processes) + MongoDB Atlas
- Run client as static assets via Fly and server as a separate process.
- Slightly more advanced but very flexible and globally deployable.

### Option C: Railway/Heroku-like platforms
- Similar to Render. Railway can host Node easily; use MongoDB Atlas.

### Option D: Docker on a VPS (e.g., Azure VM, AWS EC2, Hetzner) + Nginx
- Full control. You’ll manage SSL, reverse proxy, and uptime.

---

## Environment variables

Create and configure these secrets in your platforms:

Server (.env)
- `PORT` — e.g., 3001 (platform may set this automatically)
- `CLIENT_URL` — your deployed client URL, e.g., `https://app.example.com`
- `MONGO_URI` — MongoDB Atlas connection string
- `SESSION_SECRET` — long random string
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `GOOGLE_CALLBACK_URL` — e.g., `https://api.example.com/auth/google/callback`
- `COOKIE_DOMAIN` — optional; parent domain like `.example.com` if client and server share a root domain
- `NODE_ENV` — `production`

Client (.env)
- `VITE_SERVER_URL` — e.g., `https://api.example.com`

> In local dev, these are already defaulted to localhost. In prod, set them explicitly.

---

## Step-by-step: Vercel (client) + Render (server)

### 1) Prepare MongoDB Atlas
- Create a free/shared cluster in MongoDB Atlas.
- Add a Database User and network access (IP Allowlist: 0.0.0.0/0 for testing or specific egress IPs).
- Copy the connection string as `MONGO_URI`.

### 2) Configure Google OAuth in Google Cloud Console
- Create OAuth 2.0 Client (Web application).
- Authorized JavaScript origins: your client URL (e.g., `https://your-client.vercel.app`).
- Authorized redirect URIs: your server callback URL (e.g., `https://your-server.onrender.com/auth/google/callback`).
- Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 3) Deploy the Server to Render
- Create a new Web Service from your GitHub repo.
- Root directory: `server`
- Build command: none (plain Node app)
- Start command: `node src/index.js`
- Environment: `NODE_VERSION` if needed; add the environment variables listed above.
- Add `CLIENT_URL` (your Vercel deploy URL for now) and `GOOGLE_CALLBACK_URL` using your Render URL.
- Set `NODE_ENV=production`.
- Once deployed, note the Render URL, e.g., `https://momentum-api.onrender.com`.

### 4) Deploy the Client to Vercel
- Import the repo on Vercel.
- Root directory: `client`
- Framework Preset: Vite
- Build command: `vite build` (default), Output directory: `dist`
- Add Environment Variable: `VITE_SERVER_URL` set to your Render URL.
- Deploy.

### 5) Update OAuth to use custom domains (optional)
- Add your custom domain(s) in Vercel and Render.
- Update `CLIENT_URL`, `VITE_SERVER_URL`, and `GOOGLE_CALLBACK_URL` to use the custom domains.
- If sharing a parent domain (e.g., `app.example.com` and `api.example.com`), you can set `COOKIE_DOMAIN=.example.com` on the server for consistent cookies.

### 6) Test
- Visit the client URL, login with Google, and exercise the app.
- Check server `/health` endpoint.

---

## Step-by-step: Railway (server) + Vercel (client)
- Essentially the same as Render. Set Railway service to Node, add env vars, and point `VITE_SERVER_URL` to the Railway URL.

---

## Docker (advanced)

Example Dockerfile for server (place in `server/Dockerfile`):

```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
```

- Build and push to a registry; run behind Nginx with TLS.
- Provide env vars via secrets or `.env` files.

For client, build locally and serve `client/dist` via a static CDN (e.g., Cloudflare Pages, Netlify, Vercel) or from Nginx.

---

## Notes on cookies, CORS, and proxies
- In production we set `trust proxy` and use `secure` cookies with `SameSite=None` to allow cross-site requests when client and API are on different domains.
- Ensure both client and server use HTTPS in production, otherwise secure cookies won’t be sent.
- Keep `credentials: 'include'` in fetch calls (already handled in code).

---

## Troubleshooting
---

## Step-by-step: Render (client) + Render (server) + MongoDB Atlas

You can deploy both services on Render. Two ways:

### A) One-click with render.yaml (recommended)
1) Ensure the repo root contains `render.yaml` (added in this repo). It provisions:
	- `momentum-server` (Node web service) using `server/`
	- `momentum-client` (static site) using `client/`
2) In Render, create a new Blueprint from this repo (Deploy > New + > Blueprint).
3) After the stack is created, open the server service and set missing secrets:
	- `MONGO_URI` (MongoDB Atlas)
	- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
	- Verify `GOOGLE_CALLBACK_URL` is `<server_url>/auth/google/callback` in both Render and Google console.
	- Optionally set `CLIENT_URLS` to include preview + production client URLs, or `CORS_ORIGIN_REGEX` for wildcard preview domains.
4) The `VITE_SERVER_URL` for the client is wired automatically from the server URL via the blueprint.
5) Deploy the blueprint. Once both services are live, test auth and API endpoints.

### B) Manual setup
1) Create a Static Site for the client:
	- Root directory: `client`
	- Build command: `npm ci && npm run build`
	- Publish directory: `client/dist`
	- Environment variable: `VITE_SERVER_URL` set to the server service URL (once created)
2) Create a Web Service for the server:
	- Root directory: `server`
	- Start command: `node src/index.js`
	- Environment variables:
	  - `NODE_ENV=production`
	  - `CLIENT_URL`=client URL (or `CLIENT_URLS` with comma-separated list)
	  - `MONGO_URI`, `SESSION_SECRET`
	  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
	  - `GOOGLE_CALLBACK_URL`=`<server_url>/auth/google/callback`
	  - Optional: `CORS_ORIGIN_REGEX` to allow preview subdomains
3) Update Google Cloud Console OAuth settings to include the client origin and the server callback URL.
4) Redeploy if you change env vars.

Tips
- If you see CORS errors on preview deploys, add the preview domain to `CLIENT_URLS` or use `CORS_ORIGIN_REGEX` like:
  `^https:\/\/.*-momentum-client-.*onrender\.com$`
- Ensure both services use HTTPS (Render does this by default). Secure cookies require HTTPS.

- Google login loops: check `CLIENT_URL`, `VITE_SERVER_URL`, and `GOOGLE_CALLBACK_URL` consistency, and that HTTPS is used.
- 401 on `/auth/me`: means no session cookie; verify domain/secure flags and that CORS allows credentials.
- Session not persisting: confirm MongoDB URL is reachable and that `connect-mongo` created the session collection.
