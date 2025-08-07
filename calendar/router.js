const express = require('express');
const router = express.Router();
const path = require('path');
router.use(express.static(path.join(__dirname, '..' ,'public','calendar')));

router.use('/timers', require('./routes/timers.js'));
router.use('/birthdays',require('./routes/birthdays.js'));
router.use('/calendar',require('./routes/calendar.js'));
router.use('/events',require('./routes/events.js'));
router.use('/todos', require('./routes/todos.js'));

router.get('/', (request,response) => response.sendFile(path.join(__dirname, '..', 'public', 'calendar', 'index.html')));

router.use((req,res) => {
    res.status(404).json("404 not found")
});

module.exports = router;