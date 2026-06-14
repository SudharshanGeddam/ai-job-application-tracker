const prisma = require('../config/prisma');
const { createApplicationSchema } = require('../validators/applicationValidator');

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await prisma.application.findMany();
        res.json({success: true, data: applications});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to fetch applications'});
    }
}

// Get a single application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await prisma.application.findUnique({
            where: { id }
        });

        if (!application) {
            return res.status(404).json({success: false, message: 'Application not found'});
        }

        res.json({success: true, data: application});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to fetch application'});
    }
}

// Create a new application
exports.createApplication = async (req, res) => {
    try {
        const validationResult = createApplicationSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({success: false, errors: validationResult.error.flatten().fieldErrors, message: 'Validation failed' });
        }

        const data = validationResult.data;

        const newApplication = await prisma.application.create({
            data: {
                ...data,
                userId: req.user.id 
            }
        });

        res.status(201).json({success: true, data: newApplication});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to create new application'});
    }
}

// Update an application by ID
exports.updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, role, status, jobLink, notes, appliedDate } = req.body;

        const application = await prisma.application.update({
            where: { id },
            data: {
                companyName,
                role,
                status,
                jobLink,
                notes,
                appliedDate
            }
        });
        res.json({success: true, data: application});
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({success: false, message: 'Application not found'});
        }
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to update application'});
    }
}

// Delete an application by ID
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.application.delete({
            where: { id }
        });

        res.status(200).json({success: true, message: 'Application deleted successfully'});
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({success: false, message: 'Application not found'});
        }
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to delete application'});
    }
}