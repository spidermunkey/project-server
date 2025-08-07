const express = require('express');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs-extra');
const path = require('path')

router.use(express.static(path.join(__dirname, '..' ,'public','fonts')));

router.get('/meta', async function(request,response){
  const name = request.query?.name;
  const id = request.query?.id;
  const format = request.query?.format;
  if (name){
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/name_index.json'))
    const font = data[name];
    if (font) {
      const path = font.filepath;
      const readStream = fs.createReadStream(path);
      readStream.pipe(response);
    } else {
      response.json(data);
    }
  }
  else if (id){
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/id_index.json'))
    const font = data[id];
    response.json({})
    // const path = font.path;
    // const readStream = fs.createReadStream(path);
    // readStream.pipe(response);
  }
  else {
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/fonts.json'))
    response.json(data)
  }

})

router.get('/font/:fontName', async (request,response) => {
  const name = request.params?.fontName;
  const id = request.query?.id;
  const format = request.query?.format;
  if (name){
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/name_index.json'))
    const font = data[name];
    const path = font.filepath;
    const readStream = fs.createReadStream(path);
    readStream.pipe(response);
  }
  else if (id){
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/id_index.json'))
    const font = data[id];
    response.json({})
    // const path = font.path;
    // const readStream = fs.createReadStream(path);
    // readStream.pipe(response);
  }
  else {
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/fonts.json'))
    response.json(data)
  }

})

router.get('/', (request,response) => response.sendFile(path.join(__dirname, '..', 'public', 'fonts', 'index.html')));
router.get('*',(req,res) => res.status(404).json("404 not found"));
module.exports = router