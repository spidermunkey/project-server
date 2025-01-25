const client  = require('../../utils/connect.js');
const { mongoose } = require('mongoose');
const filteredNames = listOfCollectionObjects => listOfCollectionObjects.map( obj => obj.name );
const existingCollections = async (database) =>  filteredNames(await database.listCollections().toArray());

const connect = async name => {
    const connection = await client.connect();
    const standardCollection = conn.db('colors');
    const user_collection = conn.db('user_colors');
    return {
        connection,
        standardCollection,
        user_collection,
    };
}

const close = conn => conn.close();

module.exports.model = {
    async connect(name){
        const connection = await client.connect();
        const standardCollection = connection.db('colors');
        const user_collection = connection.db('user_colors');
        return {
            connection,
            standardCollection,
            user_collection,
        };
    },
    async getMeta() {
        const { standardCollection, user_collection } = await this.connect();
        const defaultPalettes = filteredNames( await standardCollection.listCollections().toArray() );
        const userPalettes = filteredNames( await  user_collection.listCollections().toArray() );
        console.log('fetching metadata');
        return {
            defaultPalettes,
            userPalettes,
        }
    },
    async getCategory(collectionName, options = {}) {
        
            const {standardCollection} = await this.connect();
            const db = standardCollection;
            const collection = db.collection(collectionName);

            const {tone = null,hue = null} = options
            const providedHueNoTone = (hue && typeof hue == 'string' && (!tone || typeof tone !== 'string'));
            const providedToneNoHue = (tone && typeof tone == 'string'  && (!hue || typeof hue !== 'string'));
            const providedHueAndTone = (hue && typeof hue == 'string' && (tone && typeof tone == 'string'));
                    // provided hue but no tone
            if (providedHueNoTone) {
                const data = await collection.find({ primaryColor:hue }).toArray();
                return data;
            }
            if (providedToneNoHue) {
                const data = await collection.find({ primaryTone:tone }).toArray();
                return data;
            }
            if (providedHueAndTone) {
                const data = await collection.find( { primaryColor:hue, primaryTone:tone} ).toArray();
                return data;
            }    
            // else (no params)
            const data = await collection.find().toArray(); 
            return data
    },
    async getFilteredCategory (name, options = {}) {
        function findHuesInCollection(collection) {
            return async function(hues) {
                console.log(hues, 'yo')
                const set = await collection.find({
                    primaryColor: { $in: hues }
                }).toArray();
                // console.log(set)
                return set;
            }
        }
        
        function findTonesInCollection(collection) {
        
            return async function(tonesToMatch) {
        
                const set = await collection.find({
                    primaryTone: { $in: tonesToMatch }
                }).toArray();
        
                return set;
            }
        
        }
        
        function findHueBaseOnTone(collection) {
            
            return async function(hues,tonesToMatch) {
        
                const set = await collection.find({
                    primaryColor: { $in: hues },
                    primaryTone: { $in: tonesToMatch }
                }).toArray();
        
                return set;
            }
        }
    
        const {standardCollection} = await this.connect();
        const db = standardCollection;
        const collection = db.collection(name);
        const {tones = [],hues = []} = options;
        const providedHues = hues && Array.isArray(hues) && hues.length !== 0;
        const providedTones = tones && Array.isArray(tones) && tones.length !== 0;
        const providedHueNoTone = (providedHues && !providedTones);
        const providedToneNoHue = (providedTones && !providedHues);
        const providedHueAndTone = (providedHues && providedTones);

        if (providedHueNoTone) {
            const query = findHuesInCollection(collection);
            const data = await query(hues)
            return data;
        }
    
        if (providedToneNoHue) {
            console.log('toneNoHue')
            const query = findTonesInCollection(collection);
            const data = await query(tones)
            return data;
        }
    
        if (providedHueAndTone) {
            const query = findHueBaseOnTone(collection);
            const data = await query(hues,tones)
            return data
        }
        const data = await collection.find().toArray(); 
        return data;
    },
    async getCollection () {
    
    
    
        const collectionName = req.params.collection;
    
        const db = req.app.locals.connection.db('user_colors');
        const collection = db.collection(collectionName);
        console.log(req.body);
    
        // const {tones,hues} = req.body.options;
    
        // // console.log(collection,connection)
        // const providedHues = hues && Array.isArray(hues);
        // const providedTones = tones && Array.isArray(tones);
    
        // const providedHueNoTone = (providedHues && !providedTones);
        // const providedToneNoHue = (providedTones && !providedHues);
        // const providedHueAndTone = (providedHues && providedTones);
    
        // // provided hue but no tone
        // if (providedHueNoTone) {
        //     const query = findHuesInCollection(collection);
        //     const data = await query(hues)
        //     return res.json(data);
    
        // }
    
        // if (providedToneNoHue) {
    
        //     const query = findTonesInCollection(collection);
        //     const data = await query(hues)
        //     return res.json(data);
    
        // }
    
        // if (providedHueAndTone) {
            
        //     const query = findHueBaseOnTone(collection);
        //     const data = await query(hues)
        //     return res.json(data)
    
        // }
        
        // else (no params)
        const data = await collection.find().toArray(); 
        return res.json(data);
    
    },
    
    async getFilteredCollection () {
        function findHuesInCollection(collection) {
            return async function(hues) {
        
                const set = await collection.find({
                    primaryColor: { $in: hues }
                }).toArray();
        
                return set;
            }
        }
        
        function findTonesInCollection(collection) {
        
            return async function(tonesToMatch) {
        
                const set = await collection.find({
                    primaryTone: { $in: tonesToMatch }
                }).toArray();
        
                return set;
            }
        
        }
        
        function findHueBaseOnTone(collection) {
            
            return async function(hues,tonesToMatch) {
        
                const set = await collection.find({
                    primaryColor: { $in: hues },
                    primaryTone: { $in: tonesToMatch }
                }).toArray();
        
                return set;
            }
        }
    
        console.log('here')
    
        const collectionName = req.params.collection;
    
        const db = req.app.locals.connection.db('user_colors');
        const collection = db.collection(collectionName);
        console.log(req.body)
        const {tones,hues} = req.body.options;
    
        // console.log(collection,connection)
        const providedHues = hues && Array.isArray(hues);
        const providedTones = tones && Array.isArray(tones);
    
        const providedHueNoTone = (providedHues && !providedTones);
        const providedToneNoHue = (providedTones && !providedHues);
        const providedHueAndTone = (providedHues && providedTones);
    
        // provided hue but no tone
        if (providedHueNoTone) {
            console.log('and here')
            const query = findHuesInCollection(collection);
            const data = await query(hues)
            return res.json(data);
    
        }
    
        if (providedToneNoHue) {
    
            const query = findTonesInCollection(collection);
            const data = await query(tones)
            return res.json(data);
    
        }
    
        if (providedHueAndTone) {
            
            const query = findHueBaseOnTone(collection);
            const data = await query(hues,tones)
            return res.json(data)
    
        }
        
        // else (no params)
        const data = await collection.find().toArray(); 
        return res.json(data);
    },
    
    async createCollection () {
    
        const collectionName = req.body.cName;
        const description = req.body.desc;
        const db = req.app.locals.connection.db('user_colors');
        let message;
    
        const collections = await existingCollections(db);
        if ( collections.includes(collectionName) ){
            message = {status:"error",reason:"collection already exists", code: 500}
            res.status(500).json(message);
            return message;
        }
        if ( !collectionName ) {
            message = {status: "error", reason: "invalid body", code: 400}
            res.status(400).json(message);
            return message;
        }
    
        try {
            let stamp = new Date();
    
            let meta = {
                createdOn: stamp,
                collectionName: collectionName,
                collectionType: 'user_generated',
                description: description && typeof description === 'string' ? description.slice(0,256) : null,
            }
                const newCollection = await db.createCollection(collectionName)
                await newCollection.insertOne(meta);
                console.log(`collection ${collectionName}`,meta, await newCollection.find().toArray());
        } catch (e) {
            res.send(e).status(500);
        }
    
    
        res.send(`collection ${collectionName} created`).status(200)
    },
    
    async dropCollection () {
        const collectionName = req.body.cName;
        const db = req.app.locals.connection.db('user_colors');
        let message;
        console.log(req.body)
        const collections = await existingCollections(db);
        console.log('attempting do delete',collectionName, 'in', collections)
        if ( collections.includes(collectionName) && collectionName !== 'favorites'){
            const collection = db.collection(collectionName)
            console.log('dropping')
            try {
                await collection.drop(); // Use async version of drop()
                console.log("Collection deleted");
                res.status(200).send("Collection deleted successfully.");
            } catch (error) {
                console.error(error);
                res.status(500).send("Error deleting collection.");
            }
        } else {
            res.status(400).send("Invalid collection name or not allowed.");
        }
    },
    
    async addToCollection () {
        console.log('no here')
        const collectionName = req.params.collection;
        const db = req.app.locals.connection.db('user_colors');
        console.log(req.body);
        const {name,hex} = req.body;
    
        let message;
        const collections = await existingCollections(db)
    
        if (!collections.includes(collectionName)){
            message = {status:"error",reason:"collection doesn't exist", code: 500}
            res.json(message);
            return message;
        }
        if (!name || !hex ) {
            message = {status: "error", reason: "invalid body", code: 400}
            res.json(message);
            return message;
        } 
    
        try {
            const collection = db.collection(collectionName);
            const Color = require('../models/colors/Color').Color;
            const color = new Color( req.body.name, req.body.hex )
    
            if (collectionName === 'favorites')
                color.isFavorite = true;
                const result = await collection.insertOne(color, function(err,result) {
                
                if (err) message = { status:"error", reason: err, code:500 };
                if (result) message = { status:"success", code:200 };
    
                return message;
    
            });
            
            console.log('successfully added',name,'to',collectionName);
            res.json(result);
    
        } catch(e) {
            console.log(e)
            message = { status: "error", reason: e, code: 500 }
            res.json(message);
            return message;
        }
    
    
    },
    
    async getColorById () {
        const collectionName = req.query.collection;
        const type = req.query.type;
        let db
    
        if (type === 'palette')
            db = req.app.locals.connection.db('colors');
        else if (type === 'collection')
            db = req.app.locals.connection.db('user_colors')
    
        else return;
    
        console.log(req.query, collectionName)
        const collection = db.collection(collectionName);
    
        const {id} = req.params;
    
        const {ObjectId} = require('mongodb');
        const color = await collection.findOne({
            _id: new ObjectId(id)
        })
    
        if (color && collection) res.send({ id , color })
    
        else res.send({status: false})
    
    },
    
}

async function main() {
    const db = await connect();
    const { standardCollection } = db;
    
    db.close();
}
    // -----------------------------
    // FILTERS
    // ----------------------------------------------




    function byHue(a,b) { // obj.props.hue
        return a.props.hue - b.props.hue
    }
    
    function byLightness(a,b) { // obj.props.lightness
        return b.props.lightness - a.props.lightness
    }
    
    function byTone(a,b) { // obj.props.saturation / obj.props.lightness
        // if (a.props.saturation > b.props.saturation && a.props.lightness > b.props.lightness)
        //     return 1
        // return -1;
        let sortOrder = {
        'pastel': 1,
        'washed': 2,
        'muted': 3,
        'clean': 4,
        'earth': 5,
        'jewel': 6,
        'vivid': 7,
        'luminous': 8,
        'neon': 9,
        }
        if (sortOrder[a.props.tone] > sortOrder[b.props.tone])
            return 1
        return -1;
    }
    
    function bySaturation(a,b) { // obj.props.saturation + obj.props.lightness
        let x = a.props.saturation + a.props.lightness; 
        let y = b.props.saturation + a.props.lightness;
        return x - y
    }
    
    function invalidColor(a) { // obj.props == 'invalid color' ??
        if (a.props == 'invalid color') {
            return false
        }
        return true
    }
               