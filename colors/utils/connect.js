const {MongoClient} = require('mongodb');
const {CONNECTION_STRING} = require('../.config/env');
const LOCAL_CONNECTION_STRING = 'mongodb://localhost:27017';

module.exports.local_client = new MongoClient(LOCAL_CONNECTION_STRING);
module.exports.client = new MongoClient(CONNECTION_STRING); 