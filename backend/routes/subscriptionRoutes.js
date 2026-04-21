const express = require('express');
const router = express.Router();
const { createSubscription, getMySubscription,cancelSubscription, activateSubscription, getPaymentToken } = require('../controllers/subscriptionController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/', authenticateToken, createSubscription);

router.get('/my-subs', authenticateToken, getMySubscription);
router.delete('/my-subs', authenticateToken, cancelSubscription);
router.put('/activate', authenticateToken, activateSubscription);
router.post('/payment-token', authenticateToken, getPaymentToken);

module.exports = router;
