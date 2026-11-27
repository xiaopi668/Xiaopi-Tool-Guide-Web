import fs from 'node:fs';
import path from 'node:path';

const SITE = '/home/xiaopi/Projects/prompt学校';
const CONTENT = path.join(SITE, 'content');
const JS = path.join(SITE, 'assets/js');
const TRACKS = ['terminal','git','vscode','dev','efficiency','agents'];
const HEADER = '/* 由 content/ 生成，请勿手改；修改内容请用 tools/editor 或改 content/*.json 后运行 build-data.mjs */\n';

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

const all = [];
for (const t of TRACKS) {
  const list = readJSON(path.join(CONTENT, 'lessons', t + '.json'));
  all.push(...list);
  const body = HEADER +
    'window.PS = window.PS || {};\n' +
    'window.PS.lessons = window.PS.lessons || [];\n' +
    'window.PS.lessons.push(\n' +
    list.map((l) => JSON.stringify(l, null, 2)).join(',\n') +
    '\n);\n';
  fs.writeFileSync(path.join(JS, 'data-' + t + '.js'), body);
}
all.sort((a, b) => a.order - b.order);

const refs = readJSON(path.join(CONTENT, 'refs.json'));
const refsBody = HEADER +
  'window.PS = window.PS || {};\n' +
  'window.PS.commands = ' + JSON.stringify(refs.commands, null, 2) + ';\n' +
  'window.PS.shortcuts = ' + JSON.stringify(refs.shortcuts, null, 2) + ';\n' +
  'window.PS.glossary = ' + JSON.stringify(refs.glossary, null, 2) + ';\n';
fs.writeFileSync(path.join(JS, 'data-refs.js'), refsBody);

// 校验
const problems = [];
const ids = new Set();
for (const l of all) {
  if (!l.id) problems.push('缺 id');
  if (ids.has(l.id)) problems.push('重复 id ' + l.id);
  ids.add(l.id);
  if (!(l.sections && l.sections.length >= 7 && l.sections.length <= 12)) problems.push(l.id + ': sections=' + (l.sections || []).length);
  if (!(l.quiz && l.quiz.length === 3)) problems.push(l.id + ': quiz');
  for (const q of l.quiz || []) if (!q.options || q.options.length !== 4) problems.push(l.id + ': options');
  if (!(l.exercise && l.exercise.items && l.exercise.items.length >= 2)) problems.push(l.id + ': exercise');
}
console.log('lessons', all.length, 'problems', problems.length);
problems.slice(0, 10).forEach((p) => console.log(' -', p));
if (problems.length) process.exitCode = 1;
