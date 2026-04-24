const express = require('express');
const router = express.Router();
const {assignAdminRole} = require('../controllers/adminRoleController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/role/assign', authMiddleware, authMiddleware.isMainAdmin, assignAdminRole);

module.exports = router;