const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../.env/config.js');

const client = new MongoClient(CONNECTION_STRING);

module.exports = client;