const {local_client} = require('../utils/connect.js');
const {uuid} = require('../utils/uuid.js');
async function run() {
  const connection = await local_client.connect();
  const db = connection.db('colors');
  const meta = db.collection('{{meta}}');
  const all = db.collection('{{all}}');
  const recent = db.collection('{{recent}}');
  const info = {
    collection_type: 'index',
    name: 'all',
    id: uuid(),
    size: await all.countDocuments(),
    created_at: Date.now(),
    sample: await all.find().limit(25).toArray(),
  }
  const recentInfo = {
    collection_type: 'index',
    name: 'recent',
    id: uuid(),
    size: await recent.countDocuments(),
    created_at: Date.now(),
    sample: await recent.find().limit(25).toArray(),
  }
  meta.insertOne(info)
  meta.insertOne(recentInfo)
}

