const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../.config/env.js');

let client;
async function connect() {
    if (!client) {
        client = new MongoClient(CONNECTION_STRING);
        try {
            await client.connect();
            const db = client.db('birthdays');
            console.log('Connected to MongoDB');
            return db
        } catch (error) {
            // console.error('Failed to connect to MongoDB', error);
            // use local
            console.log('db connection error',error);
            return false;
        }
    }
    return client.db('birthdays')
}
router.use('/', async (request,response) => {
    const db = await connect();
    const collection = db.collection('all');
    const birthdays = await collection.find().toArray();
    return response.json(birthdays);
})
module.exports = router;