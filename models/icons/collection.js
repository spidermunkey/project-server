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
