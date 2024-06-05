// const { Schema, default: mongoose } = require('mongoose');

// const Icon = new Schema({
//     tags: Array,
//     cid: Number,
//     id: Number,
//     vid: Number,
//     trace: Number,
//     colors: Array,
//     isBenched: Boolean,
//     isFavorite: Boolean,
//     knownCollections: Array,
//     rebased: String,
//     logs: Object,
//     html: Array,
//     markup: {
//         required: true,
//         type: String,
//     },
//     name: {
//         type: String,
//         required: true,
//     }
// })

module.exports.Icon = function(props) {
  const {
    tags,
    cid,
    id,
    vid,
    trace,
    colors,
    isBenched,
    isFavorite,
    rebased,
    logs,
    html,
    markup,
    name,
    created_at,
    updated_at
} = props;
    return {
        tags,cid,id,vid,trace,colors,isBenched,isFavorite,rebased,logs,html,markup,name
    }
}
// module.exports.Collection = Collection;
