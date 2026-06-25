const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authRateLimiter } = require('../middlewares/rate-limiter.middleware');

// Apply auth-specific rate limiter (stricter: 10 req / 15 min) to prevent brute force
router.use(authRateLimiter);

router.post('/register', register);
router.post('/login', login);

// Protected: requires a valid JWT
router.get('/me', protect, getMe);

module.exports = router;