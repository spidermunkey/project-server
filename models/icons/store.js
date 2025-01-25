const err_collection_noexists = { message: 'error reading collection',status: 'failed',reason:'collection doesnt exist' }

const dns = require('dns');
const {Monitor} = require('./local/monitor.js');
const model = require('./model.js');

const store = {

  mode: 'both', // 'local' | 'cloud' | 'fail-first' | 
  status: 'offline',
  db_status: 'offline',
  local_status: 'offline',
  stats: {},
  monitor: Monitor,
  local: null,

  last_sync: null,
  ready: false,

  collections: {},
  collection_names: [],

  // eachCollection,
  // mapCollection,
  get stat() {
    return {
      mode: this.mode,
      status: this.status,
    }
  },
  async get_all_collections(){
    return this.getCollections(...this.collection_names);
  },
  async get_collection(...collection_names){ // { icons | name | meta }
    return Promise.all(collection_names.map(async name => await this.collection(name,true))) 
  },
  async get__all_data() {
    const data = this.get_collection_data(...this.collection_names)
    return data;
  },
  get_data(...collection_names) {
    return collection_names.map(collection_name => {
      if (!this.collection_exists(collection_name))
        return err_collection_noexists
      if (!collection_name)
        return this.mapCollection(collection => collection.data())
      const meta = this.collection(collection_name).data;
      return meta;
    })
  },

  getCollectionById(cid){

  },

  async collection(collection_name, withIcons = false){
    // if (!this.db_status === 'online'){
    //   if (this.local_status === 'online' && this.local)
    //     return this.local[collection_name]
    // }
    if (withIcons)
      return model.getCollectionByName(collection_name)
    else 
      return model.getMeta(collection_name)

  },

  collection_exists(collection_name){
    // check for updates
    // compare local names
  },
  async get_collection_names(){
    if (!this.online())
      return;
    return model.getCollectionNames()
    // return this.mapCollection(collection => collection.name())
  },

  async get_collection_icons(collection_name,options) {
    if (!this.collection_exists(collection_name))
      return err_collection_noexists
    
    const icons = collection(collection_name)
                    .get_all(options);
    return icons;
  },
  find(id,collection){

  },
  findAll(regex){
    this.eachCollection(collection => collection.findAll(regex))
  },
  search(regex,collection){

  },
  add(name,data){
    // parse collection
    // collection.add(name,data);
    // others.add();
  },
  remove(id,collection){

  },
  edit(id,collection){

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
  check_status(){
    // check monitor status
    // check monitor db for updates
  },
  save(collection){
    if (!collection){ // save all
    
    }
  },
  sync(collection) {
    if (!collection){ // sync all

    }
  },
  update(collection){
    if (!collection){ // update all

    }
  },
  load(collection) {
    // ... init

  },
  online(){
    return this.db_status === 'online';
  },
  async init() {
    try {
      process.on('SIGINT', this.monitor.close.bind(this.monitor));
      process.on('SIGTERM', this.monitor.close.bind(this.monitor));
      process.on('exit', this.monitor.close.bind(this.monitor));
      // this.monitor.onReady = (stats) => this.local_status = stats;
      let stats = this.stats.local_stats = this.local_stats = await this.monitor.stat();
      this.last_sync = stats.lastChangeMs;
      if (!stats.updateNeeded){
        // await this.monitor.getLocal();
        // this.local = await this.monitor.getLocal();
      }
      this.local_status = 'online'
      console.log('local db ready')
    } catch (e){
      console.warn('error starting local db',e);
      this.local_status = null;
    }
    console.log('checking mongodb connection')
    const {status,db_status} = await this.check_connection();
    if (!status || !db_status) {
      console.log('db status offline', !status ? status : !db_status ? db_status : null)
      this.db_status = 'offline';
    } else {
      this.db_status = 'online'
    }
    console.log('db status online')
    let ok = this.local_status === 'online' || this.db_status === 'online'
    if (ok) {
      this.status = 'online'
      this.ready = true;
    }
    else this.ready = false;
  
    // await test(this);
    const current_local_db = await this.monitor.init();
    console.log('done')
    return this;
  }

}


store.init();

async function test(store){
  
  const names = await store.get_collection_names()
  console.log(names)
  const icons = await store.collection('all')
  console.log(icons)
}
async function checkInternetConnection() {
  return new Promise((resolve, reject) => {
      dns.lookup('google.com', (err) => {
          if (err) {
              reject('No internet connection');
          } else {
              resolve('Internet connection is active');
          }
      });
  });
}
