'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const f = require('./project-home.js');
const projects = require('./projects.json').projects;
const metadata = require('./chat-metadata.json');
function plain(value) {
  return value.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g,
    s => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[s]));
}
let rows = 0, privateRows = 0, renderedTitles = 0, knownDateRows = 0;
const projectResults = [];
for (const project of projects) {
  const before = JSON.stringify(project), lists = f.lists(project, metadata);
  let projectRows = 0;
  for (const visibility of ['public', 'private']) {
    for (const [index, row] of lists[visibility].entries()) {
      const item = f.record(project, row, index, visibility);
      assert.equal(item.title, row.displayTitle, 'Canonical list/detail title mismatch: ' + row.url);
      assert.equal(item.displayName, row.displayName, 'Name-only sort key changed');
      assert.equal(item.date, row.displayDate || null, 'Authored date changed');
      assert.equal(item.url, row.url, 'Destination changed');
      for (const view of ['cards', 'list', 'gallery']) {
        const html = f.card(item, view);
        const heading = html.match(/<h3>([\s\S]*?)<\/h3>/);
        assert.ok(heading, 'Missing card title');
        assert.equal(plain(heading[1]), row.displayTitle, view + ': ' + row.url);
        assert.ok(!html.includes('<script>alert(1)</script>'));
        if (visibility === 'private') assert.ok(!html.includes('<img '), 'Private preview leak');
        renderedTitles++;
      }
      const html = f.table([item], {sort:'newest'}, false);
      const heading = html.match(/<strong>([\s\S]*?)<\/strong>/);
      assert.equal(plain(heading[1]), row.displayTitle, 'table: ' + row.url);
      renderedTitles++; rows++; projectRows++;
      if (visibility === 'private') privateRows++;
      if (row.displayDate) knownDateRows++;
    }
  }
  assert.equal(JSON.stringify(project), before, 'Source catalog mutated');
  projectResults.push({project: project.repo, rows: projectRows, viewsChecked: 4});
}
const sorted = f.sortRows([
  {title:'2026-09-30 가', displayName:'가', date:'2026-09-30', index:0},
  {title:'2026-01-01 나', displayName:'나', date:'2026-01-01', index:1}
], 'title-asc');
assert.deepEqual(sorted.map(x => x.displayName), ['가', '나'], 'Name sorting must ignore the date prefix');
assert.equal(f.record({category:'기록'}, f.display({authoredAt:'2026-09-24',chatTitle:'화곡농장 더덕수확과 씨앗채취'}),0,'public').title,
  '2026-09-24 화곡농장 더덕수확과 씨앗채취');
assert.equal(f.record({category:'기록'}, f.display({authoredAt:'2026-09-24',userTitle:'2026-09-24 직접 지정 제목'}),0,'private').title,
  '2026-09-24 직접 지정 제목');
assert.equal(f.record({category:'기록'}, f.display({label:'날짜 없는 기록'}),0,'public').title,
  '작성일 미확인 날짜 없는 기록');
const hostile = f.record({category:'기록'}, f.display({authoredAt:'2026-09-24',userTitle:'<script>alert(1)</script>',url:'https://example.org/record/'}),0,'public');
assert.ok(!f.card(hostile,'cards').includes('<script>alert(1)</script>'));
assert.ok(!f.table([hostile],{sort:'newest'},false).includes('<script>alert(1)</script>'));
const report = {version:f.VERSION, projects:projects.length, rows, publicRows:rows-privateRows,
  privateRows, knownDateRows, renderedTitles, views:['cards','list','table','gallery'],
  titleParity:true, nameSortPreserved:true, authoredDatesUnchanged:true, destinationsUnchanged:true,
  projectResults};
console.log('TITLE_PARITY_PASS ' + JSON.stringify(report));
if (process.env.TITLE_PARITY_REPORT) fs.writeFileSync(path.resolve(process.env.TITLE_PARITY_REPORT), JSON.stringify(report,null,2)+'\n');
