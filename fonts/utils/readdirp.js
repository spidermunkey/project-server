const fs = require('fs');
const path = require('path');

function countFilesWithExtension(directory, extensions = [], ignoreDot = true) {
  return new Promise((resolve, reject) => {
    let count = 0;
    function readDirRecursive(dir) {
      return new Promise((res, rej) => {
        fs.readdir(dir, { withFileTypes: true }, (err, items) => {
          if (err) {
            return rej(err);
          }

          let promises = items.map(item => {
            if (ignoreDot && item.name.startsWith('.')) {
                return Promise.resolve();
            }
            let itemPath = path.join(dir, item.name);

            if (item.isDirectory()) {
              return readDirRecursive(itemPath);
            } else if (item.isFile() && extensions.includes(path.extname(item.name))) {
              count++;
            }

            return Promise.resolve();
          });

          Promise.all(promises).then(res).catch(rej);
        });
      });
    }
    readDirRecursive(directory)
      .then(() => resolve(count))
      .catch(reject);
  });
}

module.exports.countFiles = countFilesWithExtension;

