const express = require('express')
const router = express.Router()
const collectionRoutes = require('./routes/collectionRoutes.js')
const iconRoutes = require('./routes/iconRoutes.js')
const localRoutes = require('./routes/localRoutes.js')

router.use(require('./middleware/parsePayload.js'))

router.use('/collections', collectionRoutes )
router.use('/local', localRoutes )
router.use('/all', iconRoutes )

router.get('/', (request,response) => response.json('hello from icon api'))
router.get((request,response) => response.status(404))

module.exports = router;
