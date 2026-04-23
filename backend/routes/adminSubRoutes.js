const express = require('express');
const router = express.Router();

const { 
    getAllSubscriptions, 
    getSubscriptionDetail, 
    assignGuideToSubscription, 
    updateSubscriptionStatus, 
    deleteSubscription 
} = require('../controllers/adminSubController');


const authMiddleware = require('../middlewares/auth'); 

router.get('/admin/subscriptions', authMiddleware, authMiddleware.isAdmin, getAllSubscriptions);
router.get('/admin/subscriptions/:subs_id', authMiddleware, authMiddleware.isAdmin, getSubscriptionDetail);
router.put('/admin/subscriptions/:subs_id/assign-guide', authMiddleware, authMiddleware.isAdmin, assignGuideToSubscription);
router.put('/admin/subscriptions/:subs_id/status', authMiddleware, authMiddleware.isAdmin, updateSubscriptionStatus);
router.delete('/admin/subscriptions/:subs_id', authMiddleware, authMiddleware.isAdmin, deleteSubscription);

module.exports = router;