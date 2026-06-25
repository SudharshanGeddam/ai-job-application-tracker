/**
 * Calculates exponential backoff delay with jitter.
 * @param {number} attempt - current attempt number (1-indexed)
 * @returns {number} milliseconds to wait before next attempt
 */
const getBackoffMs = (attempt) => {
    const baseDelay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, ...
    const jitter = Math.floor(Math.random() * 500);    // add randomness to avoid thundering herd
    return baseDelay + jitter;
};

/**
 * Calls a Groq API factory function with retry, exponential backoff, and per-attempt timeout.
 *
 * @param {(signal: AbortSignal) => Promise<any>} groqCallFn
 *   A function that accepts an AbortSignal and returns a Groq API call promise.
 *   Example: (signal) => groq.chat.completions.create({ ..., signal })
 *
 * @param {object} [options]
 * @param {number} [options.maxRetries=3]   - maximum number of attempts
 * @param {number} [options.timeoutMs=15000] - per-attempt timeout in ms
 *
 * @returns {Promise<any>} - the Groq API response
 * @throws {Error} with statusCode 504 on timeout, 502 on service unavailability
 */
const callGroqWithRetry = async (groqCallFn, options = {}) => {
    const maxRetries = options.maxRetries || 3;
    const timeoutMs = options.timeoutMs || 15000;
    const retryableStatusCodes = [429, 500, 503];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let timer = null;

        try {
            const controller = new AbortController();

            // Abort the request if it takes too long
            timer = setTimeout(() => controller.abort(), timeoutMs);

            // Call the factory function with the abort signal
            const result = await groqCallFn(controller.signal);

            clearTimeout(timer);
            return result;

        } catch (error) {
            clearTimeout(timer);

            const isLastAttempt = attempt === maxRetries;

            // Timed out
            if (error.name === 'AbortError') {
                console.error(`[AI] Attempt ${attempt}/${maxRetries} timed out after ${timeoutMs}ms.`);
                if (isLastAttempt) {
                    const err = new Error('AI call timed out after maximum retries. Please try again.');
                    err.statusCode = 504;
                    throw err;
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, getBackoffMs(attempt)));
                continue;
            }

            // Retryable HTTP errors (rate limit, server error, service unavailable)
            if (retryableStatusCodes.includes(error.status)) {
                console.error(`[AI] Attempt ${attempt}/${maxRetries} failed with status ${error.status}: ${error.message}`);
                if (isLastAttempt) {
                    const err = new Error('AI service is currently unavailable. Please try again later.');
                    err.statusCode = 502;
                    throw err;
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, getBackoffMs(attempt)));
                continue;
            }

            // Non-retryable error — propagate immediately
            throw error;
        }
    }

    // Should never reach here, but safety net
    const err = new Error(`AI service unavailable after ${maxRetries} attempts.`);
    err.statusCode = 502;
    throw err;
};

module.exports = { callGroqWithRetry };