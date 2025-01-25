const chokidar = require('chokidar');
const fs = require('fs-extra');
const sizeof = require('object-sizeof');
const zlib = require('zlib');
const util = require('util');
const gzip = util.promisify(zlib.gzip)
const path = require('path');
const readline = require('readline');
const DateTime = require('../../../utils/Datetime.js');
const {uuid} = require('../../../utils/uuid.js');
const {countFiles} = require('../../../utils/readdirp.js');
const IDB = require('../model.js');
const model = IDB;
const rootPathName = 'icons';  
const pathToDownloads = "C:/Users/justi/dev/data/downloads";
const targetDirectory = "C:/Users/justi/dev/data/icons";
const fileSystemMap = 'C:/Users/justi/dev/project-server/models/icons/local/fsmap.json';
const fileSystemDB = 'C:/Users/justi/dev/project-server/models/icons/local/fsdb.json';
const fileSystemLog = 'C:/Users/justi/dev/project-server/models/icons/local/fslog.json';
const categoryDirectories = ['svg','png','font','icon'];
const exts = ['.svg'];
const subtypeDirectories = ['duotone','bold','fill','light','regular','solid','outlined','outline','thin','medium','bulk','curved','light-outline','two-tone','broken'];
const delimeter = /[\\/]/;
const v8 = require('v8');

const chokidarConfiguration = {
  // ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
}

module.exports.Monitor = Monitor = {
  // onupdateneeded
  // onready
  watchFolder: targetDirectory,
  watchConfig: chokidarConfiguration,
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
  sync: 'auto', // auto | manual | cron 
  connection: '',
  status: null,
  updateNeeded: true,
  inspect:[],
  stats: {},
  
  async watch(target = this.watchFolder, config = this.watchConfig) {
    let stats = await stat();
    
    if (this.sync == 'auto' && (this.mode == 'both' || this.mode == 'local') && stats.updateNeeded) {
        this.status = 'update needed';
        console.log(`saving file changes....\n  [[sync]] : ${this.sync}...\n  [[mode]]: ${this.mode}`)
        saveCurrentStateMap();
        console.log('updating database local database');
        await updateLocalDB();

        if (this.onUpdateNeeded) this.onUpdateNeeded(stats)
        console.log('local db up to date');

      } else if ( !stats.updateNeeded ) {
        this.status = stats.status = 'up to date';
      }

      console.log('inititalizing watcher...')

      if (!this.watcher)
        this.watcher = chokidar.watch(config,chokidarConfiguration)
          .on('add', this.onSingleEntry.bind(this) )
          .on('ready', () => {
            this.initial_scan = true;
            stats.perf = console.timeEnd('sync start');
            console.log(stats);
            console.log('initial scan complete. Ready for changes');
            if (this.onReady) this.onReady(stats)
            // resolve(this.stats)
        })
        else {
          console.log('already watching for file system changes')
        }
          // .on('addDir', this.onDirectory.bind(this) )
  },

  close() {
    if (this.watcher) {
      this.watcher.close()
        .then(() => console.log('File watcher closed',this.watchFolder));
      this.watcher = null;
      cleanupAndExit()
      return;
    }
  },

  // async stat() {
  //   console.log('scanning target directory')
  //   this.approxCount = await countFiles(targetDirectory , '.svg');
  //   console.log('target directory scanned....\n', `count : ${this.approxCount}`);

  //     console.log('loading state');
  //     const lastChange = DateTime.from(new Date(fs.statSync(fileSystemMap).mtimeMs));
  //     console.log('last change',lastChange.string);

  //     const previousState = loadCurrentStateMap();
  //     const currentState = this.state = await loadCurrentStateMap();

  //     const diff = this.compareStates(previousState,currentState);
  //     const {added,removed,changed} = diff;
  //     const updateNeeded = this.updateNeeded = this.stats.updateNeeded = [added,removed,changed].some(val => val.length > 0)
  //     this.stats.added = added;
  //     this.stats.removed = removed;
  //     this.stats.changed = changed;
  //     this.stats.lastChange = lastChange.string;
  //     this.stats.lastChangeMs = lastChange.milisecondsAgo;

  //     try {
  //       const size = Math.floor(fs.statSync(fileSystemDB).size / 1000);
  //       console.log('db size : ', size ,'kb')
  //       this.stats.size = size;
  //     } catch(e){
  //       console.warn('error reading local_db size');
  //     }
  //     if (updateNeeded) {
  //       console.log('updates found....');
  //       console.log('files added : ', added.length);
  //       console.log('files removed : ', removed.length);
  //       console.log('files changed : ', changed.length);
  //     }

  //     return this.stats;
  // },

  async compileEntry(filepath){

    // let progress = (this.count / this.approxCount) * 100
    // function updateStatusBar(message) {
    //   // Move the cursor to the beginning of the line
    //   readline.cursorTo(process.stdout, 0);
    //   // Write the message and pad the rest of the line with spaces to clear it
    //   process.stdout.write(message + ' '.repeat(process.stdout.columns - message.length));
    // }
    // updateStatusBar(`[[ progress ]]... ${Math.floor(progress)}% .......`)
    // // console.clear();
    // // console.log('entry created count is : ', this.count);
    // // console.log(`progress.... ${Math.floor(progress)}% `, )
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
      if (this.onUpdateNeeded) this.onUpdateNeeded(entry)

  },
}

module.exports.Local = local_db = {
  ready: false,

  async init() {
    // updateLocalDB();
    if (this.ready)
      return this.db;
    
    this.stats = await stat();
    this.db = readDB();
    this.ready = true;
    this.status = 'online';
    return true;
  },

  get_collection_names(){
    return this.db.collection_names;
  },

  get_all_collections(){
    return this.get_collection(...this.get_collection_names());
  },
  get_all_data() {
    return this.get_data(...this.get_collection_names())
  },

  get_collection(...collection_names){ // { icons | name | meta }
    return collection_names.map( name => this.collection(name,true)) 
  },

  get_data(...collection_names) {
    return collection_names.map( name => this.collection(name,false)) 
  },

  getCollectionById(cid){
    let found = null;
    for (const collection_name in this.db.collections){
      let collection = this.collection(collection_name)
      if (collection.cid === cid)
        found = collection;
    }
    return found
  },

  collection(collection_name, withIcons = false) {
    if (!this.collection_exists(collection_name))
      return;

    let collection = this.db.collections[collection_name];
    if (withIcons)
      return collection
    else {
      const {
        cid,
        subtypes,
        sub_collections,
        size,
      } = collection;
      return {collection_name,cid,subtypes,sub_collections,size}
    }

  },

  collection_exists(collection_name) {
    return this.db.collection_names.includes(collection_name);
  },

  get_icons(collection_name) {
    if (!this.collection_exists(collection_name))
      return err_collection_noexists
    
    return this.collection(collection_name,true).icons;
  },

  find(id,collection){
    console.time('finding')
    if(!collection){
      const item = this.db.index_id[id];
      console.timeEnd('finding')
      return item;

    }

    else{
    let coll = this.collection(collection,true);
      if (coll.icons && coll.icons.length > 0){
        let item = coll.icons.find(props => props.id === id)
        console.timeEnd('finding');
        return item
      } else{
        console.timeEnd('finding');
        console.log('not found')
      }
  }

  },

  findByName(filter,collection){
    if (typeof filter !== 'string' )
      return [];

    if (collection){
      console.time('findbyname');
      const coll = this.collection(collection,true);
      if (!coll) {
        console.timeEnd('findbyname');
        return [];
      }
      const results = coll.icons.filter(props => props.name === filter);
      console.timeEnd('findbyname')
      return results;
    }

    let result = this.db.index_name[filter];
    if (result != undefined)
      return result;
    return []
  },

  search(filter,collection){
    console.time('search')
    if (collection){
      const coll = this.collection(collection,true);
      if (!coll) return console.timeEnd('search');
      const results = coll.icons.filter(props => filter.test(props.name))
      console.timeEnd('search')
      return results;
    }
    if (filter instanceof RegExp) {
      console.time('regex find')
      const keys = Object.keys(this.db.index_name).filter(key => filter.test(key));
      const results = keys.map(key => this.db.index_name[key]).flat(1);
      console.timeEnd('regex find')
      return results
    }

  },

  add(entry){
    const {collection,subtype,sub_collection,id,name} = entry;
    if (this.db.index_id.hasOwnProperty(id))
      return {};
    
    const collection_exists = this.db.collections.hasOwnProperty(collection)
    const hasSubtype = subtype != undefined;
    const hasSubCollection = sub_collection != undefined;
    if (!collection_exists) {
      this.db.collections[collection] = {
        cid: uuid(),
        subtypes: [],
        sub_collections: [],
        icons: [],
        size: 0,
      }
      this.db.collection_names.push(collection)
    }

    this.db.index_id[id] = entry;
    this.db.index_name.hasOwnProperty(name)
      ? this.db.index_name[name].push(entry)
      : this.db.index_name[name] = [entry];

    let _collection = this.db.collections[collection];
    
    if (hasSubCollection && !_collection.sub_collections.includes(sub_collection))
      _collection.sub_collections.push(sub_collection)
    if (hasSubtype && !_collection.subtypes.includes(subtype)) 
      _collection.subtypes.push(subtype)

    entry.cid = _collection.cid;
    _collection.icons.push(entry);
    _collection.size++;

    return entry;
  },
  
  remove(id){
    if(!this.index_id.hasOwnProperty(id))
      return false;
    let item = this.db.index_id[id];
    item.del_stats = 'deleted';
    return true;
  },

  edit(id,props){
    if (!this.db.index_id.hasOwnProperty(id))
      return {};
    let item = this.db.index_id[id];
    for (property in props){
      let nameChange = property === 'name';
      let forbid = ['sub_collection','collectin','id','symlink','subtype','cid']
      if (forbid.includes(property))
        return {};
      if (nameChange){
        console.log(`removing ${item.name} from index`)
        this.db.index_name[item.name] = this.db.index_name[item.name].filter(item => item.id !== id)
      }


      console.log(`changing ${property} of ${item.name} from ${item[property]} to ${props[property]}`)

      item[property] = props[property];
      item.stamp = DateTime.stamp().ms
      if (nameChange)
        this.db.index_name.hasOwnProperty(item.name)
        ? this.db.index_name[item.name].push(item)
        : this.db.index_name[item.name] = [item];

    }
    return item;
  },

  async check_connection(){
    let conn_state = {
      status: await checkInternetConnection(),
      db_status: await model.ping()
    }
    return conn_state;
    // check internet connection
    // check mongo db connection
  },

  async check_status(){
    const stats = await stat();
    return stats;
  },

  async create_collection(name,type){
    // create
    // log directive
    // if sync = auto sync() => this.logs => logfile => db => mark-complete;
  }
}

async function test(){

  console.time('test local db');
  // await updateLocalDB();
  await local_db.init()
  console.log(local_db.get_collection_names())
  console.log(local_db.collection_exists('zondicons'))
  console.log(await local_db.collection('zondicons'))
  console.log(local_db.get_all_collections())
  console.log(local_db.getCollectionById('lzbmjwnl-02AKX7K0ISUT'))
  console.log(sizeof(local_db.db) + ' bytes')
  console.log(sizeof(local_db.index_id) + 'bytes')
  const test = local_db.collection('zondicons',true);
  const a = test.icons[0];
  console.log(a)
  const b = await gzip(a.markup);
  console.log(`Original size: ${Buffer.byteLength(a.markup, 'utf8')} bytes`);
  console.log(`Compressed size: ${Buffer.byteLength(b)} bytes`);
  console.log(local_db.find('lzctve2l-00RCMF432UT7'))
  console.log(local_db.find('lzctve2l-00RCMF432UT7','zondicons'))
  console.log(local_db.find('lzctve4i-00BC3FA7W8EN','zondicons'))

  console.log(local_db.findByName('add-outline').length + ' results')
  console.log(local_db.findByName(/add/g)?.length + ' results')
  console.log(local_db.search(/add/g).length + ' results');
  console.log(local_db.search(/add/g,'zondicons').length + ' results');
  
  local_db.edit('lzctve4i-00BC3FA7W8EN',{color:'blue',name:'testing-123'})
  local_db.edit('lzctve4i-00BC3FA7W8EN',{color:'green'})
  console.log(local_db.find('lzctve4i-00BC3FA7W8EN'))

  // console.log(test.icons[test.icons.length - 1])
  console.timeEnd('test local db');
//lzctve2l-00RCMF432UT7 - 'zondicons'
}

// test();
// process.on('SIGINT', Monitor.cleanup.bind(Monitor));
// process.on('SIGTERM', Monitor.cleanup.bind(Monitor));
// process.on('exit', Monitor.cleanup.bind(Monitor));
// Monitor.watch()

async function stat() {
  console.log('scanning target directory')
  let stats = {}
  let count = await countFiles(targetDirectory , '.svg');
  console.log('target directory scanned....\n', `count : ${count}`);

    console.log('loading state');
    const lastChange = DateTime.from(new Date(fs.statSync(fileSystemMap).mtimeMs));
    console.log('last change',lastChange.string);


    const {added,removed,changed} = await compareStateMap();
    const updateNeeded = [added,removed,changed].some(val => val.length > 0)

    const size = Math.floor(fs.statSync(fileSystemDB).size / 1000);
    console.log('db size : ', size ,'kb')
    stats.size = size;

    if (updateNeeded) {
      console.log('updates found....');
      console.log('files added : ', added.length);
      console.log('files removed : ', removed.length);
      console.log('files changed : ', changed.length);
    }

    return {
      added,
      removed,
      changed,
      size,
      count,
      updateNeeded,
      lastChange: lastChange.string,
      lastChangeMs:lastChange.milisecondsAgo,
    }
};

async function log(action,directive){
  const {type,data} = directive;
}

async function createDB_store() {
  let state = await readStateMap();
  console.log('building local object store')
  const local = {
    collection_names: [],
    collections: {},
    index_id: {},
    index_name: {},
  };
  for (const file of Object.keys(state)){
    if (path.extname(file) === '.svg'){
      const entry = await createEntry(file);
      const {collection,subtype,sub_collection,id,name} = entry;
      const collection_exists = local.collections.hasOwnProperty(collection)
      const hasSubtype = subtype != undefined;
      const hasSubCollection = sub_collection != undefined;

      if (!collection_exists) {
        local.collections[collection] = {
          cid: uuid(),
          subtypes: [],
          sub_collections: [],
          icons: [],
          size: 0,
        }
        local.collection_names.push(collection)
      }

      local.index_id[id] = entry;
      local.index_name.hasOwnProperty(name)
        ? local.index_name[name].push(entry)
        : local.index_name[name] = [entry];

      let _collection = local.collections[collection];
      
      if (hasSubCollection && !_collection.sub_collections.includes(sub_collection))
        _collection.sub_collections.push(sub_collection)
      if (hasSubtype && !_collection.subtypes.includes(subtype)) 
        _collection.subtypes.push(subtype)

      entry.cid = _collection.cid;
      _collection.icons.push(entry);
      _collection.size++;

    }
  }
  console.log('done');
  return local;
};

async function loadCurrentStateMap() {
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
};

async function saveCurrentStateMap() {
  console.log('saving state map')
  saveStateMap((await loadCurrentStateMap()),null,2);
};

function saveStateMap(state) {
  fs.writeFileSync(fileSystemMap, JSON.stringify(state))
};

function readStateMap() {
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
};

async function compareStateMap(){
  const prevState = readStateMap();
  const currState = await loadCurrentStateMap();
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
};

async function updateLocalDB() {
  await saveCurrentStateMap();
  const updated = await createDB_store();
  console.log('saving db store')
  try {
    fs.writeFileSync( fileSystemDB , JSON.stringify(updated) );
    console.log('local db updated');
    return updated;
  } catch (e){
    console.log('error updating local db');
    return false;
  }
};

function readDB(){
  const local = JSON.parse(fs.readFileSync(fileSystemDB,'utf-8'));
  // console.log(local)
  return local
};

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
      // markup = await gzip(markup);
      return markup;
    }
}

function createMetaDocument(name){
  return  {      
    name,
    cid: uuid(),
    size: 0,
    created_at: DateTime.stamp(),
    updated_at: null,
  }
}
function cleanupAndExit() {
  readline.cursorTo(process.stdout, 0); // Move cursor to the beginning of the line
  console.log('Exiting...');
    process.exit(0); // Exit the process
}
