const prisma = require('../config/prisma');
const { createApplicationSchema } = require('../validators/applicationValidator');

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            where: { userId: req.user.id },
            orderBy: { appliedDate: 'desc' }, // Optional: order by applied date
        });
        res.json({success: true, data: applications});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while fetching applications'});
    }
}

// Get a single application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const application = await prisma.application.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({success: false, message: 'Application not found'});
        }

        res.json({success: true, data: application});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while fetching application'});
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
        res.status(500).json({success: false, message: 'Server error while creating new application'});
    }
}

// Update an application by ID
exports.updateApplication = async (req, res) => {
    try {
        const { companyName, role, status, jobLink, notes, appliedDate } = req.body;

        const application = await prisma.application.update({
            where: { id: req.params.id, userId: req.user.id },
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
        res.status(500).json({success: false, message: 'Server error while updating application'});
    }
}

// Delete an application by ID
exports.deleteApplication = async (req, res) => {
    try {
        
        await prisma.application.delete({
            where: { id: req.params.id, userId: req.user.id }
        });

        res.status(200).json({success: true, message: 'Application deleted successfully'});
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({success: false, message: 'Application not found'});
        }
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while deleting application'});
    }
}