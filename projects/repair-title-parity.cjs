'use strict';
// One-time, idempotent title-only repair. Never edits source documents or media.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const VERSION = '20260930-title-parity-v8';
function replaceChecked(source, before, after, count) {
  const matches = source.split(before).length - 1;
  if (matches === 0 && source.includes(after)) return source;
  assert.equal(matches, count, 'Unexpected source structure: ' + before);
  return source.split(before).join(after);
}
function repairSource(source) {
  let result = replaceChecked(source, 'title:shown.displayName,date:', 'title:shown.displayTitle,date:', 1);
  result = replaceChecked(result, 'collator.compare(a.title,b.title)', 'collator.compare(a.displayName||a.title,b.displayName||b.title)', 2);
  result = replaceChecked(result, '${dateHTML(x)}<span>${esc(x.category)}', '${x.directory?dateHTML(x):\'\'}<span>${esc(x.category)}', 1);
  result = replaceChecked(result, 'record,matches,canEnrich,FARM};return', 'record,matches,canEnrich,FARM,card,table};return', 1);
  assert.equal((result.match(/const VERSION='[^']*';/g) || []).length, 1);
  return result.replace(/const VERSION='[^']*';/, "const VERSION='" + VERSION + "';");
}
function run(root) {
  const projectDir = path.join(root, 'projects');
  const catalog = JSON.parse(fs.readFileSync(path.join(projectDir, 'projects.json'), 'utf8'));
  const staged = new Map();
  function stage(file, content) {if (fs.readFileSync(file, 'utf8') !== content) staged.set(file, content);}
  const js = path.join(projectDir, 'project-home.js');
  stage(js, repairSource(fs.readFileSync(js, 'utf8')));
  const generator = path.join(projectDir, 'home-generator.py');
  if (fs.existsSync(generator)) {
    const input = fs.readFileSync(generator, 'utf8');
    assert.match(input, /^VERSION\s*=\s*'[^']*'/m);
    stage(generator, input.replace(/^VERSION\s*=\s*'[^']*'/m, "VERSION = '" + VERSION + "'"));
  }
  const aliases = {'baksok-public': 'baksok', 'mine-private': 'mine'};
  const homes = ['index.html', ...catalog.projects.map(p => {
    const slug = aliases[p.repo] || p.repo.replace(/-private$/, '');
    assert.match(slug, /^[a-zA-Z0-9_-]+$/);
    return slug + '/index.html';
  })];
  for (const rel of homes) {
    const file = path.join(projectDir, rel), input = fs.readFileSync(file, 'utf8');
    assert.match(input, /project-home\.js\?v=[^"']+/);
    const output = input.replace(/project-home\.js\?v=[^"']+/g, 'project-home.js?v=' + VERSION)
      .replace(/data-home-version="[^"]*"/g, 'data-home-version="' + VERSION + '"');
    stage(file, output);
  }
  const workflow = path.join(root, '.github/workflows/publish-project-homes.yml');
  if (fs.existsSync(workflow)) {
    const input = fs.readFileSync(workflow, 'utf8');
    let output = input;
    if (!output.includes('node projects/test-title-parity.cjs')) {
      output = replaceChecked(output, '          node projects/project-home.test.cjs',
        '          node projects/project-home.test.cjs\n          node projects/test-title-parity.cjs', 1);
    }
    if (!output.includes('      - projects/test-title-parity.cjs')) {
      output = replaceChecked(output, '      - projects/project-home.test.cjs',
        '      - projects/project-home.test.cjs\n      - projects/test-title-parity.cjs', 1);
    }
    stage(workflow, output);
  }
  for (const [file, content] of staged) fs.writeFileSync(file, content);
  console.log(JSON.stringify({version: VERSION, projects: catalog.projects.length, homes: homes.length,
    changed: [...staged.keys()].map(f => path.relative(root, f)), archivedDocumentsAndMediaModified: false}));
}
module.exports = {repairSource, run, VERSION};
if (require.main === module) run(path.resolve(process.argv[2] || '.'));
