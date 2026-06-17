const prisma = require('../config/prisma');
const { createApplicationSchema } = require('../validators/applicationValidator');
const { parsePaginationParams, buildPaginationMetadata } = require('../utils/pagination.utils');
    
// Get all applications
exports.getAllApplications = async (req, res) => {
    try {

        // Parse query params with safe defaults
        const { page, limit, skip, orderBy } = parsePaginationParams(req.query, ['appliedDate', 'createdAt','companyName', 'role']);

        // Build the where clause based on query params
        const where = { userId: req.user.userId };

        const { status, companyName } = req.query;
    
        if (status) {
            where.status = status.toUpperCase();
        }
        if (companyName) {
            where.companyName = { contains: companyName, mode: 'insensitive'  }; };

       // Fetch total count and paginated applications in parallel
        const [total, applications] = await Promise.all([
            prisma.application.count({ where }),
            prisma.application.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        res.json({
            success: true,
            data: applications,
            pagination: buildPaginationMetadata(total, page, limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while fetching applications'});
    }
}

// Get a single application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const application = await prisma.application.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
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
                userId: req.user.userId 
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
            where: { id: req.params.id, userId: req.user.userId },
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
            where: { id: req.params.id, userId: req.user.userId }
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