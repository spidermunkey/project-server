const express = require('express')
// const cors = require('cors')
const metaController = require('../../controllers/icons/controller.js')
const router = express.Router()
const {Local} = require('../../models/icons/local/monitor.js')
// router.use(cors())

const getRandom = async(req,res) => {
    console.log('fetching random sample')
    const collection = req.params.collection;
    const n = req.query.n;
    console.log('getting random',collection,n)
    const data = await metaController.getRandom(n,collection)
    res.json(data);
}
const getCategoryNames = async(req,res) => {
    const data = await metaController.getKnownCategories()
    res.json(data);
}
const getCategory = async (req,res) => {
    const cName = req.params.category
    const data = await metaController.getCategoryByName(cName);
    res.json(data)
}
const getCollectionNames = async(req,res) => {
    const data = await metaController.getKnownCollections()
    res.json(data);
}
const getCollection = async (req, res) => {
    const cName = req.params.collection
    const data = await metaController.getCollectionByName(cName);
    res.json(data)
}
const getMeta = async (req,res) => {
    const data = await metaController.userData()
    res.json(data)
}
const search =  async (req,res) => {
    // console.log(req)
    const query = req.body.query
    const userData = await metaController.search(query)
    // console.log(userData)
    res.json({query,data:userData})
}
const getByID = async (req,res) => {
    const id = req.params.id;
    const data = await metaController.getIconById(id);
    res.json(data);
}
const getData = async (req,res) => {
    const data = await metaController.getAllStandardIcons();
    const knownCollections = await metaController.getKnownCollections();
    const knownCategories = await metaController.getKnownCategories();
    const meta = await metaController.userData();
}
const addToCollection = async (req, res) => {
    const cName = req.params.collection
    const {payload} = req.body
    const response = await metaController.addToCollection(payload.collection, payload.props, payload.original)
    res.json(response)
}
const createCollection = async (req,res) => {
    const cName = req.body.payload.name
    const data = await metaController.createCollection(cName)
    res.json(data)
}

const logFavorite = async (req,res) => {
    const {cid,id,type} = req.body.props;
    const response = await metaController.logFavorite({cid,id,type});
    res.json(response);
}

const nulp = () => null

// GET
router.get('/random/:collection', getRandom)
router.get('/random', getRandom)

router.get('/meta/categories', getCategoryNames)
router.get('/meta/collections', getCollectionNames)
router.get('/meta', getMeta)
router.get('/all/:id', getByID)
router.get('/app', getData)
router.get('/categories',nulp)
router.get('/categories/:category',getCategory)
router.get('/collections/:collection', getCollection)

// POST
router.post('/collections/create',createCollection )
router.post('/collections', addToCollection)
router.post('/all', search)
router.post('categories',logFavorite)

// CATCH
router.get('/local', (req,res) => {
    res.json(Local.db.collection_names)
})
router.get('/', (req,res) => {
    res.json('hello from icon api')
})

router.get((req,res) => {
    res.status(404)
})

module.exports = router;
