/**
 * validateRequest — a factory that returns an Express middleware
 * which validates req.body against a Zod schema.
 *
 * Usage in routes:
 *   router.post('/register', validateRequest(registerSchema), register);
 *
 * On success:  calls next() — the validated/coerced data is at req.validatedBody
 * On failure:  returns 400 with field-level error details
 *
 * @param {import('zod').ZodSchema} schema - a Zod schema to validate against
 * @param {'body'|'query'|'params'} [target='body'] - which part of the request to validate
 */
const validateRequest = (schema, target = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors,
            });
        }

        // Attach the parsed (and potentially coerced/transformed) data
        // so controllers don't need to parse again
        req.validatedBody = result.data;
        next();
    };
};

module.exports = validateRequest;
