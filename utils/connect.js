require('dotenv').config();
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.CONNECTION_STRING);

module.exports = client;
