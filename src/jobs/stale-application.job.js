const prisma = require('../config/prisma.config');

const STALE_AFTER_DAYS = 30;

/**
 * Marks applications as STALE if they have been in APPLIED status
 * for more than STALE_AFTER_DAYS without any update.
 *
 * Exported so it can be triggered manually or tested.
 */
const runStaleApplicationJob = async () => {
    console.log('[CRON] Running stale application check...');

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - STALE_AFTER_DAYS);

        const result = await prisma.application.updateMany({
            where: {
                status: 'APPLIED',
                appliedDate: {
                    lt: cutoffDate,
                },
            },
            data: {
                status: 'STALE',
            },
        });

        console.log(`[CRON] Marked ${result.count} application(s) as STALE (applied > ${STALE_AFTER_DAYS} days ago).`);
    } catch (error) {
        console.error('[CRON] Error occurred while updating stale applications:', error.message);
    }
};


module.exports = { runStaleApplicationJob };