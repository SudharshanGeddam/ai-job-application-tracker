const { z } = require("zod");

const interviewTipsSchema = z.object({
    technicalTips: z.array(z.string().min(20)).min(3).max(6),
    behavioralTips: z.array(z.string().min(20)).min(2).max(5),
    questionsToAsk: z.array(z.string().min(10)).min(3).max(5),
    redFlags: z.array(z.string().min(20)).min(1).max(4),
});

function parseAndValidateInterviewTips(raw) {
    const result = interviewTipsSchema.safeParse(raw);

    if(!result.success) {
        console.error("Interview tips validation failed:", result.error.flatten().fieldErrors);
        return null;
    }

    return result.data;
}

module.exports = { 
    parseAndValidateInterviewTips
};