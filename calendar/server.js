require('dotenv').config()

const morgan = require('morgan');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 8080;

const bodyParser = require('body-parser');

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

const timerRouter = require('./routes/timers.js');
const birthdayRouter = require('./routes/birthdays.js');
const calendarRouter = require('./routes/calendar.js');
const eventRouter = require('./routes/events.js');
const todoRouter = require('./routes/todos.js');
app.use('/timers', timerRouter);
app.use('/birthdays',birthdayRouter);
app.use('/calendar',calendarRouter);
app.use('/events',eventRouter);
app.use('/todos', todoRouter);

app.get('/', (req,res) => res.json('Hello From The API HOME'));
app.use((req,res) => {
    res.status(404).json("404 not found")
});

async function run() {
    try {
        process.on('uncaughtException',(err) => {
            console.log('[[process]]')
            console.log(err.message)
            console.log(err.stack)
        })
        app.listen(PORT, (err) => {
            console.log(`listening for api connections on port:${PORT}`)
        });
        
    } catch (e) {
        console.log(e);
        console.log('[[server]]');
    }
};

run().catch(e => {
    console.log('i caught that')
});

