// src/app.js — Core Express Application
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const logger = require('./middlewares/logger.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');
const { globalRateLimiter } = require('./middlewares/rate-limiter.middleware');

const applicationRoutes = require('./routes/application.routes');
const authRoutes = require('./routes/auth.routes');
const reminderRoutes = require('./routes/reminder.routes');
const cronRoutes = require('./routes/cron.routes');

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
    res.json({ message: 'Job Tracker API is running on Vercel' });
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
app.use('/api/cron', cronRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
