const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const DateTime = require('./Datetime.js');
const targetFolder = "C:/Users/justi/Icons/recent";
const watchFolder = "C:/Users/justi/Downloads";
const appFolder = "C:/Users/justi/Icons";
const model = require('../models/icons/model.js');
const { Console } = require('console');

const isSVG = filename => path.extname(filename) === '.svg';

const config = {
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

async function createSingleEntry(filename) {
  console.log('FILENAME',filename)
  const {name} = path.parse(filename);
  const category = 'recent';
  let attemptRead = 0;
  let markup;
  await parseSVG();
  async function parseSVG() {
    markup = fs.readFileSync(filename,'utf8');
    if (markup === '' && fs.existsSync(filename) && attemptRead < 5) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attemptRead++;
      console.log('file not written maybe a timing issue, trying again')
      console.log('attemps',attemptRead)
      parseSVG();
    }
    if (markup == '' && attemptRead >= 5) {
      console.log('attempt to download file has failed')
      console.log('attempts: ',attemptRead)
    } else {
      console.log('I think it worked')
    }
  }
    
  return {
    name,
    category,
    markup,
  }
}

module.exports.watch = function(fn) {

  chokidar.watch(watchFolder,config)
    .on('add',async (filename,stat) => {
      if (isSVG(filename)) {
      console.log('NEW filename: ',filename, stat);
        const entry = await createSingleEntry(filename);
        console.log('ENTRY',entry)
        copySVG(filename)
        if (entry.markup != ''){
          let status = await model.addToCollection('recent',entry)
          fn(status)
        } else 
          console.log('entry not uploaded')
      }
  })

  chokidar.watch(appFolder,config)
    .on('addDir', (dirname,stat) => {
      console.log('NEW DIR',dirname,stat)
  })

  console.log('chokidar is watching for file changes')
}

function copySVG(filePath, destination = targetFolder) {

  console.log(`SVG file downloaded: ${filePath}`);
  const fileName = path.basename(filePath);
  const newFilePath = path.join(destination, fileName);

  if (!fs.existsSync(destination)) 
    fs.mkdirSync(destination, { recursive: true });

  fs.copyFileSync(filePath, newFilePath),  error => error 
  ? console.error(`Error moving file ${filePath} to ${newFilePath}: ${error}`)
  : console.log(`Moved file ${filePath} to ${newFilePath}`)

  console.log(`SVG file added: ${fileName}`);

}
