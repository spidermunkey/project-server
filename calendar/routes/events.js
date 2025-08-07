const express = require('express');
const router = express.Router();

router.get('/:id', function getEvent(){

});

router.delete('/:id', function deleteEvent(){

});

router.put('/:id', async function editEvent(request,response){
  try {
    
    const data = request.body;
    if (data){
      delete data._id;
      if (!data.title){
        response.json({success: false,message:'title required'})
        return;
      }
      const db = await global.database.connect_local('Events')
      const collection = db.collection('all')
      const result = await collection.findOneAndReplace(
        {id:data.id},data,{returnDocument:'after',returnNewDocument:true})
        console.log(data.title,result)
      response.json(result.value);
      return;
    }
      response.json(data);

  } catch(error){
    console.log(error)
    response.json({success:false})

  }
});

// / day / d="isoString"
// / week / d="isoString"
// / month / d="isoString" 
router.get('/day', async function getDay(request,response){

})

router.get('/', async function getEvents(request,response){
  const db = await global.database.connect_local('Events')
  const collection = db.collection('all')
  const events = await collection.find().toArray();
  response.json(events)
});

router.post('/', async function addEvent(request,response) {
    try {
    const data = request.body;
    if (data){
      const db = await global.database.connect_local('Events')
      const collection = db.collection('all')
      await collection.insertOne(data)
    }
      response.json(data);

  } catch(error){
    console.log(error)
    response.json({})

  }
})

module.exports = router;
