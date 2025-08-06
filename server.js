require('dotenv').config({ path: `.env`});

const morgan = require('morgan');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 1280;
// const MessageBroker = require('./icons/messageBroker.js');
const bodyParser = require('body-parser');
// const { MessageBroker } = require('./icons/messageBroker.js');
// const { Mongo } = require('./icons/model.js');
// const { Local } = require('./icons/local.js');
// const broker = new MessageBroker(app);
// const server = broker.server;
// const PORT = process.env.SPORT || 1279
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// const colorRouter = require('./routes/colors.js');
// const timerRouter = require('./routes/timers.js');
// const birthdayRouter = require('./routes/birthdays.js');
// const testRouter = require('./icons/local_router.js');
// const trackerRouter = require('./routes/trackers.js');
app.use('/icons', require('./icons/routes.js'));
app.use('/colors', require('./colors/router.js'));
app.use('/fonts', require('./fonts/router.js'))
// app.use('/timers', timerRouter);
// app.use('/birthdays',birthdayRouter)
// app.use('/trackers', trackerRouter);
app.get('/', (req,res) => res.json('Hello From The API HOME'));
app.use((req,res) => {
    res.status(404).json("404 not found")
});
async function run() {
    try {
        // process.on('uncaughtException',(err) => {
        //     console.log('[[process]]')
        //     console.log(err.code)
        //     console.log(err.reason)
        // })
        // await Local.init();
        // console.log('local db ready'); // event db ready
        // await Mongo.connect(); // event db ready
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
