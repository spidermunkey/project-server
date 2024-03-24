const fs = require('fs');
const path = require('path');
const client = require('../connect.js');

const database = async () => {
    await client.connect();
    console.log('Successfully connected to database server');
    const standardCollection = client.db('icons');
    return standardCollection;

};

const addToCategory = async (category,icon) => {

}

const standardCollection = fs.readFile('/home/jb3/dev/data/all_icons.json',async (err,data) => {
    // console.log(err,data)
    const icons = JSON.parse(data);
    // console.log(icons[1]);
    const categorySet = new Set();
    const categories = {};
    const all = new Map();
    const duplicates = {};
    let dupeCount = 0;
    for (let i = 0; i < icons.length; i++) {
        let backpack = icons[i];
        
        // element props
        let key = backpack.name;
        // let obj = Object.create(IconProto)
        let meta = Icon(backpack);
        // let meta = Object.assign(obj,props);

        // Populate Categories with orignal references
        if (!categorySet.has(backpack.category)){
            // keeping track of different categories
            categorySet.add(backpack.category);
            categories[backpack.category] = new Map();
        }

        // handling duplicate names
        if (all.has(key))
        {
            // if known duplicate doesn't exist create an object for it
            if (!duplicates.hasOwnProperty(key)) {
                duplicates[key] = {
                    count: 1,
                    categoryCount: 0,
                    dupes: new Map(),
                }
                // setting the existing element first
                duplicates[key].dupes.set(key,all.get(key));
            }

            // then the new element with a modified name
            let newKey = `${key}--${meta.category}`;
            
            // handling duplicates withing categories
            if (duplicates[key].dupes.has(newKey)) {
                // console.log('category dupe found!')
                newKey = `${newKey}--${++duplicates[key].categoryCount + 1}`;
            }

            // add a property showing that the name has been modified
            meta.rebased = newKey;

            // proceed mapping operations
            duplicates[key].dupes.set(newKey,meta);
            all.set(newKey,meta);
            categories[meta.category].set(newKey,meta);
            
            // update count
            duplicates[key].count = duplicates[key].count + 1;
            dupeCount++;
        } else {
            // ...otherwise
            all.set(key,meta);
            categories[meta.category].set(key,meta);
        }
    }

    // set property indicating if svgs of the same name exist
    // if (dupeCount > 0) {
    //     for (let name in duplicates) {
    //         duplicates[name].dupes.forEach(value => {
    //             // setting a reference back to all the icons of the same name
    //             value.others = Array.from(duplicates[name].keys());
    //             if (duplicates[name].categoryCount > 0)
    //                 value.othersInSameCategory = duplicates[name].categoryCount;
    //         })
    //     }
    //     function log_duplicates()
    //     { 
    //         // console.log('found',dupeCount,'duplicates');
    //         // console.log('here they are', duplicates);
    //     }
    // }

    await client.connect();
    console.log('Successfully connected to database server');
    let main_index = 0;
    // generate a index set of keys for each collection for navigating through the application
    for (const category in categories) {
        
        let i = 0;


        categories[category].forEach(value => {
            value.cid = ++i;
        })
    }
    const conn = await client.connect();

    all.forEach(async value => {
        value.id = ++main_index;

        try {
            const db = client.db('icons');
            const collection = db.collection('all');
            await collection.insertOne(value);
        }
        catch(e) {
            console.error(e)
            console.log(value)
        }


    });

    for (const category in categories) {
        console.log(category)
        categories[category].forEach(async value => {
            try {
                const db = conn.db('icons');
                const collection = db.collection(category);
                await collection.insertOne(value);
            } catch(e) {
                console.log('error adding to category',category)
                console.error(e);
                console.log(value);
            }
        })

    }
})

function Icon(props) {
    return {
        name: props.name,
        category: props.category,
        markup: props.markup,
        isFavorite: false,
        knownCollections: [],
        id: props.id || undefined,
        cid: props.cid || undefined,
    }
}