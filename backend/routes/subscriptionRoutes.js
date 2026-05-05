const express = require('express');
const router = express.Router();
const { createSubscription, getMySubscription,cancelSubscription, activateSubscription, getPaymentToken } = require('../controllers/subscriptionController');
const {verifyToken} = require('../middleware/authMiddleware');

router.post('/',verifyToken, createSubscription);

router.get('/my-subs',verifyToken, getMySubscription);
router.delete('/my-subs',verifyToken, cancelSubscription);
router.put('/activate',verifyToken, activateSubscription);
router.post('/payment-token',verifyToken, getPaymentToken);

module.exports = router;
