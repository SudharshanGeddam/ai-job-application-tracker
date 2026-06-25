const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma.config');
const { hashPassword, comparePassword } = require('../utils/auth.util');
const AppError = require('../utils/AppError');

const { z } = require('zod');

// ─── Validation Schemas ───────────────────────────────────────────
const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(72),
});

const loginSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ─── POST /api/auth/register ──────────────────────────────────────
const register = async (req, res, next) => {
    try {
        // Validate input with Zod (replaces manual if-checks and regex)
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { name, email, password } = result.data;

        // Check for duplicate email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return next(new AppError('An account with this email already exists.', 409));
        }

        // Use the shared utility instead of inlining bcrypt
        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/auth/login ─────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { email, password } = result.data;

        // Use consistent error message to avoid email enumeration
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return next(new AppError('Invalid email or password.', 401));
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return next(new AppError('Invalid email or password.', 401));
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────
// Returns the current authenticated user's profile.
// Requires: Authorization: Bearer <token>
const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                // Never select password
            },
        });

        if (!user) {
            return next(new AppError('User not found.', 404));
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };