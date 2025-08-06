require('dotenv').config();

const morgan = require('morgan');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3330;

const bodyParser = require('body-parser');
const router = require('./router');

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.use('/', router );

app.use((req,res) => {
    res.status(404).json("404 not found");
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

run().catch( e => {
    console.log('i caught that');
});
