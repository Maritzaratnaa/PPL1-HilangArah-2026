const express = require('express');
const router = express.Router();
const authController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, authController.getProfile);
router.put('/', authMiddleware, authController.updateProfile);

module.exports = router;