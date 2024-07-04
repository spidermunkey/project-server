const morgan = require('morgan');

const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app)
const cors = require('cors');
const PORT = 1279;
const WebSocket = require('ws');
const wss = new WebSocket.Server({server});

const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('./.env/config.js');
const {watch} = require('./utils/watch.js');

// const PORT = process.env.SPORT || 1279

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

const iconRouter = require('./routes/icons/routes.js');
const colorRouter = require('./routes/colors.js');
const timerRouter = require('./routes/timers.js');
const trackerRouter = require('./routes/trackers.js');

app.use('/icons', iconRouter);
app.use('/colors',colorRouter);
app.use('/timers', timerRouter);
app.use('/trackers', trackerRouter);

app.get('/', (req,res) => res.json('Hello From The API HOME'));

app.use((req,res) => {
    res.status(404).json("404 not found")
});

async function run() {
    try {
        const connection = await MongoClient.connect(CONNECTION_STRING);
        app.locals.connection = connection;
        server.listen(PORT, (err) => console.log(`listening for api connections on port:${PORT}`))
    } catch (e) {
        console.log(e);
    }
};

run();
wss.on('connection', function connection(ws) {
    
    console.log('A new client Connected!');
    ws.send(JSON.stringify({ type: 'status', message:'listening for updates'}));
    watch(function(status) {
        console.log('STATUS',status);
        ws.send(JSON.stringify({type: 'new entry', data: status }));
    });
    ws.on('message', function incoming(message) {
        console.log('recieved: %s', message);
        // ws.send('test');
    })
})

