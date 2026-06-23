const prisma = require('../config/prisma');
const { createReminderSchema, updateReminderSchema } = require('../validators/reminderValidator');



// POST /api/reminders
const createReminder = async (req, res) => {
    try {
    const result = createReminderSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { applicationId, message, remindAt } = result.data;
    const userId = req.user.userId;

    const application = await prisma.application.findFirst({
        where: {
            id: applicationId,
            userId: userId
        }
    });

    if (!application) {
        return res.status(404).json({ error: "Application not found" });
    }

    const reminder = await prisma.reminder.create({
        data: {
            applicationId: applicationId,
            message: message,
            remindAt: remindAt
        }
    });

    res.status(201).json(reminder);
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/reminders
const getAllReminders = async (req, res) => {
    try {
    const userId = req.user.userId;

    const reminders = await prisma.reminder.findMany({
        where: {
            application: {
                userId: userId
            }
        },
        include: {
            application: {
                select: {
                    role: true,
                    companyName: true
                }
            },
        },
            orderBy: {
                remindAt: 'asc'
            }
    });
    return res.status(200).json(reminders);
    } catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Get /api/reminders/:id
const getReminderById = async (req, res) => {
    try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reminder = await prisma .reminder.findUnique({
        where: { id: id },
        include: {
            application: true
        }
    });

    if (!reminder) {
        return res.status(404).json({ error: "Reminder not found" });
    }

    if (reminder.application.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json(reminder);
    } catch (error) {
        console.error("Error fetching reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// PATCH /api/reminders/:id
const updateReminder = async (req, res) => {
    try {
    const result = updateReminderSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const existingReminder = await prisma.reminder.findUnique({
        where: { id: id },
        include: {
            application: true
        }
    });

    if (!existingReminder) {
        return res.status(404).json({ error: "Reminder not found" });
    }

    if (existingReminder.application.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
    }  

    const updatedReminder = await prisma.reminder.update({
        where: { id: id },
        data: result.data
    });

    return res.status(200).json(updatedReminder);
    } catch (error) {
        console.error("Error updating reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// DELETE /api/reminders/:id
const deleteReminder = async (req, res) => {
    try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingReminder = await prisma.reminder.findUnique({
        where: { id: id },
        include: {
            application: true
        }
    });

    if (!existingReminder) {
        return res.status(404).json({ error: "Reminder not found" });
    }

    if (existingReminder.application.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.reminder.delete({
        where: { id: id }
    });

    return res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    createReminder,
    getAllReminders,
    getReminderById,
    updateReminder,
    deleteReminder
};