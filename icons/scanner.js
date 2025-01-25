const fs = require('fs-extra');
const path = require('path');
const DateTime = require('../utils/Datetime.js');
const { uuid } = require('../utils/uuid.js');
const { countFiles } = require('../utils/readdirp.js');
const targetDirectory = "C:/Users/justi/dev/data/icons";
const fileSystemMap = 'C:/Users/justi/dev/project-server/models/icons/local/fsmap.json';
const fileSystemDB = 'C:/Users/justi/dev/project-server/models/icons/local/fsdb.json';
const ignoreList = 'C:\Users\justi\dev\project-server\icons\local\fsignore.json'
const scanner = {
  target: targetDirectory,
  fsmap: fileSystemMap,
  fsdb: fileSystemDB,
  stats:{},
  async stat() {
      let count = await countFiles(targetDirectory , '.svg');
      const lastChange = DateTime.from(new Date(fs.statSync(fileSystemMap).mtimeMs));
      const { added , removed , changed } = await this.compare();
      const updateNeeded = [added,removed,changed].some(val => val.length > 0)
      const size = `${Math.floor(fs.statSync(fileSystemDB).size / 1000)} kb`;
      return { added, removed, changed, size, count, updateNeeded, lastChange: lastChange.string, lastChangeMs:lastChange.milisecondsAgo }
  },
  read(){
    return JSON.parse(fs.readFileSync(this.fsdb,'utf-8'));
  },
  read_map(){
    return JSON.parse(fs.readFileSync(this.fsmap));
  },
  write(store){
    fs.writeFileSync( this.fsdb , JSON.stringify(store) )
  },
  ignore(name){

  },
  async compare(){
    const prevState = this.read_map();
    const currState = await this.compile_map();
    const added = [];
    const removed = [];
    const changed = [];
  
    for (const file in currState)
      if (!prevState.hasOwnProperty(file)) added.push(file);
      else if (prevState[file] !== currState[file]) changed.push(file);
    
    for (const file in prevState)
      if (!currState.hasOwnProperty(file)) removed.push(file);
  
    return {added,removed,changed}
  },
  async update(){
    this.write(await this.compile_store(await this.compile_map()))
  },
  async compile_store(map){
    console.log('building local object store')
    const local = {
      collection_names: [],
      collections: {},
      index_id: {},
      index_name: {},
    };
    for (const file of Object.keys(map)){
      if (path.extname(file) === '.svg'){
        const entry = await this.parse(file);
        const {collection,subtype,sub_collection,id,name} = entry;
        const collection_exists = local.collections.hasOwnProperty(collection)
        const hasSubtype = subtype != undefined;
        const hasSubCollection = sub_collection != undefined;
  
        if (!collection_exists) {
          local.collections[collection] = {
            name: collection,
            cid: uuid(),
            subtypes: [],
            sub_collections: [],
            icons: [],
            size: 0,
            ignored: false,
            synced: false,
            created_at: DateTime.stamp().ms,
          }
          Object.defineProperty(local.collections[collection], 'synced', {
            get() {
              console.log('Property was accessed!');
              console.log(`Accessed by: ${new Error().stack.split('\n')[2].trim()}`);
              console.log(`Accessed at: ${new Date().toISOString()}`);
              console.log(`Process ID: ${process.pid}`);
              console.log('-------------------');
              return this._synced;
            },
            set(newValue) {
              this._synced = newValue;
              lastModifiedBy = `Changed by: ${new Error().stack.split('\n')[2].trim()}`; // Track who changed it
              console.log(lastModifiedBy);
            },
          });
          Object.defineProperty(local.collections[collection], 'ignored', {
            get() {
              console.log('Property was accessed!');
              console.log(`Accessed by: ${new Error().stack.split('\n')[2].trim()}`);
              console.log(`Accessed at: ${new Date().toISOString()}`);
              console.log(`Process ID: ${process.pid}`);
              console.log('-------------------');
              return this._ignored;
            },
            set(newValue) {
              this._ignored = newValue;
              lastModifiedBy = `Changed by: ${new Error().stack.split('\n')[2].trim()}`; // Track who changed it
              console.log(lastModifiedBy);
            },
          });
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
    console.log('local object store ready');
    return local;
  },
  async compile_map(){
    const state = {};
    await readDir(this.target)
    return state;
    async function readDir(directory){
      const items = await fs.promises.readdir(directory, {withFileTypes: true});
        for (const item of items) {
          const itemPath = path.join(directory, item.name);
          if (item.isDirectory()) await readDir(itemPath)
          else if (item.isFile()) {
            const stats = await fs.promises.stat(itemPath);
            state[itemPath] = stats.mtimeMs;
          }
      }
    }
  },
  async parse(filepath){
    const collection = getBranch(filepath)[0];
    const subtypeDirectories = ['duotone','bold','fill','light','regular','solid','outlined','outline','thin','medium','bulk','curved','light-outline','two-tone','broken'];
    const name = path.parse(filepath).name;
    const type = (await fs.stat(filepath)).isDirectory() ? 'directory' : 'file';
    const sub_collection = type == 'file' ? getSubCollection(filepath) : null;
    const ext = path.extname(filepath);
    const fileType = ext == '.svg' ? 'svg' 
                    : ext == '.zip' ? 'zip' 
                    : type == 'directory' ? 'directory' 
                    : null;
  
    let subtype = getSubType(filepath);
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
      synced: false,
      ignored: false,
    }
  
    function getBranch(branchPath, branchStart = path.normalize(targetDirectory)) {
      const folders = filename => filename.split(/[\\/]/);
      return folders(branchPath.split(branchStart)[1]).filter(pathname => pathname != "")
    }
    function getSubCollection(dirname) {
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
    function getSubType(dirname){
      let branch = getBranch(dirname)
      for (let folder of branch) {
        if (subtypeDirectories.includes(folder.toLowerCase()))
          return folder;
      }
      return null;
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
  },
}

module.exports.Scanner = scanner;
