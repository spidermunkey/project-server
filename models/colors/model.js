const client  = require('../../utils/connect.js');
const { mongoose } = require('mongoose');

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
               