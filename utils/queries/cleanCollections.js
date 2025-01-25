const client = require('../connect.js');
const {uuid} = require('../uuid.js');
const DateTime = require('../Datetime.js');
// cleanCollections();
reset();

async function cleanCollections() {
  const connection = await client.connect();
  const db = connection.db('icons');
  const meta = db.collection('{{meta}}');
  const savedCollections = await meta.find({docname:'[[collections]]'}).toArray();
  const collectionNames = [];
  const projects = savedCollections[0].collections
  console.log(collectionNames)
  const collections = (await db.listCollections().toArray()).map(collection => collection.name);
  const restrictedNames = ['all','downloads','favorites','recent','uploads','{{meta}}'];
  for (const collection in projects){
    restrictedNames.push(projects[collection].name);
  }
  collections.forEach(name => {
    if (!restrictedNames.includes(name)){
      console.log('deleting name', name)
      db.collection(name).drop();
    }

  })
}

async function reset() {
  const connection = await client.connect();
  const db = connection.db('icons');

  const collections = (await db.listCollections().toArray()).map(collection => collection.name);
  const restrictedNames = ['all','downloads','favorites','recent','uploads','{{meta}}'];
  collections.forEach(name => {
      console.log('deleting name', name)
      db.collection(name).drop();
    })
    await Promise.all(restrictedNames.map(async name => {
      await db.createCollection(name);
    }))
    const meta = db.collection('{{meta}}');
    const metaSchema = {
      docname: '[[collections]]',
      collections: {
        'auto': {},
        'projects': {},
        'uploads':{},
      },
      settings: {},
    }
    restrictedNames.forEach(async name => {
      const cid = uuid();
      const defaultCollectionSchema = {
        name,
        cid,
        collection_type: name === '{{meta}}' ? null : 'auto',
        subtypes: [],
        sub_collections:  [],
        size: 0,
        created_at: DateTime.stamp().ms,
      }
      metaSchema.collections.auto[cid] = defaultCollectionSchema;
    })
    await meta.insertOne(metaSchema);
    console.log('reseting local flags');
    // const ldb = await Local.reset.call(Local);
    console.log('process complete')
}
