const express = require('express');
const router = express.Router();
const adminTransportController = require('../controllers/adminTransportController');
const {verifyToken, isAdmin} = require('../middleware/authMiddleware');

router.get('/trans', verifyToken, isAdmin, adminTransportController.getAllTransports);
router.post('/trans', verifyToken, isAdmin, adminTransportController.createTransport);
router.put('/trans/:id', verifyToken, isAdmin, adminTransportController.updateTransport);

router.get('/routes', verifyToken, isAdmin, adminTransportController.getAllRoutes);
router.post('/routes', verifyToken, isAdmin, adminTransportController.createRoute);
router.put('/routes/:id', verifyToken, isAdmin, adminTransportController.updateRoute);
router.delete('/routes/:id', verifyToken, isAdmin, adminTransportController.deleteRoute);

router.get('/stops', verifyToken, isAdmin, adminTransportController.getAllStops);
router.post('/stops', verifyToken, isAdmin, adminTransportController.createStop);
router.put('/stops/:id', verifyToken, isAdmin, adminTransportController.updateStop);

module.exports = router;