const express = require('express');
const router = express.Router();

router.get('/:date', async function getTodosByDate(request,response){
  const db = await global.database.connect('Todos')
  const collection = db.collection('all')
  const todos = await collection.find({date:request.params.date}).toArray();
  response.json(todos)
});

router.delete('/:id', async function deleteTodo(request,response){
  try {
    const {id} = request.params;
    if (!id){
      response.json({success: false,message:'invalid id'})
      return;
    }
    const db = await global.database.connect('Todos')
    const collection = db.collection('all')
    await collection.deleteOne({id:id})
    response.json(data);

  } catch(error){
    console.log(error)
    response.json({success:false})
  }
});

router.put('/:id', async function editTodo(request,response){
  try {
    const data = request.body;
    if (data){
      delete data._id;
      if (!data.title){
        response.json({success: false,message:'title required'})
        return;
      }
      const db = await global.database.connect('Todos')
      const collection = db.collection('all')
      const result = await collection.findOneAndReplace({id:data.id},data,{returnDocument:'after',ReturnNewDocument:true})
      response.json(result.value);
      return;
    }
      response.json(data);

  } catch(error){
    console.log(error)
    response.json({success:false})

  }
});

router.get('/', async function getTodos(request,response){
  const db = await global.database.connect('Todos')
  const collection = db.collection('all')
  const todos = await collection.find().toArray();
  response.json(todos)
});

router.post('/', async function addTodo(request,response) {
    try {
    const data = request.body;
    if (data){
      if (!data.title){
        response.json({success: false,message:'title required'})
        return;
      }
      const db = await global.database.connect('Todos')
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
