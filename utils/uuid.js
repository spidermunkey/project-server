module.exports.uuid = uuid
function uuid() {
  let timmy = Date.now().toString(36).toLocaleLowerCase();
  // random high number
  let randy = parseInt(Math.random() * Number.MAX_SAFE_INTEGER);
  // random high num to hex => "005EIPQUTQ64" => add 0s to make sure its 12digits
  randy = randy.toString(36).slice(0, 12).padStart(12, "0").toLocaleUpperCase();
  // coerce into a string
  return "".concat(timmy, "-", randy);
}
