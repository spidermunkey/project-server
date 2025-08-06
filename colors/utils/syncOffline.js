const { client, local_client } = require('./connect.js');
const { uuid } =  require('./uuid.js');
// collection_types [local,project,index]
async function compileMetaData(){
  const connection = await client.connect();
  const db = connection.db('colors');
  const user_db = connection.db('user_colors');
  const collections = await db.listCollections().toArray();
  const user_collections = await user_db.listCollections().toArray();
  
  const parseCollection = async (name,collection_type) => {
    const _db = collection_type === 'local' ? db : user_db;
    const collection = _db.collection(name);
    const id = uuid(name);
    const size = await collection.countDocuments();
    const created_at = Date.now();
    const sub_collections = [];
    const sub_types = [];
    const sample = await collection.find({}).limit(25).toArray();
    const filters = {
        sub_collections:[],
        subtypes:[],
    }
    return { 
      name,
      id,
      size,
      sample,
      created_at,
      sub_collections,
      sub_types,
      filters,
      collection_type,
    }
  }
  const user_collection_data = ( await Promise.all(
    user_collections.map(
      async ({name}) => {
        return await parseCollection(name,'project')
      })))
    .reduce((obj,collection) => {
      obj[collection.id] = collection
      return obj
  },{})

  const local_collection_data = ( await Promise.all(
    collections.map(
      async ({name}) => {
        return await parseCollection(name,'local')
      })))
    .reduce((obj,collection) => {
      obj[collection.id] = collection
      return obj
  },{})

  const meta = {
    ...local_collection_data,
    ...user_collection_data,
  }

  for (const id in meta){
    db.collection('{{meta}}').insertOne(meta[id])
  }
  return meta;
}

async function updateCollectionSchema(){
  const connection = await client.connect();
  const local_connection = await client.connect();

  const user_db = connection.db('user_colors');
  const db = connection.db('colors');
  const collections = await user_db.listCollections().toArray();
  try {
    const update = async ({ name }) => {
      const sourceCollection = user_db.collection(name);
      const targetCollection = db.collection(name);
      const cursor = sourceCollection.find();
      let batchSize = 1000;
      let batch = [];
      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length === batchSize) {
          await targetCollection.insertMany(batch);
          batch = [];
        }
      }
      if (batch.length > 0) {
        await targetCollection.insertMany(batch);
      }
    };
    await Promise.all(collections.map(update));
  } catch (error) {
    console.error("Error updating collection schemas:", error);
  } finally {
    await connection.close();
  }
}

async function syncOffline(){
  const connection = await client.connect();
  const local_connection = await local_client.connect();

  const db = connection.db('colors');
  const local_db = local_connection.db('colors')
  const collections = await db.listCollections().toArray();
  try {
    const update = async ({ name }) => {
      const sourceCollection = db.collection(name);
      const targetCollection = local_db.collection(name);
      const cursor = sourceCollection.find();
      let batchSize = 1000;
      let batch = [];
      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length === batchSize) {
          await targetCollection.insertMany(batch);
          batch = [];
        }
      }
      if (batch.length > 0) {
        await targetCollection.insertMany(batch);
      }
    };
    await Promise.all(collections.map(update));
  } catch (error) {
    console.error("Error updating collection schemas:", error);
  } finally {
    await connection.close();
  }
}

// compileMetaData();
// updateCollectionSchema();
// syncOffline();
