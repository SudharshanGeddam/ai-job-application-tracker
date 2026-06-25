const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {

    // Grab the Authorization header from the request
    const authHeader = req.headers['authorization'];

    // Check if the token is present and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            message: 'Access denied. No token provided.' });
    }

    // Extract the token from the header
    const token = authHeader.split(' ')[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
        });
    }
}

module.exports = { protect };