const WebSocket = require('ws');
const http = require('http');
const {EventEmitter} = require('node:events');
const {Local} = require('./local.js');
const {Scanner} = require('./scanner.js');
const {Mongo} = require('./model.js')

class MessageBroker extends EventEmitter {
  constructor(app){
    super();
    console.log('broker initiated')
    this.server = http.createServer(app)
    this.socket = new WebSocket.Server({server:this.server});
    this.socket.on('open', () => this.sendMessage('socket opened', 'status'))
    this.socket.on('connection', this.handleConnection.bind(this))
    this.on('message',({type,data}) => {
      switch(type){
        case 'upload': {
          this.emit('upload', data)
          break;
        }
        case 'ignore': {
          this.emit('ignore',data)
          break;
        }
        default: {
          console.log('new message')
          break;
        }
      }
    })
    this.on('upload',async (data) => {
      let cid = data;
      let collection = Local.getCollectionById(cid);
      if (collection) {
        console.log('collection found',collection)
        console.log('checking mongo')
        const isSync = await Mongo.check_collection_id(collection.cid)
        console.log('cloud sync status', isSync)
        if (!isSync){
          console.log('syncing collection',collection.name,collection.cid);
          try {
            const data = Local.get_collection(collection.name)[0];
            const status = await Mongo.sync_collection( data );
            if (status.success == true) {
              Local.update_collection(data.cid, {synced:true})
            }
            console.log('upload status done',status);
          } catch(e) {
            console.log('error syncing collection', e )
          }
        }
      }
    })
    this.on('ignore', async (data) => {
      let cid = data;
      Local.ignore(cid);
    })
  }
  handleConnection(socket){
    console.log('socket connected')
    socket.on('message', this.handleMessage.bind(this) )
  }
  sendMessage(message, type='default'){
    this.socket.send(JSON.stringify({ type, data:message }))
  }
  handleMessage(data) {
    let message = this.parseMessage(data)
    if (message != null)
      this.emit('message', message )
  }
  parseMessage(data){
    try {
      let json = JSON.parse(data.toString());
      console.log('message recived', json);
      return json;
    } catch(e) {
      console.error('error parsing message', data.toString())
      return null;
    }
  }
}

const broker = new MessageBroker();
module.exports.MessageBroker = MessageBroker;
module.exports.test = broker;
