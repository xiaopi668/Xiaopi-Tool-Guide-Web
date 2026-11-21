import fs from 'node:fs';
import vm from 'node:vm';

const files = ['data-terminal.js','data-git.js','data-vscode.js','data-dev.js','data-efficiency.js','data-agents.js','data-ai.js'];
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of files) {
  const code = fs.readFileSync('assets/js/' + f, 'utf8');
  try { vm.runInContext(code, sandbox, { filename: f }); }
  catch (e) { console.log('LOAD_FAIL', f, e.message); }
}
const lessons = sandbox.window.PS.lessons || [];
console.log('TOTAL', lessons.length);
const allowed = ['text','tip','warn','steps','table','code','terminal','shortcuts','compare'];
const problems = [];
const ids = new Set();
for (const l of lessons) {
  if (ids.has(l.id)) problems.push('dup id ' + l.id);
  ids.add(l.id);
  if (!l.track) problems.push(l.id + ': no track');
  if (!(l.sections && l.sections.length >= 7 && l.sections.length <= 12)) problems.push(l.id + ': sections=' + (l.sections||[]).length);
  const types = (l.sections||[]).map(s => s.type);
  for (const t of types) if (!allowed.includes(t)) problems.push(l.id + ': bad type ' + t);
  if (!types.includes('terminal') && !types.includes('code')) problems.push(l.id + ': no terminal/code');
  if (!types.includes('table') && !types.includes('shortcuts')) problems.push(l.id + ': no table/shortcuts');
  if (!types.includes('tip') && !types.includes('warn')) problems.push(l.id + ': no tip/warn');
  for (const s of l.sections || []) {
    if (s.type === 'table') for (const row of s.rows || []) if (row.length !== s.head.length) problems.push(l.id + ': table row mismatch');
    if (s.type === 'quiz') problems.push(l.id + ': quiz section?');
    if (s.type === 'compare' && (!s.left || !s.right)) problems.push(l.id + ': compare missing side');
    if (s.type === 'terminal' && !s.command) problems.push(l.id + ': terminal no command');
  }
  if (!(l.quiz && l.quiz.length === 3)) problems.push(l.id + ': quiz=' + (l.quiz||[]).length);
  for (const q of l.quiz || []) {
    if (q.options.length !== 4) problems.push(l.id + ': options=' + q.options.length);
    if (!(q.answer >= 0 && q.answer <= 3)) problems.push(l.id + ': answer=' + q.answer);
    if (!q.explain) problems.push(l.id + ': no explain');
  }
  if (!l.exercise || !(l.exercise.items && l.exercise.items.length >= 2)) problems.push(l.id + ': exercise');
  const text = JSON.stringify(l);
  const han = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (han < 1200) problems.push(l.id + ': only ' + han + ' hanzi');
  console.log([l.order, l.id, l.track, l.minutes, (l.sections||[]).length, han, l.title].join(' | '));
}
console.log('PROBLEMS', problems.length);
problems.slice(0, 40).forEach(p => console.log('  -', p));
