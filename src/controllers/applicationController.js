const prisma = require('../config/prisma');
const { createApplicationSchema } = require('../validators/applicationValidator');
const { parsePaginationParams, buildPaginationMetadata } = require('../utils/pagination.utils');
const cloudinary = require('../config/cloudinary.config');
const streamifier = require('streamifier');

// Helper: uploads a Buffer (from Multer memoryStorage) to Cloudinary via a stream
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'resumes', resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};
    
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

        // If a resume file was uploaded, send it to Cloudinary and get the real URL
        let resumeUrl = null;
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            resumeUrl = result.secure_url;
        }

        const newApplication = await prisma.application.create({
            data: {
                ...data,
                resumeUrl,
                userId: req.user.userId,
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
        const { id } = req.params;
        const userId = req.user.userId;
        const { companyName, role, status, jobLink, notes, appliedDate } = req.body;

        // Step 1: confirm this application exists AND belongs to this user
        const existing = await prisma.application.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // If a new resume file was uploaded, send it to Cloudinary and get the real URL
        let resumeUrl = undefined; // undefined = "don't touch this field"
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer);
            resumeUrl = result.secure_url;
        }

        // Step 2: ownership confirmed, safe to update by id alone
        const application = await prisma.application.update({
            where: { id },
            data: {
                companyName,
                role,
                status,
                jobLink,
                notes,
                appliedDate,
                ...(resumeUrl !== undefined && { resumeUrl }), // Only update resumeUrl if a new file is provided
            }
        });
        res.json({success: true, data: application});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while updating application'});
    }
}

// Delete an application by ID
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Step 1: confirm this application exists AND belongs to this user
        const existing = await prisma.application.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Step 2: ownership confirmed, safe to delete by id alone
        await prisma.application.delete({
            where: { id }
        });

        res.status(200).json({success: true, message: 'Application deleted successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Server error while deleting application'});
    }
}

exports.getApplicationStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Group applications by status and count them
        const statusGroups = await prisma.application.groupBy({
            by: ['status'],
            where: { userId },
            _count: { status: true },
        });

        const byStatus = {};
        let totalApplications = 0;

        for (const group of statusGroups) {
            byStatus[group.status] = group._count.status;
            totalApplications += group._count.status;
        }

        res.status(200).json({ success: true, data: {  totalApplications , byStatus} });
    } catch (error) {
        console.error('Error fetching application stats:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching application stats' });
    }
}