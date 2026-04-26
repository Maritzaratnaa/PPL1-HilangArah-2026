const express = require('express');
const router = express.Router();

const { getDashboardStats } = require('../controllers/adminDashboardController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/dashboard-stats', authMiddleware, authMiddleware.isAdmin, getDashboardStats);

module.exports = router;