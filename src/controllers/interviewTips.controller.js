const prisma = require('../config/prisma');
const groq = require('../config/groq.config');
const { parseAndValidateInterviewTips } = require('../validators/interviewTips.validator');
const { callGroqWithRetry } = require('../utils/aiCall.utils');

async function generateInterviewTips(req, res) {
try {
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
    const matchedSkills = jd.matchedSkills?.length > 0 ? jd.matchedSkills.join(", " ) : "None identified";
    const missingSkills = jd.missingSkills?.length > 0 ? jd.missingSkills.join(", ") : "None identified";
    const prompt = `
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
`;

    const completion = await callGroqWithRetry(
    (signal) => groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: {
            type: "json_object"
        },
        signal,
    })
);

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
} catch (error) {
    console.error("Error generating interview tips:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        data: null,
        message: "An error occurred while generating interview tips. Please try again later."
    });
}
}

module.exports = {
    generateInterviewTips
};