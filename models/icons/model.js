const { mapCollection } = require('./Icon.js');
const { mongoose } = require('mongoose');
const client  = require('../../utils/connect.js');
const uri = require('../../.env/config.js');

class IDB {
    constructor() {
        this.url = uri;
    }

    // READ

    filterNames(listOfCollectionObjects) {
        return listOfCollectionObjects.
                    map(obj => obj.name);
    }

    async getAllStandardIcons() {
        const { standardCollection } = await this.connect();
        const icons = await standardCollection.collection('all').find().toArray();
        return icons;
    }
    
    async getNames(db) {
        const collections = await db.listCollections().toArray();
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


    async getCollectionByName(name) {
        const { userCollection } = await this.connect();
        const names = await this.getCollections(userCollection);
        if (names.includes(name)) {
            const icons = await userCollection.collection(name).find().toArray();
            return icons;
        } else {
            return false;
        }
    }

    async getCategoryByName(name) {
        const { standardCollection } = await this.connect();
        const names = await this.getCategories();
        console.log(names);
        console.log(names.includes(name),name);
        if (names.includes(name)) {
            const icons = await standardCollection.collection(name).find().toArray();
            return icons;
        } else {
            return false;
        }
    }

    // create
    async createCollection(name) {
        const collectionExist = await this.collectionExist(name);
        if (collectionExist)
            return 'collection already exists';

        const { userCollection } = await this.connect();
        
        userCollection.createCollection(name, function(err,res){
            if (err) throw err;
            console.log("New Collection Created", name);
        })
        
    }

    async addToCollection(name, props, original ) {
        // check if the collection actually exists
        const collectionExists = await this.collectionExist(name);
        if (!collectionExists) return { message:'this collection doesnt exist', success:false, reason:'collection not found'};
        
        // open connection through mongoose
        await this.mongoose();
        // returns model based on the collection name passed
        const collection = mapCollection(name);
        
        // check if the name already exists
        const existingDoc = await collection.findOne({ name: props.name });
        if (existingDoc) return { message:`A document with the name "${props.name}" already exists.`, success:false, reason:'duplicate name'};
    

        if(!props.knownCollections.includes(name)) props.knownCollections.push(name);

        if(props._id) props._id = '';
        if(props.observer._id) props.observer._id = '';

        if(name === 'favorites' && props.isFavorite !== true) props.isFavorite = true;
        let kc = original.knownCollections || [];
        let isFav = original.isFavorite;
        let from = original.category;
        if(!kc.includes(name)) kc.push(name);
        if(name === 'favorites' && isFav !== true) isFav = true;


        // on success create based on schema
        const result = await collection.create(props);

        const standardCollection = (await this.connect()).standardCollection;

        let test = await standardCollection.collection('all').findOneAndUpdate( {
            name: original.rebased ? original.rebased : original.name
        },{ $set:{knownCollections:kc, isFavorite: isFav }})

        let test2 = await standardCollection.collection(from).findOneAndUpdate( {
            name: original.rebased ? original.rebased : original.name
        },{ $set:{knownCollections: kc, isFavorite:isFav }})

        return { message: `icon successfully added to ${name}`, success:true, reason:'success' };
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
        const dbs = {
            connection,
            standardCollection,
            userCollection
        }
        return dbs;
    }



    async close() {
        await client.close();
        return;
    }
}

module.exports = new IDB();