const services = require('../controllers/timers.js');
const express = require('express');
const router = express.Router();

router.get('/', services.getTimer);

router.post('/logs', async function (req,res,next) {

    const db = req.app.locals.connection.db('Timers')

    let log = {...req.body}
    console.log(req.body)

    try {
        const collection = db.collection('logs');
        const result = await collection.insertOne(log,function(err,result) {
            
            if (err) message = { status:"error", reason: err, code:500 };
            if (result) message = { status:"success", code:200 };

            return message;

        })}
         catch(e){
            console.log(e)
            message = { status: "error", reason: e, code: 500 }
            res.json(message);
            return message;
        }

})

router.get('/meta', services.getTimers );

router.post('/api', services.addTimer);

router.delete('/api', services.deleteTimer);

// router.get('/', services.welcome)

router.patch('/api', async function(req,res,next){
    
    const db = req.app.locals.connection.db('Timers');
    const eID = req.query.id;

    let schema = {
        title: req.body.title,
        id: req.body.id,
        time: req.body.time,
        days: req.body.days,
        initial: req.body.initial,
    }
    
    try {
        const collection = db.collection('all');
        const found = await collection.findOne({
            id:eID
        })
        const result = await collection.findOneAndUpdate(
            {id:eID},
            {$set:schema},
            {
            new:true,
            returnNewDocument:true,
            returnDocument:"after"
        },
        )
        if (result.n == 1 && result.updatedExisting) {
            console.log('found',eID);
            let {value} = result;
            console.log('value',value);
            res.json(value)
        }
        console.log('NEW', result.value)
        res.json(result.value);


    } catch(e) {
        console.log(e);
        message = { status: "error", reason: e, code: 500 };
        res.json(message);
        return message;
    }
});

router.get('/api',services.getMeta)

module.exports = router;