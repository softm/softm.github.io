'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const controls = require('./view-controls.js');
assert.deepEqual(Object.keys(controls.MODES), ['cards', 'list', 'table', 'gallery']);
const shapes = new Set();
for (const [mode, entry] of Object.entries(controls.MODES)) {
  const svg = controls.icon(mode);
  assert.ok(entry.label);
  assert.match(svg, /^<svg /);
  assert.match(svg, /aria-hidden="true"/);
  assert.match(svg, /focusable="false"/);
  assert.match(svg, /stroke="currentColor"/);
  assert.doesNotMatch(svg, /<script|onload|<image|https?:/);
  shapes.add(svg);
}
assert.equal(shapes.size, 4);
assert.equal(controls.icon('unknown'), '');
assert.equal(controls.icon('__proto__'), '');
assert.equal(controls.icon('constructor'), '');
const css = fs.readFileSync(path.join(__dirname, 'view-controls.css'), 'utf8');
assert.match(css, /min-height:44px/);
assert.match(css, /\[aria-pressed=true\]/);
console.log('PASS: four distinct inline SVG icons, accessible names, no external assets, 44px targets, selected state and safe unknown modes');
