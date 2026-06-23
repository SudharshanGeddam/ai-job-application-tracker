const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const { login } = require('../controllers/authController');
const { authRateLimiter } = require('../middlewares/rateLimiter');

router.use(authRateLimiter); // Apply auth rate limiter to all auth routes

router.post('/register', register);
router.post('/login', login);

module.exports = router;