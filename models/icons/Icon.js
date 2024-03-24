const { Schema, default: mongoose } = require('mongoose');
const Icon = new Schema({
    tags: Array,
    cid: Number,
    id: Number,
    isFavorite: Boolean,
    knownCollections: Array,
    rebased: String,
    markup: {
        required: true,
        type: String,
    },
    name: {
        type: String,
        required: true,
    }
})

function mapCollection(name) {
    const model = mongoose.model(name, Icon, name)
    console.log('creating model for', name, model)
    return model
}

module.exports.mapCollection = mapCollection;