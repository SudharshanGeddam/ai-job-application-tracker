const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../config/multer.config');
const { aiRateLimiter } = require('../middlewares/rate-limiter.middleware');

const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationStats,
    analyzeJdMatch,
    generateCoverLetter,
} = require('../controllers/application.controller');

const { generateInterviewTips } = require('../controllers/interview-tips.controller');

// All routes below require a valid JWT
router.use(protect);

router.get('/', getAllApplications);
router.get('/stats', getApplicationStats);
router.get('/:id', getApplicationById);
router.post('/', upload.single('resume'), createApplication);
router.put('/:id', upload.single('resume'), updateApplication);
router.delete('/:id', deleteApplication);

// AI routes — stricter rate limit (20 req / hour)
router.use(aiRateLimiter);
router.post('/:id/analyze-jd', analyzeJdMatch);
router.post('/:id/cover-letter', generateCoverLetter);
router.post('/:id/interview-tips', generateInterviewTips);

module.exports = router;