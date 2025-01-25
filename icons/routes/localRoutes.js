const express = require('express');
const router = express.Router();
const {Local} = require('../local.js')
const {Mongo} = require('../model.js')

router.get('/downloads', async function getLocalDownloads(request,response){
  response.json(Local.get_recent())
})

router.get('/status', async function getLocalStatus(request,response) {
  const local = Local.stats
  const mongo_stat = (await Mongo.ping()) === 'ready'
  const code = Local.ready && mongo_stat ? 100 : Local.ready && !mongo_stat ?  200 : mongo_stat && !Local.ready ? 300 : 400
  const message = code === 100 ? 'ready' : code === 200 ? 'local db ok' : code === 300 ? 'mongo ready' : 'server not ready'
  const status = {
    db_status: mongo_stat ? 'online' : 'offline',
    local_status: Local.ready ? 'online' : 'offline',
    last_stat: Local.started || null,
    local_update_needed: local.updateNeeded || null,
    last_sync: local.lastChangeMs || null,
    last_change: local.lastChange || null,
    local_size: local.count || null,
    local_collections: Local?.collection_names.length || null,
    added: local.added || null, // paginate
    changed: local.changed || null, // paginate
    removed: local.removed || null, // paginate
    code,
    message,
  }
  response.json(status)
})

module.exports = router;
