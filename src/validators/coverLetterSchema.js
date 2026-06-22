const { z } = require('zod');

// --- Talking Points ---

const talkingPointSchema = z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    evidence: z.array(z.string()),
    priority: z.number().int().min(1),
    relatedToSkill: z.string().min(1),
});

const talkingPointsSchema = z.object({
    talkingPoints: z.array(talkingPointSchema).min(1),
});

function parseAndValidateTalkingPoints(llmRawText) {
    let parsed;
    try {
        parsed = JSON.parse(llmRawText);
    } catch (error) {
        return null;
    }

    const result = talkingPointsSchema.safeParse(parsed);
    if (!result.success) {
        console.error('Talking points validation errors:', result.error.issues);
        return null;
    }
    return result.data.talkingPoints;
}

// --- Cover Letter Draft ---

const coverLetterDraftSchema = z.object({
    greeting: z.string().min(1),
    opening: z.string().min(1),
    body: z.array(z.string()).min(1),
    closing: z.string().min(1),
    signature: z.string().min(1),
});

function parseAndValidateCoverLetterDraft(llmRawText) {
    let parsed;
    try {
        parsed = JSON.parse(llmRawText);
    } catch (error) {
        return null;
    }

    const result = coverLetterDraftSchema.safeParse(parsed);
    if (!result.success) {
        console.error('Cover letter draft validation errors:', result.error.issues);
        return null;
    }
    return result.data;
}

module.exports = {
    talkingPointsSchema,
    parseAndValidateTalkingPoints,
    coverLetterDraftSchema,
    parseAndValidateCoverLetterDraft,
};