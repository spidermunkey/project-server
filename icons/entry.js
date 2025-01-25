async function createEntry(filepath){
  const collection = getBranch(filepath)[0];
  const subtypeDirectories = ['duotone','bold','fill','light','regular','solid','outlined','outline','thin','medium','bulk','curved','light-outline','two-tone','broken'];
  const name = path.parse(filepath).name;
  const type = (await fs.stat(filepath)).isDirectory() ? 'directory' : 'file';
  const sub_collection = type == 'file' ? getSubCollection(filepath) : null;
  const ext = path.extname(filepath);
  const fileType = ext == '.svg' ? 'svg' 
                  : ext == '.zip' ? 'zip' 
                  : type == 'directory' ? 'directory' 
                  : null;

  let subtype = getSubType(filepath);
  let markup = fileType === 'svg' ? (await parseSVGFile(filepath)) : null;
  let id = fileType === 'svg' ? uuid() : null;
  let symlink = filepath;
  return { 
    name, 
    collection, 
    sub_collection, 
    subtype, 
    fileType, 
    markup, 
    id, 
    symlink, 
    stamp: Date.now() 
  }

  function getBranch(branchPath, branchStart = path.normalize(targetDirectory)) {
    const folders = filename => filename.split(/[\\/]/);
    return folders(branchPath.split(branchStart)[1]).filter(pathname => pathname != "")
  }
  function getSubCollection(dirname) {
    let branch = getBranch(dirname);
    let filteredCollectionName = branch.slice(1);
    let filteredFileName = filteredCollectionName.pop();
    let filterSubType = pathname => !subtypeDirectories.includes(pathname.toLowerCase())
    let filterSvgFolder = pathname => pathname.match(/(svg)(s?)/i) === null
    let filteredBranch = filteredCollectionName.filter(filterSubType).filter(filterSvgFolder);
    let code = filteredBranch.length;
    if (code === 1)
      return filteredBranch[0]
    else if (code === 0)
      return null
    else if (code > 1)
      return undefined;
  }
  function getSubType(dirname){
    let branch = getBranch(dirname)
    for (let folder of branch) {
      if (subtypeDirectories.includes(folder.toLowerCase()))
        return folder;
    }
    return null;
  }
  async function parseSVGFile(filepath) {
    let markup;
    let attemptRead = 0;
    await parse(filepath);
    return markup;
    async function parse(filepath){
      markup = await fs.readFile(filepath,'utf8');
      if (markup === '' && (await fs.exists(filepath)) && attemptRead < 3) {
        await new Promise(resolve => setTimeout(resolve, 50)); // wait for file to fully resolve
        attemptRead++;
        await parse(filepath);
      }
      if (markup == '' && attemptRead > 3)
        console.warn('download failed/n attempts: ',attemptRead,filepath);
      // markup = await gzip(markup);
      return markup;
    }
  }
};

module.exports.entry = createEntry;
