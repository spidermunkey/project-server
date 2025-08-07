require('dotenv').config({ path: `.env`});

const morgan = require('morgan');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 1280;
const bodyParser = require('body-parser');

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.use('/icons', require('./icons/routes.js'));
app.use('/colors', require('./colors/router.js'));
app.use('/fonts', require('./fonts/router.js'));
app.use('/calendar', require('./calendar/router.js'));

app.get('/', (req,res) => res.json('Hello From The API HOME'));

app.use((req,res) => {
    res.status(404).json("404 not found")
});

async function run() {
    try {
        process.on('uncaughtException', (error) => console.log('[[process error]]', error.code, error.reason))
        app.listen(PORT, (err) => {
            console.log(`listening for api connections on port:${PORT}`)
        });
        
    } catch (error) {
        console.log('[[server error]]: ', error);
    }
};

run();
