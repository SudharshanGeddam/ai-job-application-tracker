const prisma = require('../config/prisma');

exports.getAllApplications = async (req, res) => {
    try {
        const applications = await prisma.application.findMany();
        res.json({success: true, data: applications});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Failed to fetch applications'});
    }
}