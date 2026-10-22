const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profile.routes');
const matchmakingRoutes = require('./routes/matchmaking.routes');
const teamRoutes = require('./routes/team.routes');
const challengeRoutes = require('./routes/challenge.routes');
const battleRoutes = require('./routes/battle.routes');
const submissionRoutes = require('./routes/submission.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const resultRoutes = require('./routes/result.routes');
const showcaseRoutes = require('./routes/showcase.routes');

const app = express();


// CORS configuration: Allow local Vite frontend during dev and production frontend
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:3000'
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');

    // Check configured origins or non-production environment
    if (allowedOrigins.has(cleanOrigin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow Vercel preview and production deployment domains
    try {
      const { hostname } = new URL(cleanOrigin);
      if (hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (_) {}

    return callback(new Error(`Blocked by CORS policy: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());
app.use('/api/profiles', profileRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/showcase', showcaseRoutes);


// Health check endpoint (Required for Render and monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'klyro-backend',
    timestamp: new Date().toISOString()
  });
});
const { requireAuth, requireAdmin } = require('./middlewares/auth.middleware');

// Test protected route
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.status(200).json({
    message: 'Authenticated successfully',
    user: req.user
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist.`
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Something went wrong on the server'
  });
});

module.exports = app;