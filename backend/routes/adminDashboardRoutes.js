const express = require('express');
const router = express.Router();

const { getDashboardStats } = require('../controllers/adminDashboardController');
const { changePassword } = require('../controllers/adminManageController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/dashboard-stats', authMiddleware.verifyToken, authMiddleware.isAdmin, getDashboardStats);
router.put('/change-password', authMiddleware.verifyToken, authMiddleware.isAdmin, changePassword);

module.exports = router;