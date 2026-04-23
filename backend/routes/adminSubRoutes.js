const express = require('express');
const router = express.Router();

const { 
    getAllSubscriptions, 
    getSubscriptionDetail, 
    assignGuideToSubscription, 
    updateSubscriptionStatus, 
    deleteSubscription 
} = require('../controllers/adminSubController');

const { authenticateToken, isAdmin } = require('../middlewares/auth'); 

router.get('/admin/subscriptions', authenticateToken, isAdmin, getAllSubscriptions);
router.get('/admin/subscriptions/:subs_id', authenticateToken, isAdmin, getSubscriptionDetail);
router.put('/admin/subscriptions/:subs_id/assign-guide', authenticateToken, isAdmin, assignGuideToSubscription);
router.put('/admin/subscriptions/:subs_id/status', authenticateToken, isAdmin, updateSubscriptionStatus);
router.delete('/admin/subscriptions/:subs_id', authenticateToken, isAdmin, deleteSubscription);

module.exports = router;