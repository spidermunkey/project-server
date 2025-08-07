const express = require('express');
const router = express.Router();
router.use('/', require('./routes'));
router.use((req,res) => {
    res.status(404).json("404 not found");
});

module.exports = router