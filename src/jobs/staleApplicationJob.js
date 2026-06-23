const corn = require("node-cron");
const prisma = require("../config/prisma");

cron.schedule("0 0 * * *", async () => { // Run daily at midnight
    console.log("[CRON] Running stale application check...");

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); 

        const result = await prisma.application.updateMany({
            where: {
                status: "APPLIED",
                appliedDate: {
                    lt: cutoffDate,
                },
            },
            data: {
                status: "STALE",
            },
        });
        console.log(`[CRON] Updated ${result.count} application(s) to STALE status.`);
    } catch (error) {
        console.error("[CRON] Error occurred while updating stale applications:", error.message);
    }
});