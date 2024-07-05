const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const targetFolder = "C:/Users/justi/Icons/recent";
const watchFolder = "C:/Users/justi/Downloads";
const appFolder = "C:/Users/justi/Icons";
const model = require('../models/icons/model.js');

const isSVG = filename => path.extname(filename) === '.svg';

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
      this.watcher = chokidar.watch(watchFolder,config).on('add', this.onSingleEntry.bind(this) )
    
    console.log('socket active');
  }
  
  cleanup() {
    if (this.watcher) {
      this.watcher.close().then(() => console.log('File watcher closed'));
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
    console.log('FILEPATH',filePath)
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
    console.log('FILENAME',filename)
    let markup = await this.parseSVG(filename);
    return {
      name,
      category,
      markup,
    }
  }
  
  async onSingleEntry(filename) {
    if (isSVG(filename)) {
        let uploadStatus;
        console.log(filename)
        let entry = await this.createSingleEntry(filename);
        this.copySVG(filename)
        
        this.validateEntry(entry)
           ? uploadStatus = await this.uploadSingleEntry(entry)
           : await this.handleUploadFailed(entry)
      }
  }
  
 validateEntry(entry) {
    return entry.markup != '';
  }
  
  async uploadSingleEntry(entry) {
    let status = await model.addToCollection('recent',entry)
    this.broadcastUpload(status)
    return status;
  }

  async broadcastUpload(status) {
    if (this.socket)
      this.socket.send(JSON.stringify({type: 'new entry', data: status }));
  }
  
  async handleUploadFailed(entry) {
    console.error('entry not uploaded \n',entry)
  }
  
 copySVG(filePath, destination = targetFolder) {
  
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
}

// module.exports.watch = function() {

//   chokidar.watch(watchFolder,config).on('add', onSingleEntry )

//   chokidar.watch(appFolder,config)
//     .on('addDir', (dirname,stat) => {
//       console.log('NEW DIR',dirname,stat)
//   })

//   console.log('chokidar is watching for file changes')
// }
