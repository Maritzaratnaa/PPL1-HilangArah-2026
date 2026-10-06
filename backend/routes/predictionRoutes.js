const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getRoutePrediction } = require('../controllers/predictionController');

router.post('/', getRoutePrediction);

module.exports = router;