const prisma = require('../config/prisma');
const groq = require('../config/groq.config');
const { parseAndValidateInterviewTips } = require('../validators/interviewTips.validator');

async function generateInterviewTips(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    const application = await prisma.application.findFirst({
        where: { id, userId },
    });

    if (!application) {
        return res.status(404).json({ 
            success: false,
            data: null,
            message: "Application not found" });
    }

    if(!application.jdMatchResult) {
        return res.status(400).json({
            success: false,
            data: null,
            message: "JD match analysis not found for this application. Please analyze the JD match first."
        });
    }

    const jd = application.jdMatchResult;

    const prompt = `
You are an expert interview coach. Based on the following job match analysis, generate targeted interview preparation tips.

Job Title: ${application.role}
Match Score: ${jd.score}%
Matched Skills: ${jd.matchedSkills.length > 0 ? jd.matchedSkills.join(", ") : "None"}
Missing Skills: ${jd.missingSkills.length > 0 ? jd.missingSkills.join(", ") : "None"}
Verdict: ${jd.verdict}

Return a JSON object with exactly these four keys:
- technicalTips: array of strings (tips to prepare for technical rounds)
- behavioralTips: array of strings (tips for HR/behavioral rounds)
- questionsToAsk: array of strings (smart questions the candidate should ask the interviewer)
- redFlags: array of strings (weak areas the candidate should prepare extra hard for)

Return only the JSON object. No explanation outside it.
`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: {
            type: "json_object"
        }
    });

    const rawText = completion.choices[0].message.content;
    const parsed = JSON.parse(rawText);
    const interviewTips = parseAndValidateInterviewTips(parsed);

    if(!interviewTips) {
        return res.status(500).json({
            success: false,
            data: null,
            message: "Failed to generate valid interview tips. Please try again."
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            applicationId: id,
            jobTitle: application.role,
            interviewTips,
        },
        message: "Interview tips generated successfully"
    });
}

module.exports = {
    generateInterviewTips
};