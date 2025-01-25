const client = require('../connect.js');

update_samples()

async function update_samples(){
  const connection = await client.connect();
  const icons = connection.db('icons');
  const meta = icons.collection('{{meta}}');
  const document = meta.findOne({docname:'[[collections]]'});
  const metaSchema = {
    docname: '[[collections]]',
    collections: {
      'auto': {},
      'projects': {},
      'uploads':{},
    },
    settings: {},
    ...document,
  }
  let collections = document.collections;
  // let settings = document.settings;
  for (const groupname in collections){
    console.log('updating ', groupname, ' locally');
    let group = collections[groupname];
    for (const id in group){
      let collectionData = group[id];
      let cname = collectionData.name;
      let collection = icons.collection(cname);
      let sampleSize = 25;
      let collectionSize = collection.countDocuments();
      const randomIcons = await collection.aggregate([
          { $sample: { size: sampleSize} }
          ]).toArray();
      collectionData.sample = randomIcons;
      collectionData.size = collectionSize;
      console.log('found ', collectionSize, ' documents in ', cname)
    }
    metaSchema.collections[groupname] = group;
    console.log('update complete')
  }
  console.log('replacing ', collections, ' with ', metaSchema);
  meta.findOneAndReplace({docname: '[[collections]]'}, metaSchema)
  console.log('process complete')
}
