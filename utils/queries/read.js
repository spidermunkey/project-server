const {ObjectId} = require('mongodb');

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
        const color = await collection.findMany({
            name: $regex /name/i
        })
        return color
    }
}