const express = require('express');
const router = express.Router();
const {createReport, getMyReports} = require('../controllers/reportController');
const {verifyToken} = require('../middleware/authMiddleware');

router.use(verifyToken);
router.post('/', createReport);
router.get('/my-reports', getMyReports);

module.exports = router;