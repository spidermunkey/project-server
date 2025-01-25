/*
  chatgpt
   find fill and stroke attributes (if any, null if none) in the opening svg tag, and also any allowedTags ['g', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'text', 'tspan','use'] within the markup

const regex = /<\b([a-zA-Z]+)\b(?:[^>]*?\bstroke=["']([^"']+)["'])?(?:[^>]*?\bfill=["']([^"']+)["'])?[^>]*?>/g;
let match;
const results = [];
while ((match = regex.exec(svgString)) !== null) {
  const tag = match[1]; // The tag name
  const stroke = match[2] || null; // The stroke value, if any
  const fill = match[3] || null; // The fill value, if any
  results.push([tag, stroke, fill]);
}

   */

module.exports.parseColors = function(markup){
  const regex = /<\b([a-zA-Z]+)\b(?:[^>]*?\bstroke=["']([^"']+)["'])?(?:[^>]*?\bfill=["']([^"']+)["'])?[^>]*?>/g;
  let match;
  const results = [];
  while ((match = regex.exec(markup)) !== null) {
    const tag = match[1]; // The tag name
    const stroke = match[2] || null; // The stroke value, if any
    const fill = match[3] || null; // The fill value, if any
    results.push([tag, stroke, fill]);
  }
  return results;
}
const svgString = `
<svg viewBox="0 0 100 100" stroke="#000000" fill="#ffffff" width="100px" height="100px">
  <g stroke="#ff0000">
    <circle cx="50" cy="50" r="40" fill="red" />
  </g>
  <path d="M10 10 H 90 V 90 H 10 Z" />
</svg>
`;

const regex = /<\b([a-zA-Z]+)\b([^>]*)\/?>/g;

let match;
let idCounter = 1;
const results = [];
const markedSvgString = svgString.replace(regex, (fullMatch, tag, attributes) => {
  const id = `element-${idCounter++}`; // Generate a unique identifier

  // Check for fill and stroke attributes
  const strokeMatch = attributes.match(/\bstroke=["']([^"']+)["']/);
  const fillMatch = attributes.match(/\bfill=["']([^"']+)["']/);
  const stroke = strokeMatch ? strokeMatch[1] : null;
  const fill = fillMatch ? fillMatch[1] : null;

  // Add to results only if stroke or fill is present
  if (stroke || fill) {
    results.push([id, stroke, fill]);
  }

  // If it's a self-closing element, add id before the closing slash
  if (fullMatch.endsWith('/>')) {
    return fullMatch.replace(/\/?>/, ` id="${id}" />`);
  }

  // If it's not self-closing, add the id before the closing tag
  return fullMatch.replace(/>/, ` id="${id}">`);
});

console.log("Processed Elements:", results);
console.log("Marked SVG String:", markedSvgString);
