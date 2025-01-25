const express = require('express')
const router = express.Router()
const url = require('url');
const {Local} = require('./local.js');
const {Mongo} = require('./model.js');

async function route_db(req,res,next){
  req.status = (await Mongo.ping()) === 'online' ? 'ok' : 'offline';
  next();
}

router.use(route_db)
router.get('/test', async (req,res) => {
  res.json(await Mongo.get_all_data())
})
router.get('/info/:name', async (req,res)=>{
  let model = req.status === 'ok' ? Mongo : Local;
  res.json(await model.get_data(req.params.name))
})

router.get('/icons/:name', async (req,res)=> {
  let model = req.status === 'ok' ? Mongo : Local;

  const query = req.query;
  if (query.hasOwnProperty('n') && typeof Number(query.n) === 'number'){
    res.json(await model.get_icons(req.params.name,query.n))
    return;
  }
  res.json(await model.get_collection(req.params.name))
})
router.get('/info',async (req,res)=>{
  let model = req.status === 'ok' ? Mongo : Local;
  console.log('STATUS',req.status)
  res.json(await model.stat())
})
router.get('/icons',async (req,res)=>{

  let model = req.status === 'ok' ? Mongo : Local;
  res.json(await model.get_all_collections())

})

router.get('/status', async (req,res)=>{

  const local = Local.stats;
  const mongo_stat = (await Mongo.ping()) === 'ready';
  console.log(mongo_stat)
  const code = Local.ready && mongo_stat ? 100 : Local.ready && !mongo_stat ?  200 : mongo_stat && !Local.ready ? 300 : 400;
  const message = code === 100 ? 'ready' : code === 200 ? 'local db ok' : code === 300 ? 'mongo ready' : 'server not ready';
  const status = {
    db_status: mongo_stat ? 'online' : 'offline',
    local_status: Local.ready ? 'online' : 'offline',
    last_stat: Local.started || null,
    local_update_needed: local.updateNeeded || null,
    last_sync: local.lastChangeMs || null,
    last_change: local.lastChange || null,
    local_size: local.count || null,
    local_collections: Local.db?.collection_names?.length || null,
    added: local.added || null, // paginate
    changed: local.changed || null, // paginate
    removed: local.removed || null, // paginate
    code,
    message,
  }

  res.json(status)
})
router.get('/',async (req,res) => {
  let model = req.status === 'ok' ? Mongo : Local;
  res.json(await model.db.collection_names)
})

module.exports = router;
