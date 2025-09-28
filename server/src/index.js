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

// Environment helpers
const isProd = process.env.NODE_ENV === 'production';

// Basic config
app.use(morgan('dev'));
app.use(express.json());

// CORS for client on http://localhost:5173 by default
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CLIENT_URLS = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const allowedOrigins = CLIENT_URLS.length ? CLIENT_URLS : [CLIENT_URL];
const originRegex = process.env.CORS_ORIGIN_REGEX ? new RegExp(process.env.CORS_ORIGIN_REGEX) : null;
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      if (originRegex && originRegex.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// Session
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/momentum';
// If behind a proxy (Render, Railway, Vercel functions, etc.), trust it for secure cookies
if (isProd) {
  app.set('trust proxy', 1);
}
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // For cross-site cookies (client on different domain), use secure+SameSite=None in production
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      // Optionally pin cookie to a parent domain if provided
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
    (req, res) => res.redirect(CLIENT_URL)
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
