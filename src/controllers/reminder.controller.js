const prisma = require('../config/prisma.config');
const AppError = require('../utils/AppError');
const { createReminderSchema, updateReminderSchema } = require('../validators/reminder.validator');

// POST /api/reminders
const createReminder = async (req, res, next) => {
    try {
        const result = createReminderSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { applicationId, message, remindAt } = result.data;
        const userId = req.user.userId;

        // Verify the application exists and belongs to this user
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
        });

        if (!application) {
            return next(new AppError('Application not found', 404));
        }

        const reminder = await prisma.reminder.create({
            data: { applicationId, message, remindAt },
        });

        return res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/reminders
const getAllReminders = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const reminders = await prisma.reminder.findMany({
            where: {
                application: { userId },
            },
            include: {
                application: {
                    select: {
                        role: true,
                        companyName: true,
                    },
                },
            },
            orderBy: { remindAt: 'asc' },
        });

        return res.status(200).json({
            success: true,
            data: reminders,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/reminders/:id
const getReminderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const reminder = await prisma.reminder.findUnique({
            where: { id },
            include: { application: true },
        });

        if (!reminder) {
            return next(new AppError('Reminder not found', 404));
        }

        // Authorization check: the reminder's application must belong to this user
        if (reminder.application.userId !== userId) {
            return next(new AppError('You do not have permission to access this reminder', 403));
        }

        return res.status(200).json({
            success: true,
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/reminders/:id
const updateReminder = async (req, res, next) => {
    try {
        const result = updateReminderSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { id } = req.params;
        const userId = req.user.userId;

        const existingReminder = await prisma.reminder.findUnique({
            where: { id },
            include: { application: true },
        });

        if (!existingReminder) {
            return next(new AppError('Reminder not found', 404));
        }

        if (existingReminder.application.userId !== userId) {
            return next(new AppError('You do not have permission to update this reminder', 403));
        }

        const updatedReminder = await prisma.reminder.update({
            where: { id },
            data: result.data,
        });

        return res.status(200).json({
            success: true,
            message: 'Reminder updated successfully',
            data: updatedReminder,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/reminders/:id
const deleteReminder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const existingReminder = await prisma.reminder.findUnique({
            where: { id },
            include: { application: true },
        });

        if (!existingReminder) {
            return next(new AppError('Reminder not found', 404));
        }

        if (existingReminder.application.userId !== userId) {
            return next(new AppError('You do not have permission to delete this reminder', 403));
        }

        await prisma.reminder.delete({ where: { id } });

        return res.status(200).json({
            success: true,
            message: 'Reminder deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReminder,
    getAllReminders,
    getReminderById,
    updateReminder,
    deleteReminder,
};