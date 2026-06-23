const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    createReminder,
    getAllReminders,
    getReminderById,
    updateReminder,
    deleteReminder
} = require('../controllers/reminderController');

router.use(protect);

router.post('/', createReminder);
router.get('/', getAllReminders);
router.get('/:id', getReminderById);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;