const express = require("express");
const router = express.Router();

const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
} = require("../controllers/applicationController");

router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;