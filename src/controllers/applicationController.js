// Temporary in-memory storage for applications
let applications = [
    {
        id: 1,
        companyName: "Google",
        role: "Software Engineer",
        status: "Applied",
        appliedDate: "2026-01-15"
    },
    {
        id: 2,
        companyName: "Facebook",
        role: "Data Scientist",
        status: "Interviewing",
        appliedDate: "2026-02-10"
    },
];

let nextId = 3;

const getAllApplications = (req, res) => {
    res.status(200).json({
        success: true,
        data: applications
    });
};

const getApplicationById = (req, res) => {
    const id = parseInt(req.params.id);

    const application = applications.find(app => app.id === id);
    if(!application) {
        return res.status(404).json({
            success: false,
            message: `Application with id ${id} not found`
        });
    }

    res.status(200).json({
        success: true,
        data: application
    });
};

const createApplication = (req, res) => {
    const { companyName, role, status, appliedDate } = req.body;

    if(!companyName || !role) {
        return res.status(400).json({
            success: false,
            message: `Company name and role are required`
        });
    }

    const newApplication = {
        id: nextId++,
        companyName,
        role,
        status: status || "Applied",
        appliedDate: appliedDate || new Date().toISOString().split('T')[0]
    }

    applications.push(newApplication);

    res.status(201).json({
        success: true,
        data: newApplication
    });
};

const updateApplication = (req, res) => {
    const id = parseInt(req.params.id);

    const index = applications.findIndex(app => app.id === id);

    if(index === -1) {
        return res.status(404).json({
            success: false,
            message: `Application with id ${id} not found`
        });
    }

    applications[index] = {
        ...applications[index],
        ...req.body
    };  

    res.status(200).json({
        success: true,
        data: applications[index]
    });
};

const deleteApplication = (req, res) => {
    const id = parseInt(req.params.id);

    const index = applications.findIndex(app => app.id === id);

    if(index === -1) {
        return res.status(404).json({
            success: false,
            message: `Application with id ${id} not found`
        });
    }

    const deleted = applications.splice(index, 1)[0];

    res.status(200).json({
        success: true,
        data: deleted,
        message: `Application with id ${id} deleted successfully`
    });
};

module.exports = {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
};