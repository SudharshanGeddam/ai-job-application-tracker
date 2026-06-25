// src/server.js — Local Development Server
'use strict';

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');

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
