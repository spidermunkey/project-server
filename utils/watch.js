const chokidar = require('chokidar');
const print = require('./print.js');
const { EventEmitter } = require('node:events');
class FsMonitor extends EventEmitter {
  constructor(targetDir,config = {
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      quite: false,
    }) {
    super();
    this.watcher = null;
    this.target = targetDir;
    this.config = config;
    // Listen for server termination signals to clean up the watcher
    process.on('SIGINT', this.cleanup.bind(this));
    process.on('SIGTERM', this.cleanup.bind(this));
    process.on('exit', this.cleanup.bind(this));

    this.on('add', this.onSingleEntry.bind(this));
    this.on('del',this.onDeleteEntry.bind(this));
    this.on('dir',this.onAddDir.bind(this));
    this.on('rmdir',this.onRemoveDir.bind(this));
    this.on('change',this.onChangeEntry.bind(this));
    this.on('error',this.onError.bind(this));
    this.on('ready',this.onReady.bind(this));

  }
  watch() {
    try {
      if (!this.watcher){
        this.watcher = chokidar.watch(this.target,config)
          .on('add', this.emit('add'))
          .on('unlink', this.emit('del'))
          .on('addDir', this.emit('dir'))
          .on('unlinkDir', this.emit('rmdir'))
          .on('change', this.emit('change'))
          .on('error', this.emit('error'))
        console.log('watcher initiated')
      } else {
        console.log('already watching...', this.target)
      }
    } catch(error){
      console.log('error intiating watcher... [target]: ', this.target, '[error]: ', error)
    }
  }
  cleanup() {
    if (this.watcher) {
      this.watcher.close().then(() => console.log('File watcher closed'));
      this.watcher = null;
    }
  }
  async onSingleEntry(filename) {
    print(`[ new entry | ${this.target} ] : `, filename)
  }
  async onDeleteEntry(filename) {
    print(`[ entry deleted | ${this.target} ] : `, filename)
  }
  async onChangeEntry(filename){
    print(`[ entry changed | ${this.target} ] : `, filename)

  }
  async onAddDir(filename){
    print(`[ directory added | ${this.target} ] : `, filename)
    
  }
  async onRemoveDir(filename){
    print(`[ directory removed | ${this.target} ] : `, filename)

  }
  async onError(error){
    print(`[ watcher error | ${this.target} ] : `, this.target, filename, error)
  }
  async onReady(){
    print(`[ watcher ready | ${this.target} ] : `, this.target, filename)

  }
}

module.exports = FsMonitor;