const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/all', authMiddleware, authMiddleware.isAdmin, adminReportController.getAllReports);
router.patch('/status', authMiddleware, authMiddleware.isAdmin, adminReportController.updateReportStatus);

module.exports = router;