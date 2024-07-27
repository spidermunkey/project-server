const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const DateTime = require('../../utils/Datetime.js');
const {uuid} = require('../../utils/uuid.js');
const {countFiles} = require('../../utils/readdirp.js');
const IDB = require('./model.js');
const model = IDB;
const rootPathName = 'icons';
const pathToDownloads = "C:/Users/justi/dev/data/downloads";
const targetDirectory = "C:/Users/justi/dev/data/icons";
const fileSystemMap = path.resolve('./local/fsmap.json');
const fileSystemDB = path.resolve('./local/fsdb.json');
const categoryDirectories = ['svg','png','font','icon'];
const exts = ['.svg'];
const subtypeDirectories = ['duotone','bold','fill','light','regular','solid','outlined','outline','thin','medium','bulk','curved','light-outline','two-tone','broken'];
const delimeter = /[\\/]/;
const chokidarConfiguration = {
  // ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

module.exports.Monitor = {
  watchFolder: targetDirectory,
  watcher: null,
  rootName: path.basename(targetDirectory),
  delimeter: /[\\/]/,
  collections: {},
  properties: path.parse(targetDirectory),
  state: {},
  // name: properties.name,
  collections: {},
  count:0,
  approxCount: 0,
  progress:0,
  initial_scan: null,
  scanning: null,
  mode: 'local',
  sync: 'auto',
  connection: '',
  status: null,
  updateNeeded: true,
  inspect:[],
  stats: {},
  async watch() {
    console.time('sync start')
    console.log('scanning target directory')
    this.approxCount = await countFiles(targetDirectory , '.svg');
    console.log('target directory scanned....\n', `count : ${this.approxCount}`);

      console.log('loading state');
      const lastChange = DateTime.from(new Date(fs.statSync(fileSystemMap).mtimeMs));
      console.log('last change',lastChange.string);
      const previousState = this.loadPreviousState();
      const currentState = this.state = await this.getCurrentState();
      const diff = this.compareStates(previousState,currentState);
      const {added,removed,changed} = diff;
      const updateNeeded = this.updateNeeded = this.stats.updateNeeded = [added,removed,changed].some(val => val.length > 0)
      this.stats.added = added;
      this.stats.removed = removed;
      this.stats.changed = changed;
      this.stats.lastChange = lastChange.string;

      if (this.sync == 'auto' && (this.mode == 'both' || this.mode == 'local') && updateNeeded) {
        this.status = this.stats.status = 'update needed';
        console.log('updates found....');
        console.log('files added : ', added.length);
        console.log('files removed : ', removed.length);
        console.log('files changed : ', changed.length);
        console.log(`saving file changes....\n  [[sync]] : ${this.sync}...\n  [[mode]]: ${this.mode}`)
        this.saveCurrentState(currentState);
        console.log('updating database local database');
        await this.updateLocalDB(currentState);
        console.log('local db up to date');
      } else if ( !updateNeeded ) {
        this.status = this.stats.status = 'up to date';
      }

      console.log('loading changes....')
      const local_db = await this.readDB();

      try {
        const size = Math.floor(fs.statSync(fileSystemDB).size / 1000);
        console.log('db size : ', size ,'kb')
        this.stats.size = size;
      } catch(e){
        console.warn('error reading ldb size');
      }
      console.log('inititalizing watcher...')
      if (!this.watcher)
        this.watcher = chokidar.watch(this.watchFolder,chokidarConfiguration)
          .on('add', this.onSingleEntry.bind(this) )
          .on('ready', () => {
            this.initial_scan = true;
            this.stats.perf = console.timeEnd('sync start');
            console.log(this.stats);
            console.log('initial scan complete. Ready for changes');
            resolve(this.stats)
        })
          // .on('addDir', this.onDirectory.bind(this) )



  },

  cleanup() {
    if (this.watcher) {
      this.watcher.close()
        .then(() => console.log('File watcher closed',this.watchFolder));
      this.watcher = null;
      cleanupAndExit()
      return;
    }
  },

  async compileEntry(filepath){
    let progress = (this.count / this.approxCount) * 100
    function updateStatusBar(message) {
      // Move the cursor to the beginning of the line
      readline.cursorTo(process.stdout, 0);
      // Write the message and pad the rest of the line with spaces to clear it
      process.stdout.write(message + ' '.repeat(process.stdout.columns - message.length));
    }
    updateStatusBar(`[[ progress ]]... ${Math.floor(progress)}% .......`)
    // console.clear();
    // console.log('entry created count is : ', this.count);
    // console.log(`progress.... ${Math.floor(progress)}% `, )
    return;
  },
  async onSingleEntry(filepath) {
    if (path.extname(filepath) !== '.svg')
      return;

    if (this.initial_scan == null){
      this.count++;
      this.compileEntry(filepath);
      return;
    }

      const entry = (await createEntry(filepath));

  },

  async getCurrentState() {
    console.log('reading current state');
    const state = {};
    const readDirRecursive = async dir => {
      const items = await fs.promises.readdir(dir, {withFileTypes: true});
      for (const item of items) {
        const itemPath = path.join(dir, item.name);
        if (item.isDirectory()) 
          await readDirRecursive(itemPath)
        else if (item.isFile()) {
          const stats = await fs.promises.stat(itemPath);
          state[itemPath] = stats.mtimeMs;
        }
      }
    }

    await readDirRecursive(targetDirectory);
    console.log('file system state compiled')
    return state;
  },

  saveCurrentState(state) {
    fs.writeFileSync(fileSystemMap, JSON.stringify(state,null,2));
  },

  loadPreviousState() {
    if (fs.existsSync(fileSystemMap) && fs.statSync(fileSystemMap).size > 0){
      try {
      const data = fs.readFileSync(fileSystemMap);
      return JSON.parse(data);
      }catch(e){
        console.warn('error loading previous state',e)
        return {};
      }
    }
    return {};
  },

  compareStates(prevState,currState){
    const added = [];
    const removed = [];
    const changed = [];

    for (const file in currState) {
      if (!prevState.hasOwnProperty(file)){
        added.push(file);
      } else if (prevState[file] !== currState[file]) {
        changed.push(file);
      }
    }

    for (const file in prevState) {
      if (!currState.hasOwnProperty(file)){
        removed.push(file);
      }
    }
    return {added,removed,changed}
  },

  async getLocal(state) {

    if (!state)
      state = await this.getCurrentState();

    const local = {};
    let count = 0;
    for (const file of Object.keys(state)){
      if (path.extname(file) === '.svg'){
        const entry = await createEntry(file);
        const {collection,symlink} = entry;
        if (!local.hasOwnProperty(collection))
          local[collection] = {};
        local[collection][symlink] = entry;
      }
    }
    return local;
  },

  async updateLocalDB(state) {
    const local = this.getLocal(state);
    fs.writeFileSync( fileSystemDB , JSON.stringify(local) );
    this.local = local;
    return local;
  },

  async readDB(){
    if (!this.local)
      this.local = await fs.readJSON(fileSystemDB)
      return this.local;
  }

}

run();

async function run() {
  process.on('SIGINT', Monitor.cleanup.bind(Monitor));
  process.on('SIGTERM', Monitor.cleanup.bind(Monitor));
  process.on('exit', Monitor.cleanup.bind(Monitor));
  const stats = await Monitor.watch();
}

function folders(filename, delime = delimeter) {
  return filename.split(delime);
}
async function directoryName(filename) {
  let fileIsDirectory = await fs.stat(filename).isDirectory() 
  if (fileIsDirectory) return path.basename(filename)
  else return path.basename(path.parse(filename).dir);
}
function getBranch(branchPath, branchStart = path.normalize(targetDirectory)) {
  const branch = folders(branchPath.split(branchStart)[1]).filter(pathname => pathname != "")
  return branch
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
  let filteredFileName = filteredCollectionName.pop();
  let filterSubType = pathname => !subtypeDirectories.includes(pathname.toLowerCase())
  let filterSvgFolder = pathname => pathname.match(/(svg)(s?)/i) === null
  let filteredBranch = filteredCollectionName.filter(filterSubType).filter(filterSvgFolder);
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
  // if (!sub_collection) sub_collection = 'default';
  const ext = path.extname(filepath);
  const fileType = ext == '.svg' ? 'svg' 
                  : ext == '.zip' ? 'zip' 
                  : type == 'directory' ? 'directory' 
                  : null;
  const collection = getCollectionName(filepath);
  let subtype = getSubtype(filepath);
  let markup = fileType === 'svg' ? (await parseSVGFile(filepath)) : null;
  let id = fileType === 'svg' ? uuid() : null;
  let symlink = filepath;
  return {
    name,
    collection,
    sub_collection,
    subtype,
    fileType,
    markup,
    id,
    symlink,
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
      if (markup === '' && (await fs.exists(filepath)) && attemptRead < 3) {
        await new Promise(resolve => setTimeout(resolve, 50)); // wait for file to fully resolve
        attemptRead++;
        await parse(filepath);
      }
      if (markup == '' && attemptRead > 3)
        console.warn('download failed/n attempts: ',attemptRead,filepath);
      return markup;
    }
}

function cleanupAndExit() {
  readline.cursorTo(process.stdout, 0); // Move cursor to the beginning of the line
  console.log('Exiting...');
  process.exit(0); // Exit the process
}
