const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../.config/env.js');
const uri = CONNECTION_STRING;
const {uuid} = require('../utils/uuid.js');
const DateTime = require('../utils/Datetime.js');

const meta = {
  async create(props) {
    const {meta} = await this.connect();
    const metaDoc = await meta.findOne({docname: "[[collections]]"});
    const collections = metaDoc.collections;
    const cname = props?.name;
    const nameExists = cname && Object.hasOwn(collections,cname);
    const collectionsExists = nameExists && collections[cname].cid === props.cid;
    if (nameExists)
      console.log('attempting to create a collection of the same name');
    if (collectionsExists){
      console.log('attempting to create a collection that already exists');
      console.log('this collection will be overwritten');
    }
    const document = {
      name: props.name,
      cid: props?.cid || uuid(),
      subtypes: props?.subtypes || [],
      sub_collections: props?.sub_collections || [],
      size: props?.size || 0,
      created_at: props?.created_at || DateTime.stamp.ms(),
    }
  },
  async connect() {
    if (!this.client) {
        try {
            this.client = new MongoClient(this.uri);
            console.log('here');
            const client = await this.client.connect();
            this.status = 'ready';
            const icons = this.client.db('icons');
            const meta = icons.collection('{{meta}}');
            console.log('Connected to MongoDB');
            this.db = {
                icons,
                meta,
            }
            return this.db;
        } catch (error) {
            // console.error('Failed to connect to MongoDB', error);
            // use local
            console.log('db connection error');
            console.log('status offline')
            this.status = 'offline'
            return false;
        }
    }
    return this.db;
},
async disconnect() {
    if (this.client && this.client.isConnected()) {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }
},
async close() {
    await client.close();
    return;
},
}
function cleanMeta() {

}
