const {api} = require( '../models/timers/model.js');

module.exports.welcome = (req,res,next) => {
    res.send('welcome to the timers endpoint');
}

module.exports.getTimers = async (req,res,next) => {
    const response = await api.getTimers();
    console.log('RES',response)
    return res.json(response);
}

module.exports.getTimer = async (req,res,next) => {
    const found = await api.getTimer(req.query.id);
    console.log('RES',found);
    return res.json(found);
}

module.exports.getMeta = async (req,res,next) => {
    
}

module.exports.addTimer = async (req,res,next) => {
    const collectionName = 'all'
    const db = req.app.locals.connection.db('Timers');
    let schema = {
        title: req.body.title,
        id: req.body.id,
        time: req.body.time,
        days: req.body.days,
        initial: req.body.initial,
    }
    
    try {
        const collection = db.collection('all');
        const result = await collection.insertOne(schema,  function(err,result) {
            
            if (err) message = { status:"error", reason: err, code:500 };
            if (result) message = { status:"success", code:200 };

            return message;

        })
        console.log('successfully added',schema.id,'to',collectionName);
        res.send(message)
    } catch(e) {
        console.log(e)
        message = { status: "error", reason: e, code: 500 }
        res.json(message);
        return message;
    }
}

module.exports.deleteTimer =  async (req,res,next) => {
    const collectionName = 'all'
    const db = req.app.locals.connection.db('Timers');
    const dID = req.query.id;
    try {
        const collection = db.collection('all');
        const result = await collection.findOneAndDelete({"id":dID});
        console.log('found',dID);
        res.json(result);
        console.log(result);
    } catch(e) {
        console.log(e);
        message = { status: "error", reason: e, code: 500 };
        res.json(message);
        return message;
    }
}