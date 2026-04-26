const express = require('express');
const router = express.Router();
const adminTransportController = require('../controllers/adminTransportController');
const {verifyToken, isAdmin} = require('../middleware/authMiddleware');

router.get('/', verifyToken, isAdmin, adminTransportController.getAllTransports);
router.post('/', verifyToken, isAdmin, adminTransportController.createTransport);
router.put('/:id', verifyToken, isAdmin, adminTransportController.updateTransport);

router.get('/', verifyToken, isAdmin, adminTransportController.getAllRoutes);
router.post('/', verifyToken, isAdmin, adminTransportController.createRoute);
router.put('/:id', verifyToken, isAdmin, adminTransportController.updateRoute);

router.get('/', verifyToken, isAdmin, adminTransportController.getAllStops);
router.post('/', verifyToken, isAdmin, adminTransportController.createStop);
router.put('/:id', verifyToken, isAdmin, adminTransportController.updateStop);

module.exports = router;