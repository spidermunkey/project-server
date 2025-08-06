const fs = require('fs-extra');
const path = require('path');
const {uuid} = require('./utils/uuid');
const {countFiles} = require('./utils/readdirp');

exports.compile_fonts = compile_fonts;

async function compile_fonts() {
  const dir = "C:/Users/justi/dev/data/fonts";

  const data = [];
  const name_index = {};
  const id_index = {};

  const folders = await fs.readdir(dir,{withFileTypes:true});
  for (const item of folders){
    const name = item.name;
    const fontName = name.split(/[_-]/).join(' ');
    if (item.isFile()){
      // single file

    } else if (item.isDirectory()){
      // parse directory
      const fontData = await parse_font_directory(path.join(dir,item.name));
      fontData.forEach(font => {
        name_index[font.name] = font
        id_index[font.id] = font
      })
      data.push({
        name: fontName,
        cid: uuid(),
        count: await countFiles(path.join(dir,item.name),['.ttf','.otf','.wof']),
        fonts: fontData,
    })
  }
  }
  return {data,name_index,id_index};
}

async function overwrite(){
  const {data,name_index,id_index} = await compile_fonts();
  await fs.writeJSON(path.resolve('.','data/fonts.json'),data)
  await fs.writeJSON(path.resolve('.','data/id_index.json'),id_index)
  await fs.writeJSON(path.resolve('.','data/name_index.json'),name_index)
}

async function parse_font_directory(dir) {
  const data = [];
  const isFont = filename => {
    let ext = path.extname(filename);
    return ext === '.ttf' || ext === '.woff' || ext === '.otf' || ext === '.woff2'
  }
  async function readdir_recursive(dir){
    const directory = await fs.readdir(dir,{withFileTypes:true});

    for (const item of directory){
      if (item.isFile() && isFont(item.name)){
        const name = path.basename(item.name).split('.')[0];
        const format = path.basename(item.name).split('.')[1];
        const id = uuid();
        const filepath = path.join(item.path,item.name);
        const size = Math.round((await fs.stat(path.join(item.path,item.name))).size / 1000);
        const font = {
          id,
          name,
          filepath,
          format,
          size,
        };
        data.push(font);
        
      } else if (item.isDirectory()){
        await readdir_recursive(path.join(dir,item.name))
      }
    }
  }
  await readdir_recursive(dir);
    // if (dir.match(/aguila-thin/)){
    //   console.log(data)
    // }
  return data

}

overwrite();
