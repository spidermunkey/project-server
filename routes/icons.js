const express = require('express');
// const cors = require('cors')
const metaController = require('../controllers/userIcons.js')
const router = express.Router();
// router.use(cors())

router.get('/meta/categories', async(req,res) => {
    const data = await metaController.getKnownCategories()
    res.json(data);
})

router.get('/meta/collections', async(req,res) => {
    const data = await metaController.getKnownCollections()
    res.json(data);
})

router.get('/meta',async (req,res) => {
    // res.header("Access-Control-Allow-Origin", "true");
    // res.json('getting user data')
    const data = await metaController.userData()
    // console.log(data)
    res.json(data)
})

router.get('/all', async (req,res) => {
    const data = await metaController.getAllStandardIcons();
    res.json(data)
} )

router.get('/categories/:category',async (req,res) => {
    const cName = req.params.category
    const data = await metaController.getCategoryByName(cName);
    res.json(data)
})

router.post('/collections/create', async (req,res) => {
    const cName = req.body.payload.name
    const data = await metaController.createCollection(cName)
    res.json(data)
})

router.get('/collections/:collection', async (req, res) => {
    const cName = req.params.collection
    const data = await metaController.getCollectionByName(cName);
    console.log(data)
    res.json(data)
})

router.post('/collections/:collection', async (req, res) => {
    const cName = req.params.collection
    const {payload} = req.body
    console.log('post request recieved... payload:',payload)
    const response = await metaController.addToCollection(cName, payload.props, payload.original)
    res.json(response)
})



router.get('/', (req,res) => {
    res.json('hello from icon api')
})

router.get((req,res) => {
    res.status(404)
})

module.exports = router;