// require('dotenv').config();
const {CONNECTION_STRING} = require('../.config/env.js')
const { MongoClient } = require('mongodb');
const client = new MongoClient(CONNECTION_STRING);

module.exports = client;
