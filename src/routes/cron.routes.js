const express = require('express');
const router = express.Router();
const { cronAuth } = require('../middlewares/cron-auth.middleware');
const { runStaleApplicationJob } = require('../jobs/stale-application.job');
const { runReminderJob } = require('../jobs/reminder.job');

// Protect all cron routes with the cronAuth middleware
router.use(cronAuth);

router.post('/stale-applications', async (req, res, next) => {
    try {
        await runStaleApplicationJob();
        res.status(200).json({ success: true, message: 'Stale application job completed successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/reminders', async (req, res, next) => {
    try {
        await runReminderJob();
        res.status(200).json({ success: true, message: 'Reminder job completed successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
