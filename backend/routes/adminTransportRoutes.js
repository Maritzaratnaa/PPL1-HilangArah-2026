const express = require('express');
const router = express.Router();
const adminTransportController = require('../controllers/adminTransportController');
const {verifyToken, isAdmin} = require('../middleware/authMiddleware');

router.get('/trans', verifyToken, isAdmin, adminTransportController.getAllTransports);
router.post('/trans', verifyToken, isAdmin, adminTransportController.createTransport);
router.put('/trans/:id', verifyToken, isAdmin, adminTransportController.updateTransport);
router.delete('/trans/:id', verifyToken, isAdmin, adminTransportController.deleteTransport);

router.get('/routes', verifyToken, isAdmin, adminTransportController.getAllRoutes);
router.post('/routes', verifyToken, isAdmin, adminTransportController.createRoute);
router.put('/routes/:id', verifyToken, isAdmin, adminTransportController.updateRoute);
router.delete('/routes/:id', verifyToken, isAdmin, adminTransportController.deleteRoute);

router.get('/stops', verifyToken, isAdmin, adminTransportController.getAllStops);
router.post('/stops', verifyToken, isAdmin, adminTransportController.createStop);
router.put('/stops/:id', verifyToken, isAdmin, adminTransportController.updateStop);
router.delete('/stops/:id', verifyToken, isAdmin, adminTransportController.deleteStop);

router.get('/route-stops', verifyToken, isAdmin, adminTransportController.getAllRouteStops);
router.post('/route-stops', verifyToken, isAdmin, adminTransportController.createRouteStop);
router.put('/route-stops/:id', verifyToken, isAdmin, adminTransportController.updateRouteStop);
router.delete('/route-stops/:id', verifyToken, isAdmin, adminTransportController.deleteRouteStop);

module.exports = router;