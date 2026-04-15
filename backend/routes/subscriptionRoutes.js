const express = require('express');
const router = express.Router();
// Pastikan getMySubscription di-import
const { createSubscription, getMySubscription,cancelSubscription, activateSubscription } = require('../controllers/subscriptionController');
const authenticateToken = require('../middleware/authMiddleware');

// Endpoint POST (untuk daftar/bikin langganan baru) -> Yang tadi dibikin
router.post('/', authenticateToken, createSubscription);

// Endpoint GET (untuk melihat status langganan saat ini & nama guide) -> BARU
router.get('/my-subs', authenticateToken, getMySubscription);
router.delete('/my-subs', authenticateToken, cancelSubscription);
router.put('/activate', authenticateToken, activateSubscription);

module.exports = router;
