const model = require('../models/icons/model')

async function getKnownCategories(conn) {
    const names = await model.getCategories();
    return names;
}

async function getKnownCollections(conn) {
    const names = await model.getCollections();
    return names;
}

async function getAllStandardIcons() {
    const icons = await model.getAllStandardIcons();
    return icons;
}

async function getCategoryByName(cName) {
    const icons = await model.getCategoryByName(cName)
    if (icons)
        return icons;
    else
        return 'nothing to see here'
}

async function getCollectionByName(cName) {
    const icons = await model.getCollectionByName(cName)
    if (icons) return icons;
    else return 'nothing to see here'
}

async function addToCollection(name,data,orweliginal) {
    const result = await model.addToCollection(name,data,original)
    return result;
}

async function createCollection(name) {
    const result = await model.createCollection(name)
    return result;
}


module.exports.getKnownCategories = getKnownCategories
module.exports.getKnownCollections = getKnownCollections
module.exports.getAllStandardIcons = getAllStandardIcons
module.exports.getCategoryByName = getCategoryByName
module.exports.getCollectionByName = getCollectionByName
module.exports.addToCollection = addToCollection;
module.exports.createCollection = createCollection