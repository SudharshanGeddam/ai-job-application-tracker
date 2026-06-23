// index.js
const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.config();

const express = require('express');
const cors = require('cors');
const logger = require('./src/middlewares/logger');
const applicationRoutes = require("./src/routes/applicationRoutes");
const authRoutes = require("./src/routes/authRoutes");
const reminderRoutes = require("./src/routes/reminderRoutes");

// Create an Express application
const app = express();

// Middleware
app.use(cors());
// Built-in middleware to parse JSON bodies
app.use(express.json());


app.use(logger);

// Sample route
app.get('/', (req, res) => {
    res.json({
        message: 'Job Tracker API is running',
    });
});

// Route: GET /health
app.get('/health', (req, res) => {
    res.status(200).json({status: 'ok', uptime: process.uptime()});
});

app.use("/api/applications", applicationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reminders", reminderRoutes);

// Background jobs
require("./src/jobs/staleApplicationJob");
require("./src/jobs/remainderJob");

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
