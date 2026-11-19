/**
 * DOM IDs Verification Test
 * Ensures all getElementById calls in app.js and pipeline.js exist in index.html
 */

const fs = require('fs');
const path = require('path');

const indexHTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJS = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const pipelineJS = fs.readFileSync(path.join(__dirname, '..', 'js', 'pipeline.js'), 'utf8');
const visualizerJS = fs.readFileSync(path.join(__dirname, '..', 'js', 'visualizer3d.js'), 'utf8');

const idRegex = /document\.getElementById\(["']([^"']+)["']\)/g;
const referencedIds = new Set();

let match;
while ((match = idRegex.exec(appJS)) !== null) {
  referencedIds.add(match[1]);
}
while ((match = idRegex.exec(pipelineJS)) !== null) {
  referencedIds.add(match[1]);
}
while ((match = idRegex.exec(visualizerJS)) !== null) {
  referencedIds.add(match[1]);
}

console.log(`Found ${referencedIds.size} referenced DOM element IDs across JS files.`);

let missing = 0;
referencedIds.forEach(id => {
  // Check if id exists in indexHTML
  const hasId = indexHTML.includes(`id="${id}"`) || indexHTML.includes(`id='${id}'`);
  if (!hasId) {
    // Check if dynamically created (like toast-container or canvas-3d-tooltip)
    if (id === 'toast-container' || id === 'canvas-3d-tooltip') {
      console.log(`  ℹ ${id}: Dynamically created element (OK)`);
    } else {
      console.error(`  ✕ Missing ID in index.html: ${id}`);
      missing++;
    }
  } else {
    console.log(`  ✓ ${id}: Present in index.html`);
  }
});

if (missing > 0) {
  console.error(`\nFailed with ${missing} missing DOM element IDs!`);
  process.exit(1);
} else {
  console.log(`\nAll referenced DOM IDs verified successfully!`);
}
