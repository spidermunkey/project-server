const express = require('express');
const app = express();
const mime = require('mime-types');
const fs = require('fs-extra');

app.get('/fonts', async function(request,response){
  const name = request.query?.name;
  const id = request.query?.id;
  const format = request.query?.format;
  if (name){
    const data = await JSON.parse(await fs.readFile('C:/Users/justi/dev/projects/fonts/server/data/name_index.json'))
    const font = data[name];
    console.log(name)
    console.log(font)
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
    console.log(font)
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

app.get('/fonts/:fontName', async (request,response) => {
})

app.listen(3000,() => {
  console.log('font server listening at localhost::3000')
})
