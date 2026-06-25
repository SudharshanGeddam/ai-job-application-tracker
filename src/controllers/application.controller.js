const prisma = require('../config/prisma.config');
const cloudinary = require('../config/cloudinary.config');
const groq = require('../config/groq.config');
const streamifier = require('streamifier');
// FIX: pdf-parse exports a single default function, NOT a named class.
const pdfParse = require('pdf-parse');

const AppError = require('../utils/AppError');
const { callGroqWithRetry } = require('../utils/ai-call.util');
const { parsePaginationParams, buildPaginationMetadata } = require('../utils/pagination.util');
const { createApplicationSchema } = require('../validators/application.validator');
const { parseAndValidateJdMatchResult } = require('../validators/jd-match.validator');
const { parseAndValidateTalkingPoints, parseAndValidateCoverLetterDraft } = require('../validators/cover-letter.validator');
const { buildTalkingPointsPrompt, buildCoverLetterDraftPrompt } = require('../services/cover-letter.service');
const { buildJdMatchPrompt } = require('../services/jd-match.service');

const { Status } = require('@prisma/client');


// ─── Private Helpers ──────────────────────────────────────────────

/**
 * Uploads a Buffer (from Multer memoryStorage) to Cloudinary via a stream.
 * @param {Buffer} buffer
 * @returns {Promise<object>} Cloudinary upload result
 */
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

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * Returns null if parsing fails or the PDF has no extractable text (e.g. scanned image).
 * @param {Buffer} buffer
 * @returns {Promise<string|null>}
 */
const extractTextFromPdfBuffer = async (buffer) => {
    try {
        // FIX: pdfParse is a function — call it directly, don't instantiate with new
        const result = await pdfParse(buffer);
        const text = result.text?.trim();

        if (!text || text.length === 0) {
            throw new Error('PDF contains no extractable text');
        }

        return text;
    } catch (error) {
        console.error('[PDF] Error extracting text:', error.message);
        return null;
    }
};

/**
 * Calls the Groq LLM with retry logic.
 * FIX: was a const at end of file (TDZ — used before declaration). Now placed before usage.
 * @param {string} prompt
 * @returns {Promise<string>} raw LLM response text
 */
const callLLM = async (prompt) => {
    const response = await callGroqWithRetry(
        // FIX: pass a factory function (signal) => ... so callGroqWithRetry can inject AbortSignal
        (signal) => groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }, { signal })
    );

    return response.choices[0].message.content;
};

// ─── GET /api/applications ────────────────────────────────────────
exports.getAllApplications = async (req, res, next) => {
    try {
        const { page, limit, skip, orderBy } = parsePaginationParams(
            req.query,
            ['appliedDate', 'createdAt', 'companyName', 'role']
        );

        const where = { userId: req.user.userId };

        const { status, companyName } = req.query;

        // Validate status filter against the Prisma enum values to prevent bad queries
        if (status) {
            const upperStatus = status.toUpperCase();
            if (!Object.values(Status).includes(upperStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${Object.values(Status).join(', ')}`,
                });
            }
            where.status = upperStatus;
        }

        if (companyName) {
            where.companyName = { contains: companyName, mode: 'insensitive' };
        }

        const [total, applications] = await Promise.all([
            prisma.application.count({ where }),
            prisma.application.findMany({ where, orderBy, skip, take: limit }),
        ]);

        return res.status(200).json({
            success: true,
            data: applications,
            pagination: buildPaginationMetadata(total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/applications/stats ──────────────────────────────────
exports.getApplicationStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;

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

        return res.status(200).json({
            success: true,
            data: { totalApplications, byStatus },
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/applications/:id ────────────────────────────────────
exports.getApplicationById = async (req, res, next) => {
    try {
        const application = await prisma.application.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
        });

        if (!application) {
            return next(new AppError('Application not found', 404));
        }

        return res.status(200).json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/applications ───────────────────────────────────────
exports.createApplication = async (req, res, next) => {
    try {
        const validationResult = createApplicationSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult.error.flatten().fieldErrors,
            });
        }

        const data = validationResult.data;

        let resumeUrl = null;
        let resumeText = null;

        if (req.file) {
            const [uploadResult, extractedText] = await Promise.all([
                uploadBufferToCloudinary(req.file.buffer),
                extractTextFromPdfBuffer(req.file.buffer),
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
            },
        });

        const response = { success: true, data: newApplication };

        if (req.file && resumeText === null) {
            response.warning = 'Resume uploaded, but text could not be extracted. AI features (JD match, cover letter, interview tips) require a text-based PDF.';
        }

        return res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/applications/:id ────────────────────────────────────
exports.updateApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { companyName, role, status, jobLink, notes, appliedDate } = req.body;

        const existing = await prisma.application.findFirst({ where: { id, userId } });
        if (!existing) {
            return next(new AppError('Application not found', 404));
        }

        let resumeUrl;
        let resumeText;

        if (req.file) {
            const [uploadResult, extractedText] = await Promise.all([
                uploadBufferToCloudinary(req.file.buffer),
                extractTextFromPdfBuffer(req.file.buffer),
            ]);
            resumeUrl = uploadResult.secure_url;
            resumeText = extractedText;
        }

        const updateData = {
            ...(companyName !== undefined && { companyName }),
            ...(role !== undefined && { role }),
            ...(status !== undefined && { status }),
            ...(jobLink !== undefined && { jobLink }),
            ...(notes !== undefined && { notes }),
            ...(appliedDate !== undefined && { appliedDate }),
            ...(resumeUrl !== undefined && { resumeUrl }),
            ...(resumeText !== undefined && { resumeText }),
        };

        const application = await prisma.application.update({
            where: { id },
            data: updateData,
        });

        const response = { success: true, data: application };

        if (req.file && resumeText === null) {
            response.warning = 'Resume uploaded, but text could not be extracted. AI features require a text-based PDF.';
        }

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

// ─── DELETE /api/applications/:id ────────────────────────────────
exports.deleteApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const existing = await prisma.application.findFirst({ where: { id, userId } });
        if (!existing) {
            return next(new AppError('Application not found', 404));
        }

        await prisma.application.delete({ where: { id } });

        return res.status(200).json({
            success: true,
            message: 'Application deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/applications/:id/analyze-jd ───────────────────────
exports.analyzeJdMatch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { jdText } = req.body;

        if (!jdText || typeof jdText !== 'string' || jdText.trim().length === 0) {
            return next(new AppError('jdText is required for analysis', 400));
        }

        const application = await prisma.application.findFirst({ where: { id, userId } });
        if (!application) {
            return next(new AppError('Application not found', 404));
        }

        if (!application.resumeText) {
            return next(new AppError(
                'No resume text available. Please upload a text-based PDF resume first.',
                400
            ));
        }

        // buildJdMatchPrompt is now imported from service (was inline const below usage → TDZ)
        const prompt = buildJdMatchPrompt(application.resumeText, jdText.trim());
        const llmResponse = await callLLM(prompt);
        const matchResult = parseAndValidateJdMatchResult(llmResponse);

        if (!matchResult) {
            return next(new AppError('Failed to analyze JD match. Please try again.', 500));
        }

        await prisma.application.update({
            where: { id },
            data: { jdText: jdText.trim(), jdMatchResult: matchResult },
        });

        return res.status(200).json({ success: true, data: matchResult });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/applications/:id/cover-letter ─────────────────────
exports.generateCoverLetter = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const application = await prisma.application.findFirst({ where: { id, userId } });
        if (!application) {
            return next(new AppError('Application not found', 404));
        }

        if (!application.jdMatchResult) {
            return next(new AppError(
                'Please run JD match analysis before generating a cover letter.',
                400
            ));
        }

        // LLM Call #1 — talking points from resume + JD + match analysis
        const talkingPointsPrompt = buildTalkingPointsPrompt(
            application.resumeText,
            application.jdText,
            application.jdMatchResult
        );
        const talkingPointsRaw = await callLLM(talkingPointsPrompt);
        const talkingPoints = parseAndValidateTalkingPoints(talkingPointsRaw);

        if (!talkingPoints) {
            return next(new AppError('Failed to generate talking points. Please try again.', 500));
        }

        // LLM Call #2 — full draft using talking points
        const draftPrompt = buildCoverLetterDraftPrompt(
            talkingPoints,
            application.jdText,
            req.user.name
        );
        const draftRaw = await callLLM(draftPrompt);
        const draft = parseAndValidateCoverLetterDraft(draftRaw);

        if (!draft) {
            return next(new AppError('Failed to generate cover letter draft. Please try again.', 500));
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                coverLetterTalkingPoints: talkingPoints,
                coverLetterDraft: draft,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                talkingPoints: updatedApplication.coverLetterTalkingPoints,
                draft: updatedApplication.coverLetterDraft,
            },
        });
    } catch (error) {
        next(error);
    }
};