const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if(!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.' });
        }

        if(password.length < 8) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 8 characters long.' });
        }

        const emailRegex =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide a valid email address.' });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if(existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'An account with this email already exists.' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save the new user to the database
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
            }
        })
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
        });
    }

}

const login =  async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if(!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                }
            }
        }); 
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
        });
    }
}

module.exports = {
    register,
    login
};