const { z } = require('zod');

const createReminderSchema = z.object({
    applicationId: z.string().uuid('Invalid application ID'),
    message: z.string().min(1, 'Message is required').max(500, 'Message must be at most 500 characters'),
    // coerce converts ISO string → Date, then refine checks it's actually in the future
    remindAt: z.coerce.date().refine(
        (date) => date > new Date(),
        { message: 'Reminder date must be in the future' }
    ),
});

const updateReminderSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty').max(500).optional(),
    // When updating, if a new date is provided it also must be in the future
    remindAt: z.coerce.date().refine(
        (date) => date > new Date(),
        { message: 'Reminder date must be in the future' }
    ).optional(),
    isCompleted: z.boolean().optional(),
});

module.exports = {
    createReminderSchema,
    updateReminderSchema,
};