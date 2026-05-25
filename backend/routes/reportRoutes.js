const express = require('express');
const router = express.Router();
const { createReport, getMyReports, getLocationOptions } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/locations', getLocationOptions);
router.get('/my-reports', getMyReports);
router.post('/', createReport);

module.exports = router;