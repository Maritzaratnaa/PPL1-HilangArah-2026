const express = require('express');
const router = express.Router();
const {getAllAdmins,
       assignAdminRole,
       updateAdmin, 
       removeAdminAccess} = require('../controllers/adminManageController');
const {verifyToken, isAdmin, isMainAdmin} = require('../middleware/authMiddleware');

router.get('/', verifyToken, isAdmin, getAllAdmins);

router.post('/assign', verifyToken, isMainAdmin, assignAdminRole);
router.put('/:id', verifyToken, isMainAdmin, updateAdmin);
router.delete('/:id', verifyToken, isMainAdmin, removeAdminAccess);

module.exports = router;