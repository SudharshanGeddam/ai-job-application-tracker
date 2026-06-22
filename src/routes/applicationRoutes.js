const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../config/multer");

const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplicationStats,
    analyzeJdMatch,
    generateCoverLetter
} = require("../controllers/applicationController");

const { generateInterviewTips } = require("../controllers/interviewTips.controller");

// Apply the protect middleware to all routes in this router
router.use(protect); 

router.get("/", getAllApplications);
router.get("/stats", getApplicationStats);
router.get("/:id", getApplicationById);
router.post("/", upload.single("resume"), createApplication);
router.put("/:id", upload.single("resume"), updateApplication);
router.delete("/:id", deleteApplication);
router.post("/:id/analyze-jd", analyzeJdMatch);
router.post("/:id/cover-letter", generateCoverLetter);
router.post("/:id/interview-tips", generateInterviewTips);

module.exports = router;