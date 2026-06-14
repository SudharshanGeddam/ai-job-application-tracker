const { z } = require('zod');

const createApplicationSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    role: z.string().min(1, 'Role is required'),
    status: z.enum(['applied', 'interview', 'offer', 'rejected']),
    appliedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    jobLink: z.string().url().optional(),
});

module.exports = {
    createApplicationSchema
};