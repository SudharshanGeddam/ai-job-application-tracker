const cron = require("node-cron");
const prisma = require('../config/prisma');

cron.schedule('0 9 * * *', async () => { // Run daily at 9 AM
    console.log("[CRON] Running application reminder check...");

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const remainders = await prisma.reminder.findMany({
            where: {
                remindAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                isCompleted: false,
            },
            include: {
                application: {
                    select: {
                        companyName: true,
                        role: true,
                    }
                }
            }
        });

        if (remainders.length === 0) {
            console.log("[CRON] No remainders to send today.");
            return;
        }

        remainders.forEach(remainder => {
            console.log(`[CRON] Reminder: You have a reminder for ${remainder.application.role} at ${remainder.application.companyName} scheduled for ${remainder.remindAt.toLocaleString()}.`);
        });
    } catch (error) {
        console.error("[CRON] Error occurred while fetching remainders:", error.message);
    }
});