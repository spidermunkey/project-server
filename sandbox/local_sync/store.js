const err_collection_noexists = { message: 'error reading collection',status: 'failed',reason:'collection doesnt exist' }

const store = {
  mode,
  status,
  monitor,
  local_status,
  last_sync,

  collections,
  collection_names,
  
  get_all(){
    return this.getCollections(...this.collection_names);
  },
  getCollections(...collection_names){
    return collection_names.map(name => this.collection(name,true))    
  },
  getCollectionById,
  eachCollection,
  mapCollection,
  get_data() {
    const data = this.get_collection_data(...this.collection_names)
    return data;
  },
  collection(collection_name, withIcons = false){
    // check for updates
    // return Collection Object
    // if (withIcons) wait to compile
  },
  collection_exists(){
    // check for updates
    // compare local names
  },
  get_collection_names(){
    return this.mapCollection(collection => collection.name())
  },

  get_collection_data(...collection_names) {
    return collection_names.map(collection_name => {
      if (!this.collection_exists(collection_name))
        return err_collection_noexists
      if (!collection_name)
        return this.mapCollection(collection => collection.data())
      const meta = this.collection(collection_name).data;
      return meta;
    })
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

  check_connection(){
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

  }

}

const collection = {
  name,
  data,
  icons,
  mode,
  connection: !(this.mode == 'local') && this.check_connection(),
  local_ok: this.mode == 'local' || this.mode == 'both',
  local: local_collection,
  check_connection(){
    return true;
  },
  get_all(options){

  },
  find(id){
    if (!this.connection && this.local_ok)
      return this.local.find(id)
    else if (this.connection){
      let result = {}
      return result;
    }
    return {}
  },
  findAll(regex){
    if (!this.connection && this.local_ok)
      return this.local.findAll(regex)
    else if (this.connection){
      let result = [];
      return result;
    }
    return []
  },
  search(regex){
    if (!this.connection && this.local_ok)
      return this.local.search(id)
    else if (this.connection){
      let result = [];
      return result;
    }
    return []
  },
  add(name,data){
    if (!this.connection && this.local_ok)
      return this.local.add(name,data)
    else if (this.connection){
      let result = {};
      return result;
    }
    return {}
  },
  remove(id){
    if (!this.connection && this.local_ok)
      return this.local.remove(id)
    else if (this.connection){
      let result = null;
      return result;
    }
    return null;
  },
  edit(id){
    if (!this.connection && this.local_ok)
      return this.local.edit(id)
    else if (this.connection){
      let result = {};
      return result;
    }
    return {}
  },
  save(){
    if (!this.connection && this.local_ok)
      return this.local.save()
    else if (this.connection){
      let result = null;
      return result;
    }
    return null
  },
  sync(){
    if (!this.connection && this.local_ok)
      return this.local.sync()
    else if (this.connection){
      let result = null;
      return result;
    }
    return null
  },

}
