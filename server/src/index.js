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
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Basic config
app.use(morgan('dev'));
app.use(express.json());

// CORS handling
// If CLIENT_URL === 'self', we assume same-origin (client assets served by this server) and skip CORS.
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
if (CLIENT_URL !== 'self') {
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
}

// Session / Cookie configuration (production friendly)
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
// IMPORTANT: Do not hard-code production credentials here. Provide via env var.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/momentum';

// Decide cookie attributes based on environment & overrides
const NODE_ENV = process.env.NODE_ENV || 'development';
const COOKIE_SECURE = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true' || NODE_ENV === 'production';
// If frontend on different origin & using https, SameSite must be 'none'
let sameSite = process.env.COOKIE_SAMESITE || (COOKIE_SECURE ? 'none' : 'lax');
// If serving client and server on same origin (CLIENT_URL === 'self'), lax is sufficient & preferred.
if (CLIENT_URL === 'self') sameSite = 'lax';
if (!['lax', 'none', 'strict'].includes(sameSite)) sameSite = 'lax';

// On Render / proxies, trust first proxy so secure cookies work
app.set('trust proxy', 1);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite,
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    },
    store: MongoStore.create({ mongoUrl: MONGO_URI })
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth routes minimal
app.get('/auth/me', (req, res) => {
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
    (req, res) => res.redirect(CLIENT_URL === 'self' ? '/' : CLIENT_URL)
  );
  // Accept trailing slash variants just in case
  app.get(
    '/auth/google/callback/',
    passport.authenticate('google', { failureRedirect: '/auth/failed' }),
    (req, res) => res.redirect(CLIENT_URL === 'self' ? '/' : CLIENT_URL)
  );
  // Temporary, non-sensitive debug endpoint to verify OAuth configuration
  app.get('/auth/debug', (_req, res) => {
    const cbMode = CLIENT_URL === 'self' ? 'relative' : 'absolute';
    const callbackTarget = CLIENT_URL === 'self'
      ? '/auth/google/callback'
      : (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback');
    res.json({
      googleEnabled: true,
      clientMode: CLIENT_URL,
      callbackMode: cbMode,
      callbackTarget
    });
  });
} else {
  app.get('/auth/google', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
  app.get('/auth/google/callback', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
  app.get('/auth/google/callback/', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
  app.get('/auth/debug', (_req, res) => {
    res.json({
      googleEnabled: false,
      clientMode: CLIENT_URL
    });
  });
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
  console.log(`Server listening on port ${PORT}`);
  if (CLIENT_URL) console.log(`Client mode: ${CLIENT_URL === 'self' ? 'same-origin (no CORS)' : `CORS origin ${CLIENT_URL}`}`);
  console.log(`Google OAuth enabled: ${googleEnabled}`);
});

// Serve client build (single-service deployment)
if (CLIENT_URL === 'self') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback (exclude API, auth, health endpoints)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
