const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../../.config/env.js')
const { Icon } = require('./Icon.js');
const { Monitor } = require('./monitor.js')
const uri = CONNECTION_STRING;
const DateTime = require('../../utils/Datetime.js');

const IDB = {
    uri,
    db: {},
    // READ
    filterNames(listOfCollectionObjects) {
        return listOfCollectionObjects.
                    map(obj => obj.name);
    },

    async getCollectionNameById(cid){
        const {meta} = this.connect();
        const collection = (await meta.findOne({id: cid})).name;
        return collection;
    },

    async search(query) {
        const startTime = performance.now();
        const { standardCollection } = await this.connect();
        // console.log(query)
        try {
            const icons = await standardCollection.collection('all').find({
                $or: [
                    { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search on the 'name' field
                    { category: { $regex: query, $options: 'i' } } // Case-insensitive regex search on the 'category' field
                ]
            }).toArray();
    
            const endTime = performance.now();
            // Calculate duration
            const duration = endTime - startTime;
            // console.log(`Search operation took ${duration} milliseconds.`);
            return icons
        } catch(e){
            console.log(e)
            return false
        }
    },

    async getByID(id) {
        const {standardCollection} = await this.connect();
        const icon = await standardCollection.collection('all').findOne({id:Number(id)})
        return icon
    },

    async eachCollection(fn) {
        const names = await this.getNames()
        return Promise.all(names.map(async name => {
            const {userCollection} = await this.connect();
            const collection = userCollection.collection(name);
            const result = await fn(collection);
            return result
        }))
    },

    async getAllStandardIcons() {
        const startTime = performance.now();
        const { standardCollection } = await this.connect();
        const icons = await standardCollection.collection('all').find().toArray();
        const endTime = performance.now();
        console.log('all icon query: ', endTime - startTime)
        return icons;
    },
    
    async getNames(db) {
        const collections = await db.listCollections().toArray().map(obj => obj.name);
        // console.log('listing collections: ',collections)
        return this.filterNames(collections);
    },

    async getCategories() {
        const { standardCollection } =  await this.connect();
        const categories = await this.getNames(standardCollection);
        return categories;
    },

    async getCollectionNames() {
        const { userCollection } = await this.connect();
        const collections = await this.getNames(
            (await userCollection.listCollections()
                .toArray()
                .map(obj => obj.name)))
        return [...collections,'recent'];
    },

    async getCollections() {
        const {meta} = await this.connect();
        const names = await this.getCollectionNames();
        const metaDocuments = await Promise.all(names.filter(name => name !== '{{meta}}').map(async collection => {
                const document = await meta.findOne({name:collection})
                return document
        }))
        return metaDocuments;
    },

    async collectionExist(name) {
        const names = await this.getCollectionNames();
        return names.includes(name);
    },

    async categoryExist(name) {
        const names = await this.getCategories(standardCollection);
        return names.includes(name);
    },

    async getMeta(...collections) {
        // console.log(collections,'COLLECTIONS');
        const names = await this.getCollectionNames();
        const {meta} = await this.connect();
        const metaDocuments = await Promise.all(collections.map(async collection => {
            if (names.includes(collection)) {
                const document = await meta.findOne({name:collection})
                // console.log('DOCUMENT',document)
                return document
            }
        }))
        // console.log('META', metaDocuments)
        return {...metaDocuments[0]};
    },

    async getCollectionByName(name) {
        const proxyNames = ['all','recent','uploads'];
        if (proxyNames.includes(name)) {
            const data = await this.getCategoryByName(name);
            return data;
        }
        const { userCollection } = await this.connect();
        const names = await this.getCollectionNames();
        if (names.includes(name)) {
            const collection = userCollection.collection(name);
            const icons = await collection.find({markup: {$ne: ''}}).toArray();
            const documents = await this.getMeta(name)
            return {
                icons,
                ...documents,
            };
        } else
            return false;
    },

    async getCategoryByName(name) {
        // console.log('fetching category',name)
        const { standardCollection } = await this.connect();
        const names = await this.getCategories();
        if (names.includes(name)) {
            const collection = standardCollection.collection(name);
            const icons = await collection.find({markup: {$ne: ''}}).toArray();
            const documents = await this.getMeta(name)
            return {
                icons,
                ...documents,
            };
        } else
            return false;
    },

    // create
    async createCollection(name) {
        const restrictedNames = ['all','favorites','recent','uploads']
        const collectionExist = await this.collectionExist(name);
        if (collectionExist)
            return 'collection already exists';
        if (restrictedNames.includes(name))
            return 'restricted name';

        const { userCollection, collectionInfo } = await this.connect();
        const collection = await userCollection.createCollection(name);
        const meta = this.createMetaDocument(name);
        await collectionInfo.insertOne(meta);
    },

    createMetaDocument(collectionName) {
            return {
              name: collectionName,
              size: 0,
              id: uuid(),
              created_at: DateTime.stamp(),
              updated_at: null,
              random: [],
              sample: [],
            }  
    },

    async getRandom(n = 20, collection = 'all') {
        let connection = await this.connect()
        let sampleSize = !isNaN(n) ? Number(n) : 20
        // console.log(n,Math.max(n,20), !isNaN('3'),sampleSize)
        let db = collection === 'all' ?  connection.standardCollection : connection.userCollection;
        const randomDocuments = await db.collection(collection).aggregate([
            { $sample: { size: sampleSize} }
          ]).toArray();
        //   console.log('sample size',randomDocuments.length,[randomDocuments])

        return randomDocuments;
    },

    async logFavorite({id,cid,type}) {
        const { standardCollection , userCollection , settings } = this.connect();
        if (type == 'collection') {
            const collectionName = await this.getCollectionNameById(cid);
            const collection = userCollection.collection(collectionName);
            const icon = await collection.findOneAndUpdate({ id:id , cid:cid},[
                { $set: {
                    isFavorite:true,
                }}],
                {returnNewDocument: true}
            )
            return icon;            
        } else if (type === 'default' || type == undefined) {
            const collection = standardCollection.collection('all');
            const icon = await collection.findOneAndUpdate({id:id},[
                {$set: {
                    isFavorite:true,
                }}],
                {returnNewDocument:true}
            )
            return icon
        }
        
    },
    async add(name,props) {
        const collectionExists = await this.collectionExist(name);
        console.log('adding')
    },
    async addToCollection(name, props ) {
        const collectionExists = await this.collectionExist(name);
        
        if (props.markup == '') 
            return { message: 'upload failed, invalid markup',success: false,reason:'markup empty,null,undefined'}

        if (name === 'recent') {
            const {standardCollection,collectionInfo} = (await this.connect());
            const collection = standardCollection.collection('recent');
            const existingDoc = await collection.findOne({ name: props.name });
            if (existingDoc) return { 
                message:`A document with the name "${props.name}" already exists.`, 
                success:false, 
                reason:'duplicate name'
            };
            if(props._id) {
                props.trace = props._id
            };
            const meta = await this.getMeta('recent');
            const cid = meta.cid
            // console.log(meta,'META')
            const schema = new Icon({
                ...props,
                cid,
                created_at: DateTime.stamp(),
            })
            const result = await collection.insertOne(schema);
            const metaInfo = await collectionInfo.findOneAndUpdate({name:name},{
                $set: {
                    size: await collection.countDocuments(),
                    updated_at: DateTime.stamp(),
                }
            })
            return { message: `icon successfully added to ${name}`, success:true, result: schema};
    
        }
        if (!collectionExists) return { message:'this collection doesnt exist', success:false, reason:'collection not found'};
        const {userCollection,collectionInfo} = (await this.connect());
        const collection = userCollection.collection(name);
        const existingDoc = await collection.findOne({ name: props.name });

        if (existingDoc) return { 
            message:`A document with the name "${props.name}" already exists.`, 
            success:false, 
            reason:'duplicate name'
        };
        // USE TRACE ID!
        if(props._id) {
            props.trace = props._id
        };
        const cid = await this.getMeta('name').cid;
        const schema = new Icon({
            ...props,
            cid,
            created_at: DateTime.stamp(),
        })
        const result = await collection.insertOne(schema);
        const metaInfo = await collectionInfo.findOneAndUpdate({name:name},{
            $set: {
                size: await collection.countDocuments(),
                updated_at: DateTime.stamp(),
            }
        })
        return { message: `icon successfully added to ${name}`, success:true, result: schema};

    },
    async editIcon(name,props) {

    },

    async localCollectionExists(){

    },

    async createLocalCollection() {

    },

    writeLocal(){

    },

    async connect() {
        if (!this.client || !this.client.isConnected()) {
            this.client = new MongoClient(this.uri);

            try {
                await this.client.connect();
                const standardCollection = client.db('icons');
                const userCollection = client.db('user_icons');
                const meta = userCollection.collection('{{meta}}');
                console.log('Connected to MongoDB');
                this.db = {
                    standardCollection,
                    userCollection,
                    meta,
                }
                return this.db;
            } catch (error) {
                // console.error('Failed to connect to MongoDB', error);
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

module.exports = IDB
