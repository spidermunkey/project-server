const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const targetFolder = "C:/Users/justi/Icons/recent";
const watchFolder = "C:/Users/justi/Downloads";
const appFolder = "C:/Users/justi/Icons";
const model = require('../models/icons/model.js');

const { parseStringPromise } = require('xml2js');
const sanitizeHtml = require('sanitize-html');

const isSVG = filename => path.extname(filename) === '.svg';

const config = {
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

class File {
  constructor(){

  }

  static open(filePath){
    fs.readFileSync(filePath,'utf8');
    fs.existsSync(filePath)
  }
}

class FsMonitor {

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
    console.log('socket connected');
    this.socket = socket;
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

  async parseDirTree(dirname){
    
  }

  parseSVGDirectory(){}
  
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

function isZipFile(filePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, { start: 0, end: 3 });
    let fileSignature = '';

    readStream.on('data', (chunk) => {
      fileSignature = chunk.toString('hex').toUpperCase();
    });

    readStream.on('end', () => {
      // ZIP file signature is "50 4B 03 04"
      const zipSignature = '504B0304';
      resolve(fileSignature === zipSignature);
    });

    readStream.on('error', (err) => {
      reject(err);
    });
  });
}

async function isValidSvg(filePath) {
  try {
    const buffer = Buffer.alloc(100); // Read the first 100 bytes
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);

    const fileContentHeader = buffer.toString('utf8');

    // Perform a quick initial check for the XML declaration or <svg> tag
    if (!fileContentHeader.includes('<?xml') && !fileContentHeader.includes('<svg')) {
      throw new Error('Invalid SVG file: missing XML declaration or <svg> tag');
    }

    // If the initial check passes, read the entire file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse the XML
    const result = await parseStringPromise(fileContent);
    if (!result.svg) {
      throw new Error('Invalid SVG root element');
    }

    // Sanitize the SVG
    const cleanSvg = sanitizeHtml(fileContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'text', 'tspan']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        svg: ['xmlns', 'width', 'height', 'viewBox', 'version'],
        g: ['transform'],
        path: ['d', 'fill', 'stroke', 'stroke-width'],
        circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
        rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width'],
        line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width'],
        polygon: ['points', 'fill', 'stroke', 'stroke-width'],
        polyline: ['points', 'fill', 'stroke', 'stroke-width'],
        ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
        text: ['x', 'y', 'font-family', 'font-size', 'fill', 'stroke', 'stroke-width'],
        tspan: ['x', 'y']
      }
    });

    // Return sanitized SVG if it passed all checks
    return cleanSvg;

  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

// Usage example
// isValidSvg(filePath)
//   .then((cleanSvg) => {
//     if (cleanSvg) {
//       console.log(`${filePath} is a valid and sanitized SVG file.`);
//       console.log(cleanSvg);
//     } else {
//       console.log(`${filePath} is not a valid SVG file.`);
//     }
//   })
//   .catch((err) => {
//     console.error('Error checking file:', err);
//   });

/* 
Example of Common File Signatures

    ZIP files: 50 4B 03 04 (hexadecimal)
    PDF files: 25 50 44 46 (hexadecimal for %PDF)
    JPEG files: FF D8 FF E0 (hexadecimal)
    PNG files: 89 50 4E 47 0D 0A 1A 0A (hexadecimal)
*/
// module.exports.watch = function() {

//   chokidar.watch(watchFolder,config).on('add', onSingleEntry )

//   chokidar.watch(appFolder,config)
//     .on('addDir', (dirname,stat) => {
//       console.log('NEW DIR',dirname,stat)
//   })

//   console.log('chokidar is watching for file changes')
// }
