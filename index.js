// index.js — Application entry point
'use strict';

// ─── Load Environment Variables ───────────────────────────────────
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const logger = require('./src/middlewares/logger.middleware');
const errorHandler = require('./src/middlewares/error-handler.middleware');
const { globalRateLimiter } = require('./src/middlewares/rate-limiter.middleware');

const applicationRoutes = require('./src/routes/application.routes');
const authRoutes = require('./src/routes/auth.routes');
const reminderRoutes = require('./src/routes/reminder.routes');

// ─── Create Express App ───────────────────────────────────────────
const app = express();

// ─── Security Headers ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : '*';

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ─── Body Parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Request Logging ──────────────────────────────────────────────
app.use(logger);

// ─── Global Rate Limiter ──────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health & Root Routes ─────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Job Tracker API is running' });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/applications', applicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ─── Background Jobs ──────────────────────────────────────────────
require('./src/jobs/stale-application.job');
require('./src/jobs/reminder.job');

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
    server.close(() => {
        console.error('[FATAL] Server closed due to unhandled rejection. Exiting...');
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
});
