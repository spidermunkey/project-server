const DateTime = require('../utils/Datetime.js');
const { uuid } = require('../utils/uuid.js');
const { Scanner } = require('./scanner.js');

const local_db = {
  ready: false,
  stats: {},
  last_stat: 0,
  async init(updateNeeded = false) {
    if (updateNeeded) await this.update();
    else if (this.ready && this.status !== 'updating') return this;
    else await this.map_db();
    return this;
  },
  async stat() {
    const stats = await Scanner.stat();
    this.last_stat = DateTime.stamp().ms;
    return stats;
  },
  async save() {
    const db = Scanner.read();
    db.collections = this.collections;
    Scanner.write(db);
    await this.map_db();
  },
  async reset() {
    this.update_each({ignored: false, synced: false})
    return this.db;
  },
  async update(){
    console.log('update triggered... this may take a moment');
    this.ready = false;
    this.status = 'updating';
    await Scanner.update();
    await this.map_db();
    return;
  },
  ignore(id){
    this.update_collection(id,{ignored:true})
    return true;
  },
  async map_db(db = Scanner.read()) {
    this.collection_names = db.collection_names;
    this.collections = db.collections;
    this.index_id = db.index_id;
    this.index_name = db.index_name;
    this.ready = true;
    this.status = 'online';
    this.started = DateTime.stamp().ms;
    this.stats = await this.stat();
    // this.update_each({synced:false,ignored: false})
    return db;
  },
  get_recent(ago){
    if (!this.ready){
      console.warn('db not ready access denied')
      return [];
    }
    let collections = [];
    // console.log('COLLLLLLECCCTIOOONESSS',this.collections)
    for (const name in this.collections){
      let c = this.collections[name];
      if (!c.ignored && !c.synced)
        collections.push(c);
    }
    return collections;
  },
  get_collection_names(synced = false){
    if (!synced)
      return this.collection_names;
    return this.collection_names.filter(name => {
      console.log(this.collections[name].synced)
      return this.collections[name].synced && !this.collections[name].ignored;
    })
  },
  get_all_collections(synced = false){
    return this.get_collection(...this.get_collection_names(synced));
  },
  get_all_data(){
    return this.get_data(...(this.get_collection_names()))
  },
  get_collection(...collection_names){ // { icons | name | meta }
    return collection_names.map( name => this.collection(name,true)) 
  },
  get_data(...collection_names){
    return collection_names.map( name => this.collection(name,false)) 
  },
  getCollectionById(cid){
    let found = null;
    for (const collection_name in this.collections){
      let collection = this.collection(collection_name)
      if (collection.cid === cid) {
        found = collection;
        break;
      }
    }
    return found
  },
  async update_each(props){
    for (const collection_name in this.collections){
      let collection = this.collections[collection_name]
      console.log('updating', collection_name);
      this.collections[collection_name] = {
        ...collection,
        ...props
      }
    }
    await this.save();
  },
  async update_collection(id,props){
    let found = null;
    let name;
    for (const collection_name in this.collections){
      if (this.collections[collection_name]?.cid === id) {
        found = this.collections[collection_name];
        name = collection_name;
        break;
      }
    }
      if (found){
        console.log('updating collection',name,'with', props)
        this.collections[name] = {
          ...found,
          ...props
        }
        await this.save();
    }
  },

  collection(collection_name, withIcons = false, query = {}) {
    const {limit,offset} = query;
    if (!this.collection_exists(collection_name))
      return;
    let collection = {...this.collections[collection_name]} 

    if (withIcons){
      if (limit && offset)
        collection.icons = collection.icons.slice(offset,limit);
      return collection
    }
    else {
      const { name, cid, subtypes, sub_collections, size, created_at } = collection;
      return { name, cid, subtypes, sub_collections, size, created_at }
    }
  },
  collection_exists(collection_name) {
    return this.collection_names.includes(collection_name);
  },
  get_icons(collection_name , query ) {
    if (!this.collection_exists(collection_name))
      return err_collection_noexists
    
    return this.collection(collection_name,true, query ).icons;
  },
  find(id,collection){
    console.time('finding')
    if(!collection){
      const item = this.index_id[id];
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
    if (typeof filter !== 'string')
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

    let result = this.index_name[filter];
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
      const keys = Object.keys(this.index_name).filter(key => filter.test(key));
      const results = keys.map(key => this.index_name[key]).flat(1);
      console.timeEnd('regex find')
      return results
    }

  },
  create_collection(name){
    if (!collection_exists) {
      this.collections[name] = {
        name,
        cid: uuid(),
        subtypes: [],
        sub_collections: [],
        icons: [],
        size: 0,
        created_at: DateTime.stamp().ms,
      }
      this.collection_names.push(name);
      return this.collections[name];
    }
    return {}
  },
  addToCollection(){},
  upload(){},
  remove(id){
    if(!this.index_id.hasOwnProperty(id))
      return false;
    let item = this.index_id[id];
    item.del_stats = 'deleted';
    return true;
  },
  edit(id,props){
    if (!this.index_id.hasOwnProperty(id))
      return {};
    let item = this.index_id[id];
    for (property in props){
      let nameChange = property === 'name';
      let forbid = ['sub_collection','collectin','id','symlink','subtype','cid']
      if (forbid.includes(property))
        return {};
      if (nameChange){
        console.log(`removing ${item.name} from index`)
        this.index_name[item.name] = this.index_name[item.name].filter(item => item.id !== id)
      }
      console.log(`changing ${property} of ${item.name} from ${item[property]} to ${props[property]}`)
      item[property] = props[property];
      item.stamp = DateTime.stamp().ms
      if (nameChange)
        this.index_name.hasOwnProperty(item.name)
        ? this.index_name[item.name].push(item)
        : this.index_name[item.name] = [item];
    }
    return item;
  },
}


module.exports.Local = local_db;
