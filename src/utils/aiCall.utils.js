const getBackoffMs = (attempt) => {
    const baseDelay = 1000 * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 500);
    return baseDelay + jitter;
}

const callGroqWithRetry =  async (groq, options = {}) => {
    const maxRetries = options.maxRetries || 3;
    const timeoutMs = options.timeoutMs || 15000;
    const retryableStatusCodes = [429, 500, 503];

    for(let attempt = 1; attempt <= maxRetries; attempt++) {
        let timer = null;
        
        try{
            const controller = new AbortController();

            timer = setTimeout(() => {
                controller.abort();
            }, timeoutMs);

            const result = await groqCallFn(controller.signal);

            clearTimeout(timer);
            return result;
        } catch (error) {
            clearTimeout(timer);

            const isLastAttempt = attempt === maxRetries;

        // Timeout
        if(error.name === 'AbortError') {
            console.error(`[AI] Attempt ${attempt} timed out after ${timeoutMs}ms.`);
            if(isLastAttempt) {
                await new Promise(resolve => setTimeout(resolve, getBackoffMs(attempt)));
                continue;
            }
            const err = new Error(`AI call timed out. Please try again.`);
            err.statusCode = 504;
            throw err;
        }

        //Retryable HTTP errors
        if (retryableStatusCodes.includes(error.status)) {
            console.error(`[AI] Attempt ${attempt} failed with status ${error.status}. Error: ${error.message}`);
            if (isLastAttempt) {
                await new Promise(resolve => setTimeout(resolve, getBackoffMs(attempt)));
                continue;
            }
            const err = new Error(`AI service is currently unavailable. Please try again.`);
            err.statusCode = 502;
            throw err;
        } else {
            // Non-retryable error, throw immediately
            throw error;
        }
    }
    throw new Error(`AI service is currently unavailable after ${maxRetries} attempts. Please try again later.`);
    }
};

module.exports = {
    callGroqWithRetry
};