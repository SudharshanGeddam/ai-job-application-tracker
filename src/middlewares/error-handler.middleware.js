const AppError = require('../utils/AppError');

/**
 * Global Express error handler middleware.
 *
 * Express identifies error-handling middleware by the 4-argument signature (err, req, res, next).
 * You MUST register this AFTER all routes in index.js:
 *   app.use(errorHandler);
 *
 * It distinguishes between:
 *   - Operational errors (AppError instances): safe to send to client
 *   - Programming errors: log full stack, send generic 500 to client
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 if no statusCode is set on the error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Always log the error server-side for debugging
    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.statusCode}: ${err.message}`);

    // In development, log the full stack trace for easier debugging
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    if (err.isOperational) {
        // Operational errors: send the real message to the client
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
        });
    }

    // Programming / unknown errors: don't leak details
    // Log as much as possible for the developer
    console.error('[PROGRAMMING ERROR]', err);

    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong. Please try again later.',
    });
};

module.exports = errorHandler;
