const fs = require('fs');
const { parseStringPromise } = require('xml2js');
const sanitizeHtml = require('sanitize-html');

async function isValidSvg(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse the XML
    const result = await parseStringPromise(fileContent);
    if (!result.svg) {
      throw new Error('Invalid SVG root element');
    }

    // Sanitize the SVG
    const cleanSvg = sanitizeHtml(fileContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'text', 'tspan']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        svg: ['xmlns', 'width', 'height', 'viewBox', 'version'],
        g: ['transform'],
        path: ['d', 'fill', 'stroke', 'stroke-width'],
        circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
        rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width'],
        line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width'],
        polygon: ['points', 'fill', 'stroke', 'stroke-width'],
        polyline: ['points', 'fill', 'stroke', 'stroke-width'],
        ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
        text: ['x', 'y', 'font-family', 'font-size', 'fill', 'stroke', 'stroke-width'],
        tspan: ['x', 'y']
      }
    });

    // Return sanitized SVG if it passed all checks
    return cleanSvg;

  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

// Usage example
const filePath = 'path/to/your/file.svg';
isValidSvg(filePath)
  .then((cleanSvg) => {
    if (cleanSvg) {
      console.log(`${filePath} is a valid and sanitized SVG file.`);
      console.log(cleanSvg);
    } else {
      console.log(`${filePath} is not a valid SVG file.`);
    }
  })
  .catch((err) => {
    console.error('Error checking file:', err);
  });
