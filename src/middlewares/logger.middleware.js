const logger = (req, res, next) => {
    const now = new Date();

    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip;

    const originalJson = res.json;
    res.json = function (body) {
        console.log(`[${date} ${time}] ${method} ${url} - ${ip} - Response:\n`, JSON.stringify(body, null, 2));
        return originalJson.call(this, body);
    };

    next();
};

module.exports = logger;