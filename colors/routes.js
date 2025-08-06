const express = require('express');
const router = express.Router();
const uuid = require('./utils/uuid.js')
const {local_client} = require('./utils/connect.js');


router.get('/meta/collections', async (request,response) => {
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const meta_data = await meta.find({collection_type:'local'}).toArray();
    response.json(meta_data)
})

router.get('/meta/projects', async (request,response) => {
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const meta_data = await meta.find({collection_type:'project'}).toArray();
    response.json(meta_data)
})

router.get('/meta/index', async (request,response) => {
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const meta_data = await meta.find({collection_type:'index'}).toArray();
    response.json('meta_data')
})

router.get('/meta', async (request,response) => {
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const meta_data = await meta.find().toArray();
    response.json(meta_data);
})

router.get('/collections/:collection', async (request,response) => {
    const cid = request.params.collection
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const collectionData = await meta.findOne({id:cid});
    let name = collectionData.name === 'recent' ? '{{recent}}' : collectionData.name === 'all' ? '{{all}}' : collectionData.name
    const collection = db.collection(name);
    const colors = await collection.find().toArray();
    response.json({
        ...collectionData,
        colors,
    })
})

router.post('/collections/:collection', async (request,response) => {
    const cid = request.params.collection;
    const color = request.body.color;
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const collectionData = await meta.findOne({id:cid});
    const collection = db.collection(collectionData.name);
    const found = await collection.findOne({_id:color._id});
    if (found) {
        const removed = await collection.findOneAndDelete({_id:color._id});
        let size = Number.isNaN(Number(collectionData.size)) ? 0 : (Number(collectionData.size))
        collectionData.size = --size;
        let sample = collectionData.sample && collectionData.sample.length > 0 ? collectionData.sample.filter(samp => samp._id !== color._id) : [];
        const metaUpdated = await meta.findOneAndUpdate({id:cid},{$set:{size: size,sample:sample,updated_at: Date.now()}},{returnDocument:'after',returnNewDocument:true});
        response.json({operation:'removed'})
    } else {
        const recentColletion = db.collection('{{recent}}');
        const found = await collection.findOne({_id:color._id, hex:{$not:hex}});
        if (!found)
            await recentColletion.insertOne(color);
        const added = await collection.insertOne(color);
        let size = Number.isNaN(Number(collectionData.size)) ? 0 : (Number(collectionData.size))
        collectionData.size = ++size;
        let sample = collectionData.sample && collectionData.sample.length > 0 ? collectionData.sample : [];
        if (sample.length < 25) sample.push(color);
        const metaUpdated = await meta.findOneAndUpdate({id:cid},{$set:{size: size,sample:sample,updated_at: Date.now()}},{returnDocument:'after',returnNewDocument:true});
        response.json({operation:'added'})
    }
})

router.post('/collections/create', async (request,response) => {
    const collection = request.body.collection;
    const colors = collection?.colors || [];
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const meta_document = {
        name: collection.name,
        collection_type: 'project',
        created_at: Date.now(),
        id: uuid(),
        size: colors.length > 0 ? colors.length : 0,
        sample: [...colors],
        
    }
    await meta.insertOne(meta_document)
    response.json(meta_document)
})

router.post('collections/search', async (request,response) => {
    const query = request.body.query;
    const cid = request.body.cid;
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const meta = db.collection('{{meta}}');
    const collectionData = await meta.findOne({id:cid});
    const collection = db.collection(collectionData.name);
    
    const validQuery = typeof query === 'string' && query.trim().length > 0;
    let items = []
    if (validQuery){
        const escaped = query.replace(/[.*+?^=!:${}()|\[\]\/\\]/g,'\\$&');
        items = await collection.find({name: {$regex: escaped, $options: 'i'} }).toArray()
    }
    response.json({searchQuery:query,data:items})
})

router.post('/search', async (request,response) => {
    const query = request.body.query;
    const connection = await local_client.connect();
    const db = connection.db('colors');
    const all = db.collection('{{all}}');
    const validQuery = typeof query === 'string' && query.trim().length > 0;
    let items = []
    if (validQuery){
        const escaped = query.replace(/[.*+?^=!:${}()|\[\]\/\\]/g,'\\$&');
        items = await all.find({name: {$regex: escaped, $options: 'i'} }).toArray()
    }
    response.json({searchQuery:query,data:items})
})

router.get('/', async (request,response) => {
    const connection = await local_client.connect()
    const db = connection.db('colors')
    const meta = db.collection('{{meta}}')
    const meta_data = await meta.find().toArray()
    console.log(meta_data)
    response.json(meta_data)
})

module.exports = router;
