const express = require('express');
const router = express.Router();

const { 
    getAllSubscriptions, 
    getSubscriptionDetail, 
    assignGuideToSubscription, 
    updateSubscriptionStatus, 
    deleteSubscription 
} = require('../controllers/adminSubController');

const {verifyToken, isAdmin} = require('../middleware/authMiddleware'); 

router.get('', verifyToken, isAdmin, getAllSubscriptions);
router.get('/:subs_id', verifyToken, isAdmin, getSubscriptionDetail);
router.put('/:subs_id/assign-guide', verifyToken, isAdmin, assignGuideToSubscription);
router.put('/:subs_id/status', verifyToken, isAdmin, updateSubscriptionStatus);
router.delete('/:subs_id', verifyToken, isAdmin, deleteSubscription);

module.exports = router;