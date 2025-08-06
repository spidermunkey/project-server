const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const { CONNECTION_STRING } = require('../.config/env.js');
const {connection,local_connection} = require('../db/connect.js')
let client;

async function connect() {
    if (!client) {
        client = new MongoClient(CONNECTION_STRING)
        try {
            await client.connect()
            const db = client.db('birthdays')
            return db
        } catch (error) {
            // console.error('Failed to connect to MongoDB', error);
            // use local
            console.log('db connection error',error)
            return false;
        }
    }
    return client.db('birthdays')
}


router.get('/', async (request,response) => {
    try {
        const db = (await local_connection()).db('birthdays');
        const collection = db.collection('all');
        const birthdays = await collection.find().toArray();
        return response.json(birthdays);  
    } catch(error){
        console.log(error)
        response.json({})
    }

})

router.post('/', async (request,response) => {
    try {
        const db = (await local_connection()).db('birthdays');
        const collection = db.collection('all');
        const birthday = request.body;
        console.log('adding',birthday,request.body);
        collection.insertOne(birthday)
        response.status(200).json({ success: true });   
     } catch(error){
        console.log(error)
        response.json({});
    }
})

router.delete('/',async (request,response) => {
    try {
        const db = (await local_connection()).db('birthdays');
        const collection = db.collection('all');
        const {id} = request.body;
        console.log('deleting', id);
        collection.deleteOne({_id:new ObjectId(id)})
        response.status(200).json({ success: true });   
    } catch(error){
        console.log(error)
        response.json({});
    }
})

module.exports = router;
