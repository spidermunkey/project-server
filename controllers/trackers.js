module.exports.welcome = (req,res,next) => {
    res.json('welcome to the trackers endpoint');
}

module.exports.getTrackers = async (req,res,next) => {

    const db = req.app.locals.connection.db('trackers');

    const mapper = data => {

        return {
            title: data.title,
            id: data.id,
            time: data.time,
            successTime: data.successTime,
            resetAfterSuccess: data.resetAfterSuccess,
        }
    }
    const collection = db.collection('all');
    const data = await collection.find().toArray();
    return res.json(data.map(mapper));
}

module.exports.addTracker = async (req,res,next) => {
    const collectionName = 'all'
    const db = req.app.locals.connection.db('trackers');

    let schema = {
        title: req.body.title,
        id: req.body.id,
        time: req.body.time,
        successTime: req.body.successTime,
        resetAfterSuccess: req.body.resetAfterSuccess
    }

    try {
        const collection = db.collection('all');
        const result = await collection.insertOne(schema,  function(err,result) {
            
            if (err) message = { status:"error", reason: err, code:500 };
            if (result) message = { status:"success", code:200 };

            return message;

        })
        console.log('successfully added',schema.id,'to',collectionName);
        res.json(schema);
        console.log(result)

    } catch(e) {
        console.log(e)
        message = { status: "error", reason: e, code: 500 }
        res.json(message);
        return message;
    }
}

module.exports.deleteTracker = async (req,res,next) => {
    const db = req.app.locals.connection.db('trackers');
    const dID = req.query.id;
    try {
        const collection = db.collection('all');
        const result = await collection.findOneAndDelete({"id":dID});
        console.log('found',dID);
        res.json(result);
    } catch(e) {
        console.log(e);
        message = { status: "error", reason: e, code: 500 };
        res.json(message);
        return message;
    }
}