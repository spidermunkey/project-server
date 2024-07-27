const {FsModel} = require('./model.js');
const model = new FsModel();
const path = require('path');
const fs = require('fs');

module.exports.FsController = class {

  constructor(collectionName){
    this.name = collectionName;
    this.collections = {};
  }

  async onEntry(entry){
    const payload = await this.createSingleEntry(entry)
    // const result = await model.addToCollection(this.name,payload)
  }

  notify(entry) {
    this.onEntry(entry)
  }

  async parseSVG(filePath) {
    let markup;
    let attemptRead = 0;
    await parse(filePath);
    return markup;
    async function parse(filePath){
      markup = fs.readFileSync(filePath,'utf8');
      if (markup === '' && fs.existsSync(filePath) && attemptRead < 5) {
        await new Promise(resolve => setTimeout(resolve, 50)); // wait for file to fully resolve
        attemptRead++;
        await parse(filePath);
      }
      if (markup == '' && attemptRead >= 5)
        console.warn('download failed/n attempts: ',attemptRead);
      return markup;
    }
  }
  
  async createSingleEntry(entry) {
    const {name,subtype,filepath} = entry;
    const collection = this.name;
    let markup = await this.parseSVG(filepath);
    const payload = {
      name,
      collection,
      markup,
      subtype,
    }

    // console.log('entry qued', payload)
    return payload;
  }

  isValidSvg(filePath) {
    if (path.extname(filePath) === '.svg' && path.dirname(filePath) === watchFolder)
      return filePath;
    else return ''
  }

  broadcastEntry(entry) {

  }

}
