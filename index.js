// index.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const logger = require('./src/middlewares/logger');
const applicationRoutes = require("./src/routes/applicationRoutes");

// Load environment variables from .env file
dotenv.config();

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
