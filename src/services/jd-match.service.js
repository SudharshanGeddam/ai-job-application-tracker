/**
 * Builds the LLM prompt for analyzing the match between a resume and a job description.
 *
 * @param {string} resumeText - extracted text from the candidate's resume
 * @param {string} jdText - the full job description text
 * @returns {string} the prompt string to send to the LLM
 */
const buildJdMatchPrompt = (resumeText, jdText) => {
    return `
You are a senior technical recruiter with experience evaluating candidates for software engineering roles at product companies.

### RESUME
${resumeText}

### JOB DESCRIPTION
${jdText}

### TASK
Think step by step:
1. Identify every required skill, tool, and qualification listed in the job description
2. Check which of those are clearly demonstrated in the resume
3. Note which are absent or unclear in the resume
4. Calculate an overall match score based on that analysis

### OUTPUT CONTRACT
Return ONLY a raw JSON object. No markdown. No code fences. No explanation before or after.

{
  "score": <integer between 0 and 100 — whole numbers only, no decimals>,
  "matchedSkills": ["2 to 15 strings — skills present in both resume and JD"],
  "missingSkills": ["1 to 10 strings — requirements in the JD not evident in the resume"],
  "verdict": "<one sentence, 30 to 200 characters, plain English summary of the overall fit>"
}

Do NOT return a decimal score. Do NOT add keys beyond these four. Do NOT use markdown formatting.
`.trim();
};

module.exports = { buildJdMatchPrompt };
