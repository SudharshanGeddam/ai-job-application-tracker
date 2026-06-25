const multer = require('multer');

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for processing

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and WEBP are allowed.'), false);
    }
};

const limits = { 
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;