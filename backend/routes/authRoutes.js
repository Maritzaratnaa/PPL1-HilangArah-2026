const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Menyambungkan rute ke fungsi di controller
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;