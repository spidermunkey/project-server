const fs = require('fs');
const path = require('path');
const client = require('../connect.js');
const {Color} = require('../../models/colors/Color.js');

fs.readFile(path.join(__dirname,'../../data/allColors.json'),async (err,data) => {

    if (err) {
        console.error(err);
        return;
    }

    const colors = JSON.parse(data);
    const collections = [];
    const connection = await client.connect();
    const database = connection.db('colors');

    for (const collection in colors) {
        let dbCollection = database.collection(collection);

        let collectionTitle = collection;
        let collectionData = colors[collection];
        
        for (const index of collectionData) {
        
            let color = new Color(...index);
            color.collection = collectionTitle;
            if (color) await dbCollection.insertOne(color);
        }
    }
    
    console.log(collections);

    console.log(database);
    connection.close();
})