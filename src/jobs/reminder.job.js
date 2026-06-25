const cron = require('node-cron');
const { sendReminderEmails } = require('../services/reminder.service');

/**
 * Runs the reminder email job immediately (useful for manual triggering / testing).
 */
const runReminderJob = async () => {
    console.log('[CRON] Running application reminder check...');
    try {
        await sendReminderEmails();
    } catch (error) {
        console.error('[CRON] Error occurred while processing reminders:', error.message);
    }
};

// Schedule: runs every day at 9:00 AM server time
cron.schedule('0 9 * * *', runReminderJob);

module.exports = { runReminderJob };
