const cron = require("node-cron");
const { sendReminderEmails } = require('../services/reminder.service');

cron.schedule('0 9 * * *', async () => { // Run daily at 9 AM
    console.log("[CRON] Running application reminder check...");

    try {
        await sendReminderEmails();     
    } catch (error) {
        console.error("[CRON] Error occurred while fetching remainders:", error.message);
    }
});