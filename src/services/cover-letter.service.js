const buildTalkingPointsPrompt = (resumeText, jdText, jdMatchResult) => {
    return `You are an expert career coach helping a candidate prepare for a job application.

    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jdText}

    MATCH ANALYSIS:
    Score: ${jdMatchResult.score}
    Matched Skills: ${jdMatchResult.matchedSkills.join(', ')}
    Missing Skills: ${jdMatchResult.missingSkills.join(', ')}
    Verdict: ${jdMatchResult.verdict}

    Based on this analysis, identify the 2-3 STRONGEST talking points the candidate should
    emphasize in their cover letter. Each talking point must be backed by specific evidence
    from the resume. Do not invent evidence not present in the resume.

    Respond with a JSON object in EXACTLY this shape, with no extra keys:
    {
        "talkingPoints": [
            {
                "title": "<short label, 3-6 words>",
                "summary": "<1-2 sentences on why this matters for the role>",
                "evidence": [<array of strings, specific evidence from the resume>],
                "priority": <integer, 1 = highest priority>,
                "relatedToSkill": "<which matched skill this maps to>"
            }
        ]
    }
        `;
}

const buildCoverLetterDraftPrompt = (talkingPoints, jdText, candidateName) => {
    return `You are a professional cover letter writer.

    JOB DESCRIPTION:
    ${jdText}

    KEY TALKING POINTS (ordered by priority):
    ${JSON.stringify(talkingPoints, null, 2)}

    Write a compelling, concise cover letter using these talking points. Do not invent
    facts beyond what's in the talking points. Keep the tone professional but not stiff.

    Respond with a JSON object in EXACTLY this shape, with no extra keys:
    {
        "greeting": "<e.g. 'Dear Hiring Manager,'>",
        "opening": "<single hook paragraph>",
        "body": [<array of 1-2 paragraph strings>],
        "closing": "<call-to-action paragraph>",
        "signature": "<e.g. 'Sincerely, ${candidateName || '[Your Name]'}'>"
    }
        `;
}

module.exports = { buildTalkingPointsPrompt, buildCoverLetterDraftPrompt };