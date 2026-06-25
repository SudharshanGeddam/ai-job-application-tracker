/**
 * AppError — a structured operational error for the Job Tracker API.
 *
 * "Operational errors" are expected, predictable failures:
 *   - 404 Not Found, 400 Bad Request, 401 Unauthorized, 409 Conflict, etc.
 * They are safe to show to the client.
 *
 * "Programming errors" are unexpected bugs (e.g. TypeError, null deref).
 * They should be logged and return a generic 500 to the client.
 *
 * Usage:
 *   throw new AppError('Application not found', 404);
 *   throw new AppError('AI service unavailable', 502);
 */
class AppError extends Error {
    /**
     * @param {string} message - human-readable error message (sent to client)
     * @param {number} statusCode - HTTP status code (4xx = client error, 5xx = server error)
     */
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Mark as an operational error — the global error handler uses this
        // to decide whether to send the message to the client or a generic fallback
        this.isOperational = true;

        // Capture the stack trace, excluding the AppError constructor itself
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
