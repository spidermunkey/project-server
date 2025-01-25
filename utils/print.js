const readline = require('readline');
const process = require('process');
module.exports.print = message => {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(message + ' '.repeat(process.stdout.columns - message.length));
}
