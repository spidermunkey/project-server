const services = require('../controllers/trackers.js');
const express = require('express');
const router = express.Router();

router.get('/meta', services.getTrackers);
router.post('/api', services.addTracker);
router.delete('/api', services.deleteTracker);

module.exports = router;