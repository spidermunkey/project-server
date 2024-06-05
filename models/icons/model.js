const { Collection,Icon } = require('./Icon.js');
const { mongoose, set } = require('mongoose');
const client  = require('../../utils/connect.js');
const uri = require('../../.env/config.js');

const { DateTime } = require('../../utils/Datetime.js');
class IDB {
    constructor() {
        this.url = uri;
    }
    // READ
    filterNames(listOfCollectionObjects) {
        return listOfCollectionObjects.
                    map(obj => obj.name);
    }

    async search(query) {
        const startTime = performance.now();
        const { standardCollection } = await this.connect();
        console.log(query)
        const icons = await standardCollection.collection('all').find({
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search on the 'name' field
                { category: { $regex: query, $options: 'i' } } // Case-insensitive regex search on the 'category' field
            ]
        }).toArray();

        const endTime = performance.now();
        // Calculate duration
        const duration = endTime - startTime;
        console.log(`Search operation took ${duration} milliseconds.`);
        return searchResults
    }

    async getByID(id) {
        const {standardCollection} = await this.connect();
        const icon = await standardCollection.collection('all').findOne({id:Number(id)})
        return icon
    }

    async eachCollection(fn) {
        const names = await this.getNames()
        return Promise.all(names.map(async name => {
            const {userCollection} = await this.connect();
            const collection = userCollection.collection(name);
            const result = await fn(collection);
            return result
        }))
    }

    async getAllStandardIcons() {
        const startTime = performance.now();
        const { standardCollection } = await this.connect();
        const icons = await standardCollection.collection('all').find().toArray();
        const endTime = performance.now();
        console.log('all icon query: ', endTime - startTime)
        return icons;
    }
    
    async getNames(db) {
        const collections = await db.listCollections().toArray();
        console.log('listing collections: ',collections)
        return this.filterNames(collections);
    }

    async getCategories() {
        const { standardCollection } =  await this.connect();
        const categories = await this.getNames(standardCollection);
        return categories;
    }

    async getCollections() {
        const { userCollection } = await this.connect();
        const collections = await this.getNames(userCollection);
        return collections;
    }

    async collectionExist(name) {
        const { userCollection } = await this.connect();
        const names = await this.getCollections(userCollection);
        return names.includes(name);
    }

    async categoryExist(name) {
        const names = await this.getCategories(standardCollection);
        return names.includes(name);
    }

    async getMeta(...collections) {
        const names = await this.getCollections();
        const {collectionInfo} = await this.connect();
        const metaDocuments = await Promise.all(collections.map(async collection => {
            if (names.includes(collection)) {
                const document = await collectionInfo.findOne({name:collection})
                console.log('DOCUMENT',document)
                return document
            }
        }))
        console.log('META', metaDocuments)
        return {...metaDocuments[0]};
    }

    async getCollectionByName(name) {
        console.log('fetching collection',name)
        const startTime = performance.now();
        const { userCollection } = await this.connect();
        const names = await this.getCollections();
        if (names.includes(name)) {
            const collection = await userCollection.collection(name);
            const icons = await collection.find().toArray();
            const endTime = performance.now();
            console.log('collection query: ',name,' : ', endTime - startTime)
            const documents = await this.getMeta(name)
            const test = {
                icons,
                ...documents
            }
            console.log(test)
            return {
                icons,
                ...documents,
            };
        } else {
            return false;
        }
    }

    async getCategoryByName(name) {
        console.log('fetching category',name)
        const startTime = performance.now();
        const { standardCollection } = await this.connect();
        const names = await this.getCategories();
        console.log('fetched category names',names);
        if (names.includes(name)) {
            const collection = standardCollection.collection(name)
            const icons = await collection
            // .aggregate([{$sample: {size:100}}]).toArray();
            .find().toArray();
            const endTime = performance.now();
            const size = collection.countDocuments();
            console.log('category query: ',name,' : ', endTime - startTime)
            return {
                size,
                icons
            }
        } else {
            return false;
        }
    }

    // create
    async createCollection(name) {
        const collectionExist = await this.collectionExist(name);
        if (collectionExist)
            return 'collection already exists';

        const { userCollection, settings } = await this.connect();
        const collection = await userCollection.createCollection(name);
        const meta = this.createMetaDocument(name);
        await settings.insertOne(meta);
    }

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
    }

    async getRandom(n = 20, collection = 'all') {
        let connection = await this.connect()
        let sampleSize = !isNaN(n) ? Number(n) : 20
        console.log(n,Math.max(n,20), !isNaN('3'),sampleSize)
        let db = collection === 'all' ?  connection.standardCollection : connection.userCollection;
        const randomDocuments = await db.collection(collection).aggregate([
            { $sample: { size: sampleSize} }
          ]).toArray();
          console.log('sample size',randomDocuments.length,[randomDocuments])

        return randomDocuments;
    }

    async addToCollection(name, props, original ) {
        const collectionExists = await this.collectionExist(name);
        
        if (!collectionExists) return { message:'this collection doesnt exist', success:false, reason:'collection not found'};
        const {userCollection,settings} = (await this.connect());
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

        const schema = new Icon({
            ...props,
            created_at: DateTime.stamp(),
        })
        const result = await collection.insertOne(schema);
        
        const collectionInfo = settings;
        const metaInfo = collectionInfo.findOne({name:name})
        if (metaInfo) {
            metaInfo.size = await collection.countDocuments();
            metaInfo.lastUpdated = DateTime.stamp();
        }
        return { message: `icon successfully added to ${name}`, success:true, result: schema};

    }

    async editIcon(name,props) {

    }

    async mongoose() {
        const connection = await mongoose.connect(this.url, { dbName: 'user_icons'});
        return connection;
    }

    async connect(name) {
        const connection = await client.connect();
        console.log('Successfully connected to database server');
        const standardCollection = client.db('icons');
        const userCollection = client.db('user_icons');
        const collectionInfo = userCollection.collection('{{meta}}')
        const dbs = {
            connection,
            standardCollection,
            userCollection,
            collectionInfo,
        }
        return dbs;
    }

    async close() {
        await client.close();
        return;
    }
}

module.exports = new IDB();
