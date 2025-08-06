const express = require('express');
const router = express.Router();
const { client, local_client } = require('../db/client')

router.get('/:id', function getTimer(){

});
router.delete('/:id', function deleteTimer(){

});

router.put('/:id', async function editTimer(){
    
});

router.get('/', async function getTimers(request,response){
  await local_client.connect()
  const db = local_client.db('Timers')
  const collection = db.collection('all')
  const timers = await collection.find().toArray()
  response.json(timers)
});

router.post('/', async function addTimer(request,response) {
  try {
    const {data} = request.body
    if (data){
      await local_client.connect()
      const db = local_client.db('Timers')
      const collection = db.collection('all')
      await collection.insertOne(data)
    }
    response.json(data)
  } catch(error){
    console.log(error)
  }
});

module.exports = router;
