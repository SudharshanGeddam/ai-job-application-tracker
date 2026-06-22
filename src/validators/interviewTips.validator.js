const { z } = require("zod");

const interviewTipsSchema = z.object({
    technicalTips: z.array(z.string()),
    behavioralTips: z.array(z.string()),
    questionsToAsk: z.array(z.string()),
    redFlags: z.array(z.string()),
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