const express = require('express');
const router = express.Router();

const { 
    getAllGuides, 
    getGuideDetail, 
    createGuide, 
    toggleGuideStatus, 
    updateGuide,
    deleteGuide
} = require('../controllers/adminGuideController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 

router.get('/', verifyToken, isAdmin, getAllGuides);
router.post('/', verifyToken, isAdmin, createGuide);
router.get('/:employee_id', verifyToken, isAdmin, getGuideDetail);
router.put('/:employee_id', verifyToken, isAdmin, updateGuide); 
router.put('/:employee_id/status', verifyToken, isAdmin, toggleGuideStatus);
router.delete('/:employee_id', verifyToken, isAdmin, deleteGuide);

module.exports = router;