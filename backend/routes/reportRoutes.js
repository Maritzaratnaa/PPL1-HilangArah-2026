const express = require('express');
const router = express.Router();
const { createReport, getMyReports } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createReport);
router.get('/my-reports', getMyReports);

module.exports = router;