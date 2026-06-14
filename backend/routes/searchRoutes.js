const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const {verifyToken} = require('../middleware/authMiddleware');

router.get('/', verifyToken, searchController.searchRoutes);
router.get('/suggestions', authMiddleware, getStopSuggestions);

module.exports = router;