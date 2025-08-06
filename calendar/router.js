const express = require('express');
const router = express.Router();
const timerRouter = require('./routes/timers.js');
const birthdayRouter = require('./routes/birthdays.js');
const calendarRouter = require('./routes/calendar.js');
const eventRouter = require('./routes/events.js');
const todoRouter = require('./routes/todos.js');
router.use('/timers', timerRouter);
router.use('/birthdays',birthdayRouter);
router.use('/calendar',calendarRouter);
router.use('/events',eventRouter);
router.use('/todos', todoRouter);

router.get('/', (req,res) => res.json('Hello From The Calendar API!'));
router.use((req,res) => {
    res.status(404).json("404 not found")
});

module.exports = router;