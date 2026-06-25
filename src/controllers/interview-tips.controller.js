const prisma = require('../config/prisma.config');
const groq = require('../config/groq.config');
const AppError = require('../utils/AppError');
const { parseAndValidateInterviewTips } = require('../validators/interview-tips.validator');
const { callGroqWithRetry } = require('../utils/ai-call.util');

/**
 * Builds the LLM prompt for generating tailored interview tips.
 * Extracted here so the controller stays focused on HTTP logic.
 */
const buildInterviewTipsPrompt = (application) => {
    const jd = application.jdMatchResult;
    const matchedSkills = jd.matchedSkills?.length > 0 ? jd.matchedSkills.join(', ') : 'None identified';
    const missingSkills = jd.missingSkills?.length > 0 ? jd.missingSkills.join(', ') : 'None identified';

    return `
You are a senior technical interview coach specializing in software engineering roles at product companies and startups.

### CANDIDATE PROFILE
Job Title: ${application.role}
Match Score: ${jd.score}%
Matched Skills: ${matchedSkills}
Missing Skills: ${missingSkills}
Verdict: ${jd.verdict}

### TASK
Think step by step:
1. Identify the technical gaps from the missing skills above
2. Identify behavioral risks based on the match score and verdict
3. Use both to generate targeted, specific advice for this exact role and profile

### OUTPUT CONTRACT
Return ONLY a raw JSON object. No markdown. No code fences. No explanation before or after.

{
  "technicalTips": ["3 to 6 strings — each 1 to 3 sentences, specific to the role and missing skills"],
  "behavioralTips": ["2 to 5 strings — each 1 to 3 sentences, addressing risks from the match score"],
  "questionsToAsk": ["3 to 5 strings — phrased as natural questions the candidate asks the interviewer"],
  "redFlags": ["1 to 4 strings — each 1 to 2 sentences, naming the exact weak areas to prepare hardest"]
}

Do NOT add keys beyond these four.
Do NOT return fewer items than the minimum stated.
Do NOT give generic advice. Every tip must reference the specific role or skills listed above.
`.trim();
};

// POST /api/applications/:id/interview-tips
async function generateInterviewTips(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const application = await prisma.application.findFirst({
            where: { id, userId },
        });

        if (!application) {
            return next(new AppError('Application not found', 404));
        }

        if (!application.jdMatchResult) {
            return next(new AppError(
                'JD match analysis not found. Please run JD match analysis first.',
                400
            ));
        }

        const prompt = buildInterviewTipsPrompt(application);

        const completion = await callGroqWithRetry(
            (signal) => groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            }, { signal })
        );

        const rawText = completion.choices[0].message.content;
        const parsed = JSON.parse(rawText);
        const interviewTips = parseAndValidateInterviewTips(parsed);

        if (!interviewTips) {
            return next(new AppError('Failed to generate valid interview tips. Please try again.', 500));
        }

        return res.status(200).json({
            success: true,
            message: 'Interview tips generated successfully',
            data: {
                applicationId: id,
                jobTitle: application.role,
                interviewTips,
            },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { generateInterviewTips };