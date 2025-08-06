const express = require('express');
const router = express.Router();
const { connection, local_connection } = require('../db/connect');
const { ReturnDocument } = require('mongodb');

router.get('/:date', async function getTodosByDate(request,response){
  const local_client = await local_connection();
  if (!local_client){
    response.json({success:false})
  }
  const db = local_client.db('Todos')
  const collection = db.collection('all')
  const todos = await collection.find({date:request.params.date}).toArray();
  response.json(todos)
});

router.delete('/:id', async function deleteTodo(request,response){
  try {
    const {id} = request.params;
    if (id){
      const local_client = await local_connection();
        if (!local_client){
          response.json({success: false, message: 'no connection'})
        }
      if (!id){
        response.json({success: false,message:'invalid id'})
        return;
      }
      const db = local_client.db('Todos')
      const collection = db.collection('all')
      await collection.deleteOne({id:id})
    }
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
      const local_client = await local_connection();
        if (!local_client){
          response.json({success: false, message: 'no connection'})
        }
      if (!data.title){
        response.json({success: false,message:'title required'})
        return;
      }
      const db = local_client.db('Todos')
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
  // const client = new MongoClient(CONNECTION_STRING)
  const local_client = await local_connection();
  if (!local_client){
    response.json({success:false})
  }
  const db = local_client.db('Todos')
  const collection = db.collection('all')
  const todos = await collection.find().toArray();
  response.json(todos)
});

router.post('/', async function addTodo(request,response) {
    try {
    const data = request.body;
    if (data){
      const local_client = await local_connection();
        if (!local_client){
          response.json({success: false, message: 'no connection'})
        }
      if (!data.title){
        response.json({success: false,message:'title required'})
        return;
      }
      const db = local_client.db('Todos')
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
