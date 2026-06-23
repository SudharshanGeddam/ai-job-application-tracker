const prisma = require('../config/prisma');
const { sendEmail } = require('../services/email.service');

const sendReminderEmails = async () => {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
        where: {
            remindAt: { lte: now },
            isCompleted: false,
        },
        include: {
            application: {
                include: {
                    user: true,
                },
            },
        },
    });

    console.log(`[ReminderService] Found ${dueReminders.length} due reminder(s)`);

    for (const reminder of dueReminders) {
        const { application } = reminder;
        const { user } = application;

        try {
            await sendEmail({
                to: user.email,
                subject: `Reminder: ${reminder.message}`,
                html: `
                    <h2>Application Reminder</h2>
                    <p>Hi ${user.name ?? 'there'},</p>
                    <p>${reminder.message}</p>
                    <ul>
                        <li><strong>Company:</strong> ${application.companyName}</li>
                        <li><strong>Role:</strong> ${application.role}</li>
                        <li><strong>Status:</strong> ${application.status}</li>
                    </ul>
                    <p>Good luck! 🚀</p>
                `,
            });

            await prisma.reminder.update({
                where: { id: reminder.id },
                data: { isCompleted: true },
            });

            console.log(`[ReminderService] ✓ Reminder sent for application ${application.id}`);
        } catch (err) {
            console.error(`[ReminderService] ✗ Failed for reminder ${reminder.id}:`, err.message);
        }
    }
};

module.exports = { sendReminderEmails };