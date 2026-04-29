const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const {verifyToken, isAdmin} = require('../middleware/authMiddleware');

router.get('/all', verifyToken, isAdmin, adminReportController.getAllReports);
router.put('/status', verifyToken, isAdmin, adminReportController.updateReportStatus);
router.delete('/:id',verifyToken, isAdmin, adminReportController.deleteReport);

module.exports = router;