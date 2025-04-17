const express = require('express');
const router = express.Router();
const { Mongo } = require('../model.js');

router.post('/colors/:id', async function addIconColrset(request,response){
  const payload = request.body
  const {id,collection,colorset} = payload;
  console.log('SAVING COLORSET')
  console.log(colorset);
  const result = await Mongo.add_icon_colorset(id,collection,colorset);
  response.json(result)
})
router.put('/colors/:id', async function setDefaultColor(request,response){
  const payload = request.body;
  const {id,collection,csid} = payload;
  const result = await Mongo.set_default_color(id,collection,csid)
  response.json(result);
})
router.delete('/colors/:id',async function deleteIconColor(request,response){
  const id = request.params.id
  const csid = decodeURIComponent(request.query.csid)
  const collection = request.query.collection
  const result = await Mongo.delete_icon_color(id,collection,csid);
  response.json(result);
})
router.get('/settings/:id', async function getIconSettings(request,response){
  
})
router.post('/settings/:id', async function saveIconPreset(request,response){
  const { payload } = request.body
  // needs better sanitization
      const {id,collection,setting} = payload
      console.log('PAYLOAD',id,collection,setting)
      const result = await Mongo.add_icon_preset(id,collection,setting)
      response.json(result)
})
router.put('/settings/edit', async function editSettingName(request,response){
  const {payload} = request.body
  const {name,collection,pid,id} = payload
  const props = {name,collectionName:collection,collection,pid,id}
  console.log('PROPS',props)
  const result = await Mongo.update_preset_name(props)
  response.json(result)
})
router.put('/settings/:id', async function applySettingDefault(request,response){
  const { payload } = request.body
  // needs better sanitization
  const {id,collection,pid} = payload;
  const result = await Mongo.set_default_setting(id,collection,pid)
  response.json(result)
})

router.delete('/settings/:id',async function deleteIconPreset(request,response){
  let id = request.params.id
  let pid = decodeURIComponent(request.query.pid)
  let collection = request.query.collection
  const result = await Mongo.delete_icon_preset(id,collection,pid)
  response.json(result)
})

router.get('/:id', async function getByID (request,response) {
  response.json(await Mongo.getIconById(request.params.id));
})

router.post('/', async function search(request,reponse) {
  const {payload} = request.body;
  const query = payload.query
  const userData = await Mongo.search(query)
  reponse.json({query,data:userData})
})

module.exports = router;
