const fs = require('fs');
const path = require('path');

function countFilesWithExtension(directory, extension, ignoreDot = true) {
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
            } else if (item.isFile() && path.extname(item.name) === extension) {
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
    
// Example usage
// const directoryPath = "C:/Users/justi/dev/data/icons";
// const fileExtension = '.svg';
module.exports.countFiles = countFilesWithExtension;
// countFilesWithExtension(directoryPath, fileExtension)
//   .then(count => {
//     console.log(`Number of files with ${fileExtension} extension: ${count}`);
//   })
//   .catch(err => {
//     console.error('Error reading directory:', err);
//   });
