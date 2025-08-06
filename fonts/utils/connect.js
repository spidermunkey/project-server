require('dotenv').config({ path: `../.env`});

const CONNECTION_STRING = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@cluster${process.env.MONGO_CLUSTER}.fnp9j.mongodb.net/?retryWrites=true&w=majority`
const LOCAL_CONNECTION_STRING = 'mongodb://localhost:27017';

const { MongoClient } = require('mongodb');
const client = new MongoClient(CONNECTION_STRING);
const local_client = new MongoClient(LOCAL_CONNECTION_STRING);

module.exports.local_client = local_client
module.exports.client = client
