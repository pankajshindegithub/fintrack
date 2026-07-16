import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';

// ─── Load environment variables ───────────────────────────────────────────────
// Works both locally (reads ../.env relative to src/) and on Render
// (where env vars are injected directly into process.env).
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Build the allowlist from the CORS_ORIGINS env var (comma-separated) so that
// multiple origins can be whitelisted without a code change.
// Falls back to a hardcoded list that covers local dev + all Vercel preview/
// production deployments.
const parseOrigins = (raw = '') =>
  raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const envOrigins = parseOrigins(process.env.CORS_ORIGINS);

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://fintrack-smartt.vercel.app',
  // New Vercel preview URL provided in the requirements
  'https://fintrack-fjcsxpy29-pankajshindegithubs-projects.vercel.app',
  // Wildcard that matches every *.vercel.app preview / production domain
  'https://*.vercel.app',
];

const allowedOrigins = envOrigins.length ? envOrigins : DEFAULT_ORIGINS;

/**
 * Returns true when the incoming `origin` header is in the allowlist.
 * Supports exact matches and simple * wildcards (e.g. https://*.vercel.app).
 * Requests with no origin header (curl, Postman, server-to-server) are allowed.
 */
const isOriginAllowed = (origin) => {
  // No origin header → allow (server-to-server, curl, Postman, etc.)
  if (!origin) return true;

  for (const allowed of allowedOrigins) {
    // Exact match
    if (allowed === origin) return true;

    // Wildcard match: convert https://*.vercel.app → regex ^https://.*\.vercel\.app$
    if (allowed.includes('*')) {
      const pattern = allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars
        .replace(/\*/g, '.*');                   // replace * with .*
      if (new RegExp(`^${pattern}$`).test(origin)) return true;
    }
  }
  return false;
};

const corsOptions = {
  // Dynamic origin check — required when credentials: true
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },

  // Allow cookies / Authorization headers to be sent cross-origin
  credentials: true,

  // Explicitly list every HTTP method the API uses
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers the client is allowed to send
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Cache the preflight response for 10 minutes (600 seconds)
  // so browsers don't send an OPTIONS request on every single call
  optionsSuccessStatus: 200,
  maxAge: 600,
};

// ── Register CORS BEFORE everything else (including body parser) ──────────────
// This ensures the CORS headers are present on EVERY response, including
// 4xx / 5xx errors thrown by later middleware.
app.use(cors(corsOptions));

// ── Respond to OPTIONS preflight requests immediately ─────────────────────────
// Express's cors() middleware already handles this, but registering an explicit
// handler makes it crystal-clear and avoids any edge-case ordering issues.
app.options('*', cors(corsOptions));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Cookie parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── HTTP request logger (dev only) ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
// Useful for Render's health-check ping and uptime monitors.
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// All routes are prefixed with /api/v1 so the frontend must call:
//   POST https://fintrack1-bw0s.onrender.com/api/v1/auth/register
//   POST https://fintrack1-bw0s.onrender.com/api/v1/auth/login
//   GET  https://fintrack1-bw0s.onrender.com/api/v1/transactions
//   ... etc.
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/goals',        goalRoutes);
app.use('/api/v1/insights',     insightsRoutes);
app.use('/api/v1/budgets',      budgetRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// Must have exactly 4 params so Express recognises it as an error middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  console.error(`[Error] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ─── Handle unhandled promise rejections ──────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
