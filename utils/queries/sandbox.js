const {CONNECTION_STRING} = require('../../.config/env.js');
const {MongoClient} = require('mongodb');
const client = new MongoClient(CONNECTION_STRING);
run();
async function run(){
  const data = await cDump();
  console.log(data);
}

async function cDump(){
  const conn = await client.connect();
  const icons = conn.db('icons');
  const meta = icons.collection('{{meta}}');
  const metaData = await meta.find().toArray();
  const settings = icons.collection('{{settings}}');
  const user_settings = await settings.find().toArray();
  const stats = (await Promise.all((await icons.listCollections().toArray())
      .filter(o => o.name != '{{meta}}')      
      .map(async c => {
              return {
                name:c.name,
                ...(await icons.collection(c.name).stats())
              }
              })))
            .map(o => {
              return {
                name: o.name, 
                count: o.count,
                meta: metaData.find(d => d.name === o.name) || null,
                settings: user_settings.find(d => d.name === o.name) || {},

              }});
              const size = stats.find(o => o.name === 'all')?.count || null;
  

  return {
    size,
    stats,
    metaData,
    user_settings,
  }
}

function default_settings_factory(){
  return {
    sync: 'manual',
    upload: 'manual',
    backup: 'manual',
    mode: 'local',
    defaults: {
      vb: null,
      height: null,
      width: null,
      stroke: null,
      fill: null,
    }
  }
}


