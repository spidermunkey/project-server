const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

const rootPathName = 'icons'
const pathToDownloads = "C:/Users/justi/dev/data/downloads";
const targetDirectory = "C:/Users/justi/dev/data/icons";
const categoryDirectories = ['svg','png','font','icon'];
const exts = ['.svg'];
const subtypeDirectories = ['duotone','bold','fill','light','regular','solid','outlined','thin','medium','bulk','curved','light-outline','two-tone','broken'];
const delimeter = /[\\/]/;

const chokidarConfiguration = {
  // ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

const Monitor = {
  watchFolder: targetDirectory,
  watcher: null,
  rootName: path.basename(targetDirectory),
  delimeter: /[\\/]/,
  collections: {},
  properties: path.parse(targetDirectory),
  name: properties.name,
  collections: {},
  
  watch() {
    if (!this.watcher) 
      this.watcher = chokidar.watch(this.watchFolder,chokidarConfiguration)
        .on('add', this.onSingleEntry.bind(this) )
        // .on('addDir', this.onDirectory.bind(this) )
    return 
  },
  cleanup() {
    if (this.watcher) {
      this.watcher.close()
        .then(() => console.log('File watcher closed',this.watchFolder));
      this.watcher = null;
    }
  },
  async onSingleEntry(filepath) {
      if (path.extname(filepath) !== '.svg')
        return;
      const entry = (await createEntry(filename))
  }
}

process.on('SIGINT', Monitor.cleanup.bind(Monitor));
process.on('SIGTERM', Monitor.cleanup.bind(Monitor));
process.on('exit', Monitor.cleanup.bind(Monitor));

function folders(filename, delime = delimeter) {
  return filename.split(delime);
}
async function directoryName(filename) {
  let fileIsDirectory = await fs.stat(filename).isDirectory() 
  if (fileIsDirectory) return path.basename(filename)
  else return path.basename(path.parse(filename).dir);
}
function getBranch(branchPath, branchStart = targetDirectory) {
  return folders(branchPath.split(branchStart)[1]).filter(pathname => pathname != "")
}

function getSubtype(dirname){
  let branch = getBranch(dirname)
  for (let folder of branch) {
    if (subtypeDirectories.includes(folder.toLowerCase()))
      return folder;
  }
  return null;
}

function getSubcollection(dirname) {
  let branch = getBranch(dirname);
  let filteredCollectionName = branch.slice(1);
  let filteredFileName = filteredCollectionName.slice(-1);
  let filterSubType = filepath => !subtypeDirectories.includes(filepath)
  let filterSvgFolder = filepath => filepath.match(/(svg)(s?)/i) === null
  let filteredBranch = filteredFileName.filter(filterSubType).filter(filterSvgFolder);
  let code = filteredBranch.length;
  if (code === 1)
    return filteredBranch[0]
  else if (code === 0)
    return null
  else if (code > 1)
    return undefined;
}

function getCollectionName(filepath){
     return getBranch(filepath)[0];
}

async function createEntry(filepath){
  const name = path.parse(filepath).name;
  const type = (await fs.stat(filepath)).isDirectory() ? 'directory' : 'file';
  const sub_collection = type == 'file' ? getSubcollection(filepath) : null;
  const ext = path.extname(filepath);
  const fileType = ext == '.svg' ? 'svg' 
                  : ext == '.zip' ? 'zip' 
                  : type == 'directory' ? 'directory' 
                  : null;
  const collection = getCollectionName(filepath);
  let subtype = getSubtype(filepath);
  let markup = fileType === 'svg' ? (await parseSVGFile(filepath)) : null;
  return {
    name,
    collection,
    sub_collection,
    subtype,
    fileType,
    markup,
    stamp: Date.now(),
  }
}

async function parseSVGFile(filepath) {
    let markup;
    let attemptRead = 0;
    await parse(filepath);
    return markup;
    async function parse(filepath){
      markup = await fs.readFile(filepath,'utf8');
      if (markup === '' && (await fs.exists(filepath)) && attemptRead < 5) {
        await new Promise(resolve => setTimeout(resolve, 50)); // wait for file to fully resolve
        attemptRead++;
        await parse(filepath);
      }
      if (markup == '' && attemptRead >= 5)
        console.warn('download failed/n attempts: ',attemptRead);
      return markup;
    }
}
