const express = require('express');
const router = express.Router();

const authController = require('../controllers/profileController'); 
const profileController = require('../controllers/profileController'); 
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, profileController.getProfile);
router.put('/', authMiddleware.verifyToken, profileController.updateProfile);
router.put('/password', authMiddleware.verifyToken, profileController.updatePassword);

module.exports = router;