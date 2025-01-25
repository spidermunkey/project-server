/* 
chatgpt
"regex that parses the first <svg/> element tag finds the viewBox, height and width values safely."
*/

const testIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">\n  <path d="M3 0l-3 3.03 3 2.97v-2h5v-2h-5v-2z" transform="translate(0 1)"></path>\n</svg>'
const regex = /<svg(?:\s+[^>]*?)?\s+(?=.*?\bviewBox=["']([^"']+)["'])(?=.*?\bwidth=["']([^"']+)["'])(?=.*?\bheight=["']([^"']+)["'])[^>]*?>/;
const match = testIcon.match(regex);



if (match) {
  const viewBox = match[1];
  const width = match[2];
  const height = match[3];
  console.log("viewBox:", viewBox);
  console.log("width:", width);
  console.log("height:", height);
} else {
  console.log("No <svg> tag found.");
}
