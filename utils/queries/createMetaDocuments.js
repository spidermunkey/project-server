const client  = require('../connect.js');
const { DateTime } = require('../Datetime.js');
const { uuid } = require('../uuid.js');

async function connect() {
  const connection = await client.connect();
  const userCollection = client.db('user_icons');
  const standardCollection = client.db('icons')
  const collectionInfo = userCollection.collection('{{meta}}')
  return { userCollection, collectionInfo, standardCollection }
}

async function createMetaDocuments() {
  const { userCollection , collectionInfo } = await connect();
  const names = (await userCollection.listCollections().toArray()).map(
    document => document.name
  ). filter(
    name => name !== "{{meta}}"
  )

  const status = await Promise.all(names.map(async name => {
    const document = await createMetaDocument(name);
    const done = await collectionInfo.insertOne(document)
  }
  ))
  console.log('all done',status)
}

async function documentExists(name) {
  
}
async function addMetaDocument(name) {
  const {collectionInfo} = await connect();
    const document = await createMetaDocument(name);
    const done = await collectionInfo.insertOne(document);
    console.log('all done')
}

async function createMetaDocument(name) {
  const {standardCollection} = await connect()
  const collection = standardCollection.collection(name);
  const document = {
    name,
    size: (await collection.countDocuments()),
    id: uuid(),
    created_at: DateTime.stamp(),
    updated_at: null,
    random: (await collection.aggregate([
      { $sample: { size: 20} }
    ]).toArray()),
    sample: (await collection.find().limit(20).toArray()),
  }
  return document;
}

// createMetaDocuments();
addMetaDocument('uploads');
addMetaDocument('recent');
addMetaDocument('all');
