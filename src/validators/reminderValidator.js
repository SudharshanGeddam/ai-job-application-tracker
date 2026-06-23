const { z } = require('zod');

const createReminderSchema = z.object({
    applicationId: z.string().uuid("Invalid application ID"),
    message: z.string().min(1, "Message is required"),
    remindAt: z.coerce.date().refine((date) => new Date(),
    { message: "Remind at must be a valid date" }),
});

const updateReminderSchema = z.object({
    message: z.string().min(1).optional(),
    remindAt: z.coerce.date().refine((date) => new Date(),
    { message: "Remind at must be a valid date" }).optional(),
    isCompleted: z.boolean().optional(),
});

module.exports = {
    createReminderSchema,
    updateReminderSchema,
};