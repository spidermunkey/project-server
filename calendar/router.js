const express = require('express');
const router = express.Router();

router.use('/timers', require('./routes/timers.js'));
router.use('/birthdays',require('./routes/birthdays.js'));
router.use('/calendar',require('./routes/calendar.js'));
router.use('/events',require('./routes/events.js'));
router.use('/todos', require('./routes/todos.js'));

router.get('/', (req,res) => res.json('Hello From The Calendar API!'));
router.use((req,res) => {
    res.status(404).json("404 not found")
});

module.exports = router;