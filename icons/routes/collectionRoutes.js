const express = require('express');
const router = express.Router();
const { Mongo } = require('../model.js');

router.get('/info', async function getCollectionData(request,response){
  result = await Mongo.get_data_formated()
  console.dir(result)
  response.json(result)
})

router.get('/info/names', async function getCollectionNames(request,response) {
  response.json(await Mongo.get_collection_names());
})

router.get('/settings', async function getCollectionSettings(request,response){
  
})

router.post('/settings',async function addCollectionSetting(request,response){
  const { payload } = request.body;
  // needs better sanitization
  const {cid,setting} = payload;
  console.log('PAYLOAD', cid , setting )
  const result = await Mongo.add_collection_preset(cid,setting);
  response.json(result);
})
router.delete('/settings',async function deleteCollectionSetting(request,response){
  let cid = decodeURIComponent(request.query.cid)
  let pid = decodeURIComponent(request.query.pid)
  const result = await Mongo.delete_collection_preset(cid,pid)
  response.json(result);
})

router.put('/settings', async function applySettingDefault(request,response){
    const { payload } = request.body
    // needs better sanitization
    const {collection,preset} = payload;
    const result = await Mongo.set_collectionDefault_setting(collection,preset)
    response.json(result)
})
router.put('/settings/:collection', async function clearDefaultSetting(request,response){
  const collection = request.params.collection
  const result = await Mongo.clear_collectionDefault_setting(collection)
  response.json(result)
})

router.post('/create', async function createCollection (request,response) {
  const data = await Mongo.create_collection(request.body.payload.props)
  response.json(data)
})

router.post('/sync', async function sync_collection(request,response){
  console.log('syncing local collection')
  const { payload } = request.body
  if (!payload?.cid)
      return response.json({message: 'upload failed', success: false, reason: 'invalid collection id'})
  let cid = payload.cid;
  let collection = Local.getCollectionById(cid);
  if (collection) {
    console.log('collection found',collection)
    console.log('checking mongo')
    const isSync = await Mongo.check_collection_id(collection.cid)
    console.log('cloud sync status', isSync)
    if (!isSync){
      console.log('syncing collection',collection.name,collection.cid)
      try {
        const data = Local.get_collection(collection.name)[0]
        const status = await Mongo.sync_collection( data )
        if (status.success == true) {
          Local.update_collection(data.cid, {synced:true})
        }
        console.log('upload status done',status)
        response.json(status)
      } catch(e) {
        response.json('error syncing collection', e )
      }
    }
  }
})

router.post('/ignore', async function ignore_collection(request,response){
  console.log('ignoring collection')
  const { payload } = request.body
  if (!payload?.cid){
     response.json({message: 'upload failed', success: false, reason: 'invalid collection id'})
     return
  }
  let cid = payload.cid
  let done = Local.ignore(cid)
  let confirmed = Local.getCollectionById(cid).ignored == true
  if (confirmed) console.log('CONFIRMED')
  response.json({message: 'proccess complete', success: confirmed, reason: null})
})

router.delete('/:collectionID', async function dropCollection(request,response){
  const collection = request.params.collectionID;
  const result = await Mongo.remove_collection(collection);
  if (result.success == true) await Local.update_collection(result.id, {synced:false})
  response.json(result)
})

router.post('/:collectionID/:id',async function searchCollection(request,response){
  
})

router.get('/:collectionID', async function getCollection (request, response) {
  const cName = request.params.collectionID;
  const filter = request.query.filter;
  let filters = {subtypes:[],sub_collections:[]};
  if (filter === 'true'){
      filters['subtypes'] = decodeURIComponent(request.query.st).split(',').filter(i => i != '' && i != null && i != undefined);
      filters['sub_collections'] = decodeURIComponent(request.query.sc).split(',').filter(i => i != '' && i != null && i != undefined);
      console.log('FILTERS RECIEVED',filters)
  }
  const page = request.query?.page;
  const limit = request.query?.limit;
  const data = await Mongo.get_collection({ page , limit, filters }, cName );
  response.json(data);
})

router.put('/:collectionID', async function editCollection(request,response){
  
})

router.post('/:collectionID', async function addToCollection (request, response) {
  const { payload } = request.body;
  if (request.params.collectionID == payload.props.collection){
      const result = await Mongo.addToCollection(payload.props)
      response.json(result)
  } else {
      response.json({message: 'upload failed', success: false, reason: 'invalid collection name'})
      return
  }
})

router.get('/', async function getCollections(request,response) {
  const result = Local.get_all_collections(true);
  response.json(result);
})

module.exports = router
