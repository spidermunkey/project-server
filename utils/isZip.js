const fs = require('fs-extra');
module.exports = async function isZipFile(filePath) {
    return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, { start: 0, end: 3 });
    let fileSignature = '';

    readStream.on('data', (chunk) => {
      fileSignature = chunk.toString('hex').toUpperCase();
    });

    readStream.on('end', () => {
      // ZIP file signature is "50 4B 03 04"
      const zipSignature = '504B0304';
      resolve(fileSignature === zipSignature);
    });

    readStream.on('error', (err) => {
      reject(err);
    });
  })
}