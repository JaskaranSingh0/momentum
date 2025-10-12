import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import './passport.js';
import { googleEnabled } from './passport.js';
import tasksRouter from './routes/tasks.js';
import diaryRouter from './routes/diary.js';
import statsRouter from './routes/stats.js';
import profileRouter from './routes/profile.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1';

// Basic config
app.use(morgan('dev'));
app.use(express.json());

// When running behind a proxy (Render, Vercel, etc.), trust the first proxy so
// req.secure reflects the original protocol and secure cookies can be set.
// This is required for SameSite=None; Secure cookies on HTTPS.
app.set('trust proxy', 1);

// CORS for client on http://localhost:5173 by default
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// Session
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/momentum';
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    },
    store: MongoStore.create({ mongoUrl: MONGO_URI })
  })
);

// Passport (must come after session middleware)
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth routes minimal
app.get('/auth/me', (req, res) => {
  if (DEBUG_AUTH) {
    console.log('🔍 /auth/me - Session ID:', req.sessionID);
    console.log('🔍 /auth/me - Cookie header:', req.headers.cookie || '(none)');
    console.log('🔍 /auth/me - User:', req.user ? req.user.email : 'null');
    console.log('🔍 /auth/me - Session:', req.session);
  }
  if (!req.user) return res.status(401).json({ user: null });
  const { id, email, name, image, theme } = req.user;
  res.json({ user: { id, email, name, image, theme } });
});

app.get('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

// Google OAuth routes
if (googleEnabled) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/failed' }),
    (req, res) => {
      if (DEBUG_AUTH) {
        console.log('✅ OAuth callback successful - User:', req.user?.email);
        console.log('🔍 OAuth callback - Session ID:', req.sessionID);
        console.log('🔍 OAuth callback - Set-Cookie expected (check response headers in browser devtools)');
        console.log('🔍 OAuth callback - Request headers cookie:', req.headers.cookie || '(none)');
        console.log('🔍 OAuth callback - Session data:', req.session);
      }
      // Ensure session is saved before responding to improve reliability
      req.session.save(() => {
        // Return a small HTML page to ensure the Set-Cookie header is processed
        // before navigating back to the client app.
        const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Signing you in…</title></head>
<body>
  <p>Signing you in…</p>
  <script>
    // Navigate back to the client after a tick
    setTimeout(function(){ window.location.replace(${JSON.stringify(CLIENT_URL)}); }, 50);
  </script>
  <noscript>
    <a href=${JSON.stringify(CLIENT_URL)}>Continue</a>
  </noscript>
</body></html>`;
        res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
      });
    }
  );
} else {
  app.get('/auth/google', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
  app.get('/auth/google/callback', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
}

app.get('/auth/failed', (_req, res) => {
  res.status(401).json({ ok: false, error: 'Authentication failed' });
});

// API
app.use('/api/tasks', tasksRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/stats', statsRouter);
app.use('/api/me', profileRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
