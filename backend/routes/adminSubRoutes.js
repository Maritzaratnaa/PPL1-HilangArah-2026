const express = require('express');
const router = express.Router();

// Import controller admin yang baru dibuat
const { 
    getAllSubscriptions, 
    getSubscriptionDetail, 
    assignGuideToSubscription, 
    updateSubscriptionStatus, 
    deleteSubscription 
} = require('../controllers/adminSubController');

// Import middleware autentikasi (pastikan kamu punya middleware yang mengecek role === 'Admin')
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Daftarkan rute-rutenya (semua dilindungi authenticateToken dan isAdmin)
router.get('/admin/subscriptions', authenticateToken, isAdmin, getAllSubscriptions);
router.get('/admin/subscriptions/:subs_id', authenticateToken, isAdmin, getSubscriptionDetail);
router.put('/admin/subscriptions/:subs_id/assign-guide', authenticateToken, isAdmin, assignGuideToSubscription);
router.put('/admin/subscriptions/:subs_id/status', authenticateToken, isAdmin, updateSubscriptionStatus);
router.delete('/admin/subscriptions/:subs_id', authenticateToken, isAdmin, deleteSubscription);

module.exports = router;