const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
} = require("../controllers/applicationController");

// Apply the protect middleware to all routes in this router
router.use(protect); 

router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;