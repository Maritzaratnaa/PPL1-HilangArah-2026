const express = require('express');
const router = express.Router();

const { 
    getAllSubscriptions, 
    getSubscriptionDetail, 
    assignGuideToSubscription, 
    updateSubscriptionStatus, 
    deleteSubscription 
} = require('../controllers/adminSubController');

const authMiddleware = require('../middleware/authMiddleware'); 

router.get('', authMiddleware, authMiddleware.isAdmin, getAllSubscriptions);
router.get('/:subs_id', authMiddleware, authMiddleware.isAdmin, getSubscriptionDetail);
router.put('/:subs_id/assign-guide', authMiddleware, authMiddleware.isAdmin, assignGuideToSubscription);
router.put('/:subs_id/status', authMiddleware, authMiddleware.isAdmin, updateSubscriptionStatus);
router.delete('/:subs_id', authMiddleware, authMiddleware.isAdmin, deleteSubscription);

module.exports = router;