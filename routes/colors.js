const express = require('express');
const router = express.Router();
const services = require('../controllers/userColors.js');

router.delete('/collection', services.dropCollection)

router.get('/collections/:collection', services.getCollection);
router.post('/collections/:collection', services.getFilteredCollection);

router.get('/meta', services.getMeta );
router.get('/color/:id', services.getColorById);

router.get('/:category', services.getCategory );
router.post('/:collection', services.getFilteredCategory);

router.get('/', services.welcome);

router.post('/collection/create', services.createCollection);

router.post('/add/:collection', services.addToCollection);

module.exports = router;