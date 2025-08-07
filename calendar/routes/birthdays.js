const express = require('express');
const router = express.Router();
const uuid = require('../../utils/uuid.js')

router.get('/', async (request,response) => {
    try {
        const db = await global.database.connect('birthdays')
        const collection = db.collection('all');
        const birthdays = await collection.find().toArray();
        console.log(birthdays)
        return response.json(birthdays);  
    } catch(error){
        console.log(error)
        response.json({})
    }

})

router.post('/', async (request,response) => {
    try {
        const db = await global.database.connect('birthdays')
        const collection = db.collection('all');
        const birthday = request.body;
        console.log('adding',birthday,request.body);
        collection.insertOne({
            ...birthday,
            id:uuid(),
        })
        response.status(200).json({ success: true });   
     } catch(error){
        console.log(error)
        response.json({});
    }
})

router.delete('/', async (request,response) => {
    try {
        const db = await global.database.connect('birthdays')
        const collection = db.collection('all');
        const {id} = request.body;
        console.log('deleting', id);
        collection.deleteOne({_id:id})
        response.status(200).json({ success: true });   
    } catch(error){
        console.log(error)
        response.json({});
    }
})

module.exports = router;
