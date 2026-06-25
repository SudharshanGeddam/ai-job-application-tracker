const { z } = require('zod');

const jdMatchResultSchema = z.object({
    score: z.number().int().min(0).max(100),
    matchedSkills: z.array(z.string().min(2)).max(20),
    missingSkills: z.array(z.string().min(2)).max(20),
    verdict: z.string().min(5).max(500),
});

function parseAndValidateJdMatchResult(llmRawText) {
    let parsed;
    try {
        parsed = JSON.parse(llmRawText);
    } catch (error) {
        return null;
    }

    const result = jdMatchResultSchema.safeParse(parsed);
    if (!result.success) {
        console.error('Validation errors:', result.error.issues);
        return null;
    }
    return result.data;
}

module.exports = {
    jdMatchResultSchema,
    parseAndValidateJdMatchResult
};