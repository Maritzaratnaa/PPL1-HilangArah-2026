const express = require('express');
const router = express.Router();
const { cekRute } = require('../controllers/insidenController');

router.post('/cek', cekRute);

module.exports = router;