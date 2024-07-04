const client  = require('../utils/connect.js');
const { DateTime } = require('../utils/Datetime.js');
const { uuid } = require('../utils/uuid.js');

async function connect() {
  const connection = await client.connect();
  const userCollection = client.db('user_icons');
  const standardCollection = client.db('icons')
  const collectionInfo = userCollection.collection('{{meta}}')
  return { userCollection, collectionInfo, standardCollection }
}

async function setDefaultCIDsAndType() {
  const {standardCollection,userCollection,collectionInfo} = await connect()
  const names = (await standardCollection.listCollections().toArray()).map(collection => collection.name)
  const cNames = (await userCollection.listCollections().toArray()).map(collection => collection.name)
  console.log(names,cNames)
  for (name of names) {
    const collection = standardCollection.collection(name)
    await collection.updateMany({},{
      $set: {
        cid: 'lx0y99zp-00T8CBQNP2M5',
        type: 'default',
      }
    })
  }
  // console.log('done setting cids in categories', (await standardCollection.collection(names[0]).findOne()));

  for (name of cNames) {
    const collection = userCollection.collection(name);
    console.log(name);
    const col = (await collectionInfo.findOne({name:name}))
    if (name === '{{meta}}') continue;
    await collection.updateMany({},{
      $set: {
        cid: col.id,
        type: 'collection',
      }
    })

    // console.log('done setting cids in collections',await userCollection.collection(cNames[0]).findOne())
  }


}

setDefaultCIDsAndType();
