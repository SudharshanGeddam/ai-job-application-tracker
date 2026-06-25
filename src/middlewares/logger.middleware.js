const logger = (req, res, next) => {
    const now = new Date();

    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip;

    console.log(`[${date} ${time}] ${method} ${url} - ${ip}`);
    next();
};

module.exports = logger;