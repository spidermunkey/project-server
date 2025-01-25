const { Icon } = require('../../../models/icons/Icon.js');
const { uuid , DateTime } = require('../../utils/index.js');
const { Monitor } = require('./monitor.js')
const uri = process.env.CONNECTION_STRING;

module.exports.FsModel = class {

  constructor() {
      this.uri = uri;
      this.client = null;
      this.db = null;
  }

  async getCollectionNameById(cid){
      const {meta} = this.connect();
      const metaDoc = await meta.findOne({cid: cid})
      const name = metaDoc.name;
      return name;
  }

  async search(query,collection = 'all') {
      const startTime = performance.now();
      const { icons } = await this.connect();
      // console.log(query)
      try {
          const result = await icons.collection(collection).find({
              $or: [
                  { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search on the 'name' field
                  { category: { $regex: query, $options: 'i' } } // Case-insensitive regex search on the 'category' field
              ]
          }).toArray();
  
          const endTime = performance.now();
          // Calculate duration
          const duration = endTime - startTime;
          // console.log(`Search operation took ${duration} milliseconds.`);
          return result
      } catch(e){
          console.log(e)
          return false
      }

  }

  async getByID(id) {
      const {icons} = await this.connect();
      const icon = await icons.collection('all').findOne({id:Number(id)})
      return icon
  }

  async getCollectionNames() {
    const {icons} = await this.connect();
    const collections = (await icons.listCollections().toArray()).map(c => c.name).filter(name => name !== '{{meta}}');
    return collections;
  }

  async collectionExist(name) {
      const names = await this.getCollectionNames();
      return names.includes(name);
  }

  async getMeta(collection) {
      const {meta} = await this.connect();
      const document = await meta.findOne({name:collection})
      return document
  }

  async getCollectionByName(name) {
      const { icons } = await this.connect();
      const names = await this.getCollectionNames();
      if (names.includes(name)) {
          const collection = icons.collection(name);
          const data = await collection.find({markup: {$ne: ''}}).toArray();
          const meta = await this.getMeta(name)
          return {
              icons: data,
              meta,
          };
      } else
          return false;
  }

  // create
  async createCollection(name) {
      const restrictedNames = ['all','favorites','recent','uploads','downloads','{{meta}}']
      const collectionExist = await this.collectionExist(name);
      if (collectionExist)
          return { message: 'collection not created',success: false, reason:'collection name exists'}
      if (restrictedNames.includes(name))
          return  { message: 'collection not created',success: false, reason:'restricted collection name'};

      this.createMetaDocument(name);
      const { icons } = await this.connect();
      const collection = await icons.createCollection(name);
      return collection;
  }

  async createMetaDocument( collectionName, cid = uuid() ) {
    const metaDoc = {
      name: collectionName,
      cid,
      size: 0,
      created_at: DateTime.stamp(),
      updated_at: null,
      random: [],
      sample: [],
    }  
    const status = await meta.insertOne(metaDoc);
    return status;
  }

  async getRandom(n = 20, collection = 'all') {
      let {icons} = await this.connect()
      let sampleSize = !isNaN(n) ? Number(n) : 20
      const randomDocuments = await icons.collection(collection).aggregate([
          { $sample: { size: sampleSize} }
        ]).toArray();
      return randomDocuments;
  }

  async logFavorite({id,cid,type}) {
      const { icons } = this.connect();
      if (type == 'collection') {
          const collectionName = await this.getCollectionNameById(cid);
          const collection = icons.collection(collectionName);
          const icon = await collection.findOneAndUpdate({ id:id , cid:cid},[
              { $set: {
                  isFavorite:true,
              }}],
              {returnNewDocument: true}
          )
          return icon;            
      } else if (type === 'default' || type == undefined) {
          const collection = icons.collection('all');
          const icon = await collection.findOneAndUpdate({id:id},[
              {$set: {
                  isFavorite:true,
              }}],
              {returnNewDocument:true}
          )
          return icon
      }
      
  }

  async addToCollection(name, props) {

      const collectionExists = await this.collectionExist(name);
      if (props.markup == '') 
          return { message: 'upload failed',success: false,reason:'invalid markup'}

      if (!collectionExists) 
        await this.createCollection(name)

      const {icons,meta} = (await this.connect());
      const collection = icons.collection(name);
      const existingDoc = await collection.findOne({ name: props.name, markup: props.markup });
      if (existingDoc) return { 
          message:`A document with the name "${props.name}" already exists.`, 
          success:false, 
          reason:'duplicate name'
      };
      // USE TRACE ID!
      if(props._id) {
          props.trace = props._id
      };
      const metaDoc = await this.getMeta(name);
      const cid = metaDoc.cid
      const schema = new Icon({
          ...props,
          cid,
          collection: name,
          created_at: DateTime.stamp(),
      })
      const result = await collection.insertOne(schema);
      const metaInfo = await meta.findOneAndUpdate({name:name},{
          $set: {
              size: await collection.countDocuments(),
              updated_at: DateTime.stamp(),
          }
      })
      return { message: `icon successfully added to ${name}`, success:true, result: schema};

  }

  async add(properties){
    const id = uuid();
    const entry = {
      id,
      name:properties.name,
      collection: properties.collection, 
      sub_collection: properties.sub_collection,
      markup: properties.markup, // !== ''
      subtype: properties.subtype, // null || [duotone,bold,fill,light,regular,solid,outlined,thin,medium];
      created_at: DateTime.stamp(),
    }

    let icon = new Icon(entry)
    let status1 = await this.addToCollection('all',icon);
    let status2 = await this.addToCollection(properties.collection,icon);
    return { 1:status1, 2:status2 };
  }

  async connect() {
    if (!this.client || !this.client.isConnected()) {
        this.client = new MongoClient(this.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            poolSize: 10, // Adjust pool size as needed
        });

        try {
            await this.client.connect();
            const icons = client.db('icons');
            const meta = icons.collection('{{meta}}')
            console.log('Connected to MongoDB');
            this.db = {icons,meta};
            return this.db;
        } catch (error) {
            console.error('Failed to connect to MongoDB', error);
            throw error;
        }
    }
    return this.db;
}

async disconnect() {
    if (this.client && this.client.isConnected()) {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }
}

async close() {
    await client.close();
    return;
}
}
