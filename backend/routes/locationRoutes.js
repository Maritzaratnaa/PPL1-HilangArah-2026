const express = require('express');
const { getNearestStop } = require('../controllers/locationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/nearest-stop', verifyToken, getNearestStop);

module.exports = router;
