const AppError = require('../utils/AppError');

/**
 * Validates that the request was triggered by a trusted cron system
 * by checking for the Bearer token configured in CRON_SECRET.
 */
const cronAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Unauthorized: Missing or invalid cron authorization header', 401));
    }

    const token = authHeader.split(' ')[1];
    
    if (token !== process.env.CRON_SECRET) {
        return next(new AppError('Unauthorized: Invalid cron secret', 401));
    }

    next();
};

module.exports = { cronAuth };
