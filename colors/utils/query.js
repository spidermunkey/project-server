const { MongoClient, ObjectId } = require('mongodb');
const { CONNECTION_STRING } = require('../config.js');


async function connect() {

    const connection = await MongoClient.connect(CONNECTION_STRING);
    return connection;
}

async function run() {
    const connection = await connect();

    const defaultColors = connection.db('colors');
    const savedColors = connection.db('user_colors');

    const testSet = defaultColors.collection('crayolaColors');
    
    const huesToMatch = ['green','red','rose'];
    const tonesToFind = ['pastel','clean'];
    const specificColorQuery = findColorByName(testSet);
    const specResult = await specificColorQuery('red')
    const query = findHueBaseOnTone(testSet);
    const result = await query(huesToMatch,tonesToFind);

    console.log(specResult)

}

run();

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

function findColorById(collection) {
    return async function(id) {
        const color = await collection.findOne({
            _id: new ObjectId(id)
        })
        return color
    }
}

function findColorByName(collection) {
    return async function(name) {
        const color = await collection.find({
            name: {$regex: name, $options: "i"}
        }).toArray();
        return color
    }
}