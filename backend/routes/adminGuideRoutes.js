const express = require('express');
const router = express.Router();

const { 
    getAllGuides, 
    getGuideDetail, 
    createGuide, 
    toggleGuideStatus, 
    deleteGuide 
} = require('../controllers/adminGuideController');

const authMiddleware = require('../middleware/authMiddleware'); 

// Rute Manajemen Pemandu (Semua dilindungi untuk Admin)
router.get('/guides', authMiddleware, authMiddleware.isAdmin, getAllGuides);
router.post('/guides', authMiddleware, authMiddleware.isAdmin, createGuide);
router.get('/guides/:employee_id', authMiddleware, authMiddleware.isAdmin, getGuideDetail);
router.put('/guides/:employee_id/status', authMiddleware, authMiddleware.isAdmin, toggleGuideStatus);
router.delete('/guides/:employee_id', authMiddleware, authMiddleware.isAdmin, deleteGuide);

module.exports = router;