const client = require('../utils/connect.js');

const filteredNames = listOfCollectionObjects => listOfCollectionObjects.map( obj => obj.name );
const existingCollections = async (database) =>  filteredNames(await database.listCollections().toArray());

const connect = async name => {
    const connection = await client.connect();
    const standardCollection = connection.db('colors');
    const user_collection = connection.db('user_colors');
    return {
        connection,
        standardCollection,
        user_collection,
    };
}

module.exports.welcome = (req,res) => {
    res.json('welcome to the colors endpoint')
}

module.exports.getMeta = async(req,res,next) => {
    const {standardCollection,user_collection} = await connect();
    console.log('fetching metadata');
    const defaultPalettes = filteredNames( await standardCollection.listCollections().toArray() );
    const userPalettes = filteredNames( await user_collection.listCollections().toArray() );


    res.json({
        defaultPalettes,
        userPalettes,
    })

    console.log('data sent');
}

module.exports.getCategory = async (req,res,next) => {
    
        const collectionName = req.params.category;
        const {standardCollection,user_collection} = await connect();

        const db = standardCollection
        const collection = db.collection(collectionName);

        const {tone,hue} = req.query
        const providedHueNoTone = (hue && typeof hue == 'string' && (!tone || typeof tone !== 'string'));
        const providedToneNoHue = (tone && typeof tone == 'string'  && (!hue || typeof hue !== 'string'));
        const providedHueAndTone = (hue && typeof hue == 'string' && (tone && typeof tone == 'string'));
                // provided hue but no tone
        if (providedHueNoTone) {

            const data = await collection.find({ primaryColor:hue }).toArray();
            return res.json(data);

        }

        if (providedToneNoHue) {

            const data = await collection.find({ primaryTone:tone }).toArray();
            return res.json(data);

        }

        if (providedHueAndTone) {
            
            const data = await collection.find( { primaryColor:hue, primaryTone:tone} ).toArray();
            return res.json(data);

        }    
        
        // else (no params)
        const data = await collection.find().toArray(); 
        return res.json(data);

}

module.exports.getFilteredCategory = async (req,res,next) => {
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

    const collectionName = req.params.collection;
    const {standardCollection,user_collection} = await connect();

    const db = standardCollection
    const collection = db.collection(collectionName);
    console.log(req.body)
    const {tones,hues} = req.body.options;

    // console.log(collection,connection)
    const providedHues = hues && Array.isArray(hues) && hues.length !== 0;
    const providedTones = tones && Array.isArray(tones) && tones.length !== 0;

    const providedHueNoTone = (providedHues && !providedTones);
    const providedToneNoHue = (providedTones && !providedHues);
    const providedHueAndTone = (providedHues && providedTones);

    // provided hue but no tone
    if (providedHueNoTone) {
        console.log('here')
        const query = findHuesInCollection(collection);
        const data = await query(hues)
        return res.json(data);

    }

    if (providedToneNoHue) {
        console.log('toneNoHue')
        const query = findTonesInCollection(collection);
        const data = await query(tones)
        // console.log(data)
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

}
module.exports.getCollection = async (req,res,next) => {



    const collectionName = req.params.collection;
    const {standardCollection,user_collection} = await connect();

    const db = user_collection
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

}

module.exports.getFilteredCollection = async (req,res,next) => {
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
    const {standardCollection,user_collection} = await connect();

    const db = user_collection
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
}

module.exports.createCollection = async (req,res,next) => {

    const collectionName = req.body.cName;
    const {standardCollection,user_collection} = await connect();
    const description = req.body.desc;
    const db = user_collection
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
}

module.exports.dropCollection = async (req,res,next) => {
    const {standardCollection,user_collection} = await connect();
    const collectionName = req.body.cName;
    const db = user_collection
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
}

module.exports.addToCollection = async (req,res,next) => {
    console.log('no here')
    const {standardCollection,user_collection} = await connect();
    const collectionName = req.params.collection;
    const db = user_collection
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


}

module.exports.getColorById = async(req,res,next) => {
    const collectionName = req.query.collection;
    const type = req.query.type;
    const connection = await client.connect();
    const standardCollection = connection.db('colors');
    const user_collection = connection.db('user_colors');
    let db

    if (type === 'palette')
        db = standardCollection
    else if (type === 'collection')
        db = user_collection
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

}

module.exports.dropColorFromCollection = async (req,res,next) => {

}
