const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../../.config/env.js');
const { uuid } = require('../uuid.js');
const uri = CONNECTION_STRING;
const client = new MongoClient(uri);
async function get_db(){
  const connection = await client.connect();
  const icon_collection = connection.db('icons');
  return icon_collection;
}

async function run1(){
  const icon_collection = await get_db();
  const meta = icon_collection.collection('{{meta}}');
  const meta_document = await meta.findOne({docname:"[[collections]]"});
  const collections = meta_document.collections;
  const settings = meta_document.settings;

    for (const collection_type in collections) {
      let type = collections[collection_type];
      for (const collection_id in type){
          let current = type[collection_id];
          let new_data_obj = current;
          new_data_obj.docname = "[[meta_document]]";
          new_data_obj.mid = uuid();
          console.log('new meta document created', new_data_obj);
          new_data_obj.settings = {};
          new_data_obj.colors = {};
          meta.insertOne(new_data_obj);
      }
  }
}

const res1 = run2();

async function run2(){
  const test = await testFind('m1h15n2p-023RY12S43F1');
  console.log(test);
}
async function testFind(cid){

  const icons = await get_db();
  const meta = icons.collection('{{meta}}');
  if (!cid){
    console.log('finding all')
      let docs = await meta.find({docname:'[[meta_document]]'}).toArray();
      return docs;
  } else {
    console.log('finding one')
      let doc = await meta.findOne({docname:'[[meta_document]]',cid:cid})
      return doc;
  }

}
// change db from design of 1 document containing all data in nested objects into multiple docs [using cid as ref-link] with all the embedded data

// currently presets are in meta.settings meaning they can be viewed and applied ubiquitously

// all presets must belong to either a collection or icon 
  // icons may contain multiple preset objects - colorways but only one drafted viewbox

// presenting unique presets and colors such as recently [used/saved/drafted] will apply to a private collection [[ tmp ]]
    // [[ tmp ]]
        /*
            searchedQuerys --> that resulted in action [querys] max20
            foundAndUsed -> [ids] max20

            colorsApplied --> [hexs] max40
            frequentColors --> [hexs] max40

            addedToCollection --> [ids]
            recentlyCopied --> [ids]
            mostlyCopied --> [ids]

            frequentViewboxes --> [presets] max10
        */
