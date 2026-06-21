const prisma = require('../config/prisma');
const { createApplicationSchema } = require('../validators/applicationValidator');
const { parsePaginationParams, buildPaginationMetadata } = require('../utils/pagination.utils');
const cloudinary = require('../config/cloudinary.config');
const streamifier = require('streamifier');
const { PDFParse } = require('pdf-parse');
const groq = require('../config/groq.config');
const { parseAndValidateJdMatchResult } = require('../validators/jdMatchResultSchema');

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

// Extract text content from a PDF buffer using pdf-parse
const extractTextFromPdfBuffer = async (buffer) => {
    try {
        const parser =  new PDFParse({data: buffer});
        const result = await parser.getText();
        let text = result.text.trim();

        if (text.length === 0) {
            throw new Error('PDF contains no extractable text');
        }

        return text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return null;
    }
}
    
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

        // If a resume file was uploaded, send it to Cloudinary and get the real URL. Also attempt to extract text content if it's a PDF.
        let resumeUrl = null;
        let resumeText = null;
        if (req.file) {
            const [uploadResult, extractedText] = await Promise.all([
                uploadBufferToCloudinary(req.file.buffer),
                extractTextFromPdfBuffer(req.file.buffer)
            ]);
            resumeUrl = uploadResult.secure_url;
            resumeText = extractedText;
        }

        const newApplication = await prisma.application.create({
            data: {
                ...data,
                resumeUrl,
                resumeText,
                userId: req.user.userId,
            }
        });

        const response = {success: true, data: newApplication};

        if (req.file && resumeText === null) {
            response.warning = 'Resume uploaded, but text could not be extracted. AI features like JD match and feedback won\'t work for this resume until you re-upload a text-based PDF.';
        }

        res.status(201).json(response);
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
        let resumeText = undefined;
        if (req.file) {
            const [uploadResult, extractedText] = await Promise.all([
                uploadBufferToCloudinary(req.file.buffer),
                extractTextFromPdfBuffer(req.file.buffer)
            ]);
            resumeUrl = uploadResult.secure_url;
            resumeText = extractedText;
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
                ...(resumeText !== undefined && { resumeText }), // Only update resumeText if a new file is provided
            }
        });

        const response = {success: true, data: application};

        if (req.file && resumeText === null) {
            response.warning = 'Resume uploaded, but text could not be extracted. AI features like JD match and feedback won\'t work for this resume until you re-upload a text-based PDF.';
        }
        res.json(response);
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
exports.analyzeJdMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        let jdText = req.body.jdText;

        // Validate input
        if (!jdText) {
            return res.status(400).json({ success: false, message: 'JD text is required for analysis' });
        }

        // confirm this application exists AND belongs to this user
        const application = await prisma.application.findFirst({where:  { id, userId }});
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if(application.resumeText === null){
            return res.status(400).json({ success: false, message: 'No resume text available for this application. Please upload a text-based PDF resume first.' });
        }

        // Build the prompt and call the LLM
        const prompt = buildJdMatchPrompt(application.resumeText, jdText);
        const llmResponse = await callLLM(prompt);

        // Parse the LLM response and return insights to the frontend
        const matchResult = parseAndValidateJdMatchResult(llmResponse);

        if (!matchResult) {
            return res.status(500).json({ success: false, message: 'Failed to analyze JD match. Please try again.' });
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                jdText,
                jdMatchResult: matchResult,
            }
        });
        res.status(200).json({ success: true, data: matchResult });
    } catch (error) {
        console.error('Error analyzing JD match:', error);
        res.status(500).json({ success: false, message: 'Server error while analyzing JD match' });
    }
}

const buildJdMatchPrompt = (resumeText, jdText) => {
    return `You are an expert technical recruiter. Compare the following resume against the job description and analyze the match.

    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jdText}

    Respond with a JSON object in EXACTLY this shape, with no extra keys:
    {
        "score": <integer 0-100, overall match percentage>,
        "matchedSkills": [<array of strings - skills/requirements found in BOTH>],
        "missingSkills": [<array of strings - requirements in the JD but not evident in the resume>],
        "verdict": "<one sentence, plain language summary of the fit>"
    }
        `;
}

const callLLM = async (prompt) => {
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "user", content: prompt }
        ],
        response_format: {
            type: "json_object",
        },
    });

    const rawText = response.choices[0].message.content;
    return rawText;
}