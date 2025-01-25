const client = require('../connect.js');

cleanUpJunkData();

async function cleanUpJunkData() {
  const connection = await client.connect();
  console.log('connected');
  const db = client.db('icons');
  const collection = db.collection('{{meta}}');
  console.log('searching')
  const data = await collection.deleteMany({docname: { $ne:'[[collections]]' }})
}
