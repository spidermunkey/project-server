/*  */

const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const targetFolder = "C:/Users/justi/Icons/recent";
const watchFolder = "C:/Users/justi/Downloads";
const appFolder = "C:/Users/justi/Icons";
const model = require('../models/icons/model.js');

const config = {
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

module.exports.FsMonitor = class {

  constructor(socketServer) {

    this.socketServer = socketServer;
    this.watcher = null;
    socketServer.on('connection', this.handleSocket.bind(this))
    
    // Listen for server termination signals to clean up the watcher
    process.on('SIGINT', this.cleanup.bind(this));
    process.on('SIGTERM', this.cleanup.bind(this));
    process.on('exit', this.cleanup.bind(this));
  }

  watch() {
    if (!this.watcher) 
      this.watcher = chokidar.watch(watchFolder,config)
        .on('add', this.onSingleEntry.bind(this) )
    
    console.log('socket active');
  }
  
  cleanup() {
    if (this.watcher) {
      this.watcher.close()
        .then(() => console.log('File watcher closed'));
      this.watcher = null;
    }
  }

  handleSocket(socket) {
    console.log('socket connected')
    this.socket = socket
    socket.send(JSON.stringify({ type: 'status', message:'listening for updates'}));
    this.watch();
    socket.on('message', function incoming(message) {
        console.log('recieved: %s', message);
        // socket.send('test');
    })
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
  
  async createSingleEntry(filename) {
    const {name} = path.parse(filename);
    const category = 'recent';
    let markup = await this.parseSVG(filename);
    return {
      name,
      category,
      markup,
    }
  }
  
  async onSingleEntry(filename) {
    if (await isValidSvg(filename)) {
        this.broadcastUpload(
          (await this.uploadSingleEntry(
            (await this.createSingleEntry(filename)))))
            
        await this.copySVG(filename)
      }
  }

  async parseDirTree(dirname){
    
  }

  parseSVGDirectory(){}

  async uploadSingleEntry(entry) {
    let status = await model.addToCollection('recent',entry);
    status.success == false 
      ? this.handleUploadFailed(status)
      : this.handleUploadSuccess()
    return status;
  }

  async broadcastUpload(status) {
    status.success == false 
      ? console.log('entry upload faileds [reason] : ', status.reason)
      : console.log('entry uploaded to db : ', 'success')

    this.socket 
      ? this.socket.send(JSON.stringify({type: 'new entry', data: status }))
      : console.log('broadcast failed, socket not active')
  }
  
  handleUploadFailed({reason}) {
    console.log('entry upload faileds [reason] : ', reason)
  }
  handleUploadSuccess() {
    console.log('entry uploaded to db sending status via socket [status] : ', 'success')
  }
  
 async copySVG(filePath, destination = targetFolder) {
  
    const fileName = path.basename(filePath);
    const newFilePath = path.join(destination, fileName);
  
    if (!await fs.exists(destination)) 
      await fs.mkdir(destination, { recursive: true });
  
    await fs.promises.copyFile(filePath, newFilePath);
    console.log(`SVG file copied: ${fileName}`);
  
  }
}

function isValidSvg(filePath) {
  console.log(path.dirname(filePath),watchFolder)
  console.log(path.dirname(filePath) === watchFolder)
  if (path.extname(filePath) === '.svg' && path.dirname(filePath) === watchFolder)
    return filePath;
  else return ''
}

/* 
Example of Common File Signatures

    ZIP files: 50 4B 03 04 (hexadecimal)
    PDF files: 25 50 44 46 (hexadecimal for %PDF)
    JPEG files: FF D8 FF E0 (hexadecimal)
    PNG files: 89 50 4E 47 0D 0A 1A 0A (hexadecimal)
*/
