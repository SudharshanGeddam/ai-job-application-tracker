const { z } = require('zod');

const jdMatchResultSchema = z.object({
    score: z.number().min(0).max(100),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    verdict: z.string().min(1),
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