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


module.exports = { runReminderJob };
