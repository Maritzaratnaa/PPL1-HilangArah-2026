const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 

router.get('/', verifyToken, isAdmin, adminUserController.getAllUsers);
router.put('/:user_id/status', verifyToken, isAdmin, adminUserController.toggleUserStatus);
router.delete('/:user_id', verifyToken, isAdmin, adminUserController.deleteUser);

module.exports = router;