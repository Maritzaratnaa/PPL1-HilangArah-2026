const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Pastikan mapping nama fungsi sesuai dengan yang di-export di controller
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);

module.exports = router;