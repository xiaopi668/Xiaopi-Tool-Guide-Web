#!/usr/bin/env node
/* 工具学校 · 端到端自检：用本机 headless Chrome 打开页面，跑一遍真实交互。
   用法：先启动一个带调试端口的浏览器，再 node tools/verify.mjs [--shots] */

import { writeFileSync, mkdirSync } from 'node:fs';

const CDP_BASE = process.env.CDP_BASE || 'http://127.0.0.1:9222';
const PAGE_URL = 'file://' + process.cwd() + '/index.html';
const WANT_SHOTS = process.argv.includes('--shots');
const SHOT_DIR = process.cwd() + '/screenshots';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '  -> ' + detail : ''));
}

async function newTarget() {
  const res = await fetch(CDP_BASE + '/json/new?about:blank', { method: 'PUT' });
  if (!res.ok) throw new Error('无法新建标签页: ' + res.status);
  return await res.json();
}
async function closeTarget(id) {
  try { await fetch(CDP_BASE + '/json/close/' + id); } catch (e) {}
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', () => reject(new Error('WebSocket 连接失败')));
  });
}
function makeClient(ws) {
  let id = 0;
  const pending = new Map();
  const events = [];
  const listeners = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.method + ': ' + JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
      listeners.forEach((fn) => fn(msg));
    }
  });
  return {
    send(method, params) {
      return new Promise((resolve, reject) => {
        const mid = ++id;
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
      });
    },
    on(fn) { listeners.push(fn); },
    waitEvent(method, timeout) {
      return new Promise((resolve) => {
        const hit = events.find((e) => e.method === method);
        if (hit) return resolve(hit);
        const t = setTimeout(() => resolve(null), timeout || 8000);
        listeners.push((m) => { if (m.method === method) { clearTimeout(t); resolve(m); } });
      });
    }
  };
}
async function evaluate(client, expr) {
  const r = await client.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('页面脚本报错: ' + ((d.exception && d.exception.description) || d.text));
  }
  return r.result.value;
}
async function goto(client, hash) {
  await client.send('Page.navigate', { url: PAGE_URL + hash });
  await client.waitEvent('Page.loadEventFired', 6000);
  await new Promise((r) => setTimeout(r, 320));
}
async function shot(client, name, full) {
  const params = { format: 'png' };
  if (full !== false) params.captureBeyondViewport = true;
  const r = await client.send('Page.captureScreenshot', params);
  writeFileSync(SHOT_DIR + '/' + name + '.png', Buffer.from(r.data, 'base64'));
}

const target = await newTarget();
const ws = await connect(target.webSocketDebuggerUrl);
const client = makeClient(ws);
const consoleErrors = [];
client.on((m) => {
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    consoleErrors.push((d.exception && d.exception.description) || d.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value || a.description || '').join(' '));
  }
});
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

console.log('\n== 1. 数据与首页 ==');
await goto(client, '#/');
const data = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var P=window.PS;return {lessons:P.lessons.length,commands:P.commands.length,shortcuts:P.shortcuts.length,gloss:P.glossary.length,ids:P.lessons.map(function(l){return l.id}).join(","),tracks:P.lessons.reduce(function(a,l){a[l.track]=(a[l.track]||0)+1;return a},{}),orders:P.lessons.map(function(l){return l.order}).sort(function(a,b){return a-b}).join(",")};})())'));
console.log('  课程 ' + data.lessons + ' 节 | 命令 ' + data.commands + ' 条 | 快捷键 ' + data.shortcuts + ' 个 | 术语 ' + data.gloss + ' 条');
check('课程 39 节', data.lessons === 39, data.lessons);
check('七条轨道齐全', Object.keys(data.tracks).length === 7, JSON.stringify(data.tracks));
check('命令不少于 100 条', data.commands >= 100, data.commands);
check('快捷键不少于 45 个', data.shortcuts >= 45, data.shortcuts);
check('术语不少于 25 条', data.gloss >= 25, data.gloss);
check('课程编号连续 1-39', data.orders === Array.from({length: 39}, (_, i) => i + 1).join(','), data.orders.slice(0, 40));

const schema = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var P=window.PS;var bad=[];var allowed=["text","tip","warn","steps","table","code","terminal","shortcuts","compare"];P.lessons.forEach(function(l){var types=(l.sections||[]).map(function(s){return s.type});if(!(l.sections&&l.sections.length>=7&&l.sections.length<=12))bad.push(l.id+":sections="+(l.sections||[]).length);types.forEach(function(t){if(allowed.indexOf(t)<0)bad.push(l.id+":bad "+t)});if(types.indexOf("terminal")<0&&types.indexOf("code")<0)bad.push(l.id+":no term/code");if(types.indexOf("table")<0&&types.indexOf("shortcuts")<0)bad.push(l.id+":no table");(l.quiz||[]).forEach(function(q){if(q.options.length!==4)bad.push(l.id+":opt");if(!(q.answer>=0&&q.answer<=3))bad.push(l.id+":ans")});if(!(l.quiz&&l.quiz.length===3))bad.push(l.id+":quiz"+(l.quiz||[]).length);if(!(l.exercise&&l.exercise.items&&l.exercise.items.length>=2))bad.push(l.id+":ex");(l.sections||[]).forEach(function(s){if(s.type==="table")(s.rows||[]).forEach(function(r){if(r.length!==s.head.length)bad.push(l.id+":row")})})});return {bad:bad.slice(0,8),n:bad.length};})())'));
check('全部课程符合数据契约', schema.n === 0, schema.n ? schema.bad.join('; ') : '0 处问题');

const home = JSON.parse(await evaluate(client, 'JSON.stringify((function(){return {h1:(document.querySelector(".hero h1")||{}).textContent||"",tracks:document.querySelectorAll(".track").length,links:document.querySelectorAll(".track__lesson").length,features:document.querySelectorAll(".feature").length,term:document.querySelectorAll(".hero__terminal .term__line").length,nav:document.querySelectorAll(".sidebar__item").length,side:!!document.querySelector(".sidebar")&&getComputedStyle(document.querySelector(".sidebar")).display};})())'));
check('首页渲染主标题', home.h1.replace(/\s/g, '').length > 6, home.h1.trim().replace(/\n/g, ' '));
check('首页 7 条轨道 / 39 个课程入口', home.tracks === 7 && home.links === 39, home.tracks + ' / ' + home.links);
check('首页首屏终端示例', home.term === 3, home.term + ' 组命令');
check('首页不显示侧边栏（整幅排版）', home.side === 'none', home.side);

console.log('\n== 2. 逐课渲染 ==');
const ids = data.ids.split(',');
let badLessons = [];
for (const lid of ids) {
  await goto(client, '#/lesson/' + lid);
  const info = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var l=window.PS.lessons.filter(function(x){return x.id==="' + lid + '"})[0];return {h1:(document.querySelector(".lesson__title")||{}).textContent||"",expected:l.title,term:document.querySelectorAll(".term").length,code:document.querySelectorAll(".code").length,opts:document.querySelectorAll(".quiz__opt").length,quiz:(l.quiz||[]).length,checks:document.querySelectorAll(".exercise__check").length,sc:document.querySelectorAll(".sc__row").length,side:!!document.querySelector(".sidebar__item")};})())'));
  if (info.h1.trim() !== info.expected) badLessons.push(lid + ':标题不符');
  if (info.term + info.code < 1) badLessons.push(lid + ':无可复制块');
  if (info.opts !== info.quiz * 4) badLessons.push(lid + ':选项数');
  if (info.checks < 2) badLessons.push(lid + ':练习项');
  if (!info.side) badLessons.push(lid + ':侧栏缺失');
}
check('29 课全部完整渲染', badLessons.length === 0, badLessons.join('; ') || '全部通过');

console.log('\n== 3. 课程交互 ==');
await goto(client, '#/lesson/git-undo');
const quiz = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var l=window.PS.lessons.filter(function(x){return x.id==="git-undo"})[0];var boxes=document.querySelectorAll("[data-qbox]");(l.quiz||[]).forEach(function(q,i){boxes[i].querySelectorAll(".quiz__opt")[q.answer].click()});return {correct:document.querySelectorAll(".quiz__opt.is-correct").length,explain:document.querySelectorAll(".quiz__explain:not([hidden])").length,done:document.querySelectorAll(".sidebar__item.is-active .tick").length,pct:(document.getElementById("progressPct")||{}).textContent};})())'));
check('测验可作答并给出解析', quiz.correct === 3 && quiz.explain === 3, quiz.correct + ' 题 / 解析 ' + quiz.explain);
check('全部答对自动完成并更新进度', quiz.done === 1 && quiz.pct !== '0%', '进度 ' + quiz.pct);

const ex = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var c=document.querySelector(".exercise__check");if(c.checked)c.click();c.click();var saved=JSON.parse(localStorage.getItem("toolschool-v1")||"{}").practice["git-undo"]||[];return {checked:c.checked,strike:!!document.querySelector(".exercise__item.is-checked"),stored:saved[0]};})())'));
check('练习复选框可勾选并本地保存', ex.checked && ex.strike && !!ex.stored, JSON.stringify(ex.stored));

const copy = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var b=document.querySelector(".term .copybtn");b.click();return {text:b.textContent.trim(),done:b.classList.contains("is-done")};})())'));
check('复制按钮有反馈', copy.done && copy.text.indexOf("已复制") >= 0, copy.text);

console.log('\n== 4. 命令速查 ==');
await goto(client, '#/commands');
const cmds = JSON.parse(await evaluate(client, 'JSON.stringify((function(){return {rows:document.querySelectorAll(".cmd-row[data-tool]").length,groups:document.querySelectorAll(".cmd-group[data-group-tool]").length,filters:document.querySelectorAll("#cmdFilters .filter").length};})())'));
check('命令速查渲染全部条目', cmds.rows === data.commands && cmds.groups >= 7, cmds.rows + ' 条 / ' + cmds.groups + ' 组 / ' + cmds.filters + ' 个筛选');
const filt = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.querySelectorAll("#cmdFilters .filter")[1].click();var shown=0;document.querySelectorAll(".cmd-row[data-tool]").forEach(function(r){if(!r.hidden)shown++});var tool=document.querySelectorAll("#cmdFilters .filter")[1].getAttribute("data-tool");return {shown:shown,all:document.querySelectorAll(".cmd-row[data-tool]").length,tool:tool};})())'));
check('按工具筛选生效', filt.shown > 0 && filt.shown < filt.all, filt.tool + ' → ' + filt.shown + ' 条');
await evaluate(client, 'document.querySelectorAll("#cmdFilters .filter")[0].click()');
const search = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var i=document.getElementById("cmdSearch");i.value="rebase";i.dispatchEvent(new Event("input",{bubbles:true}));var n=0;document.querySelectorAll(".cmd-row[data-tool]").forEach(function(r){if(!r.hidden)n++});return {n:n,empty:document.getElementById("cmdEmpty").hidden};})())'));
check('命令搜索生效', search.n > 0 && search.n < 20 && search.empty, '命中 ' + search.n + ' 条');
const emptyHint = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.querySelectorAll("#cmdFilters .filter")[1].click();var i=document.getElementById("cmdSearch");i.value="rebase";i.dispatchEvent(new Event("input",{bubbles:true}));var out={text:document.getElementById("cmdEmpty").textContent,hidden:document.getElementById("cmdEmpty").hidden};document.querySelectorAll("#cmdFilters .filter")[0].click();i.value="";i.dispatchEvent(new Event("input",{bubbles:true}));return out;})())'));
check('筛选下搜不到时提示当前范围', !emptyHint.hidden && emptyHint.text.indexOf('当前只在') >= 0, emptyHint.text);

const cmdOs = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.querySelector("#cmdPlatform [data-cmd-os=win]").click();function rowBy(pred){var rs=document.querySelectorAll(".cmd-row[data-tool]");for(var i=0;i<rs.length;i++){if(pred(rs[i]))return rs[i]}return null}var lsRow=rowBy(function(r){return r.querySelector(".cmd-row__code").textContent.indexOf("Get-ChildItem -Force")>=0});var cdRow=rowBy(function(r){return r.querySelector(".cmd-row__code").textContent==="cd -"});var note1=document.getElementById("cmdOsNote").textContent;var hidden=cdRow?cdRow.hidden:null;document.getElementById("cmdAllPlatforms").click();var shown=cdRow?cdRow.hidden:null;document.getElementById("cmdAllPlatforms").click();var hidden2=cdRow?cdRow.hidden:null;var btnCount=document.querySelectorAll("#cmdPlatform [data-cmd-os]").length;document.querySelector("#cmdPlatform [data-cmd-os=posix]").click();var ssRow=rowBy(function(r){return r.querySelector(".cmd-row__code").textContent==="ss -ltnp"});var openRow=rowBy(function(r){return r.querySelector(".cmd-row__code").textContent==="open ."});return {btnCount:btnCount,ls:!!lsRow,hidden:hidden,shown:shown,hidden2:hidden2,note1:note1,ss:ssRow?ssRow.textContent.indexOf("仅 Linux")>=0:false,mac:openRow?openRow.textContent.indexOf("仅 macOS")>=0:false};})())'));check('命令页只有 macOS/Linux 与 Windows 两档', cmdOs.btnCount === 2, cmdOs.btnCount + ' 档');check('Windows 视图显示对应写法', cmdOs.ls && cmdOs.hidden === true, 'ls → Get-ChildItem -Force');check('Windows 下默认隐藏 POSIX 专属命令', cmdOs.note1.indexOf('已隐藏') >= 0, cmdOs.note1);check('「显示其他系统」开关可切换', cmdOs.shown === false && cmdOs.hidden2 === true);check('合并视图逐条标注仅 Linux / 仅 macOS', cmdOs.ss && cmdOs.mac, 'ss=仅Linux / open=仅macOS');
console.log('\n== 5. 快捷键与挑战 ==');
await goto(client, '#/shortcuts');
const sc = JSON.parse(await evaluate(client, 'JSON.stringify((function(){return {rows:document.querySelectorAll(".cmd-row[data-cat]").length,q:!!document.querySelector(".trainer__q"),opts:document.querySelectorAll(".trainer__opt").length,kbds:document.querySelectorAll(".cmd-row[data-cat] kbd").length};})())'));
check('快捷键列表渲染', sc.rows === data.shortcuts && sc.kbds > 50, sc.rows + ' 条');
check('快捷键挑战出题', sc.q && sc.opts === 4, sc.opts + ' 个选项');
const tr = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.querySelectorAll(".trainer__opt")[0].click();return {correct:document.querySelectorAll(".trainer__opt.is-correct").length,next:!document.getElementById("trNext").hidden,score:document.getElementById("trScore").textContent};})())'));
check('挑战可作答并显示得分', tr.correct === 1 && tr.next, tr.score);
const nextQ = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.getElementById("trNext").click();return {opts:document.querySelectorAll(".trainer__opt").length,disabled:document.querySelectorAll(".trainer__opt:disabled").length};})())'));
check('下一题重置选项', nextQ.opts === 4 && nextQ.disabled === 0, nextQ.opts + ' 个新选项');
const plat = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var before=document.querySelector(".cmd-row[data-cat] kbd").textContent;document.querySelector("[data-platform=mac]").click();var after=document.querySelector(".cmd-row[data-cat] kbd").textContent;return {before:before,after:after};})())'));
check('平台切换改变按键显示', plat.before !== plat.after && plat.after === '⌘', plat.before + ' → ' + plat.after);
const linux = JSON.parse(await evaluate(client, 'JSON.stringify((function(){document.querySelector("[data-platform=linux]").click();var rows=document.querySelectorAll(".cmd-row--shortcut");var row=null;for(var i=0;i<rows.length;i++){if(rows[i].textContent.indexOf("复制选中")>=0){row=rows[i];break}}var keys=[];if(row){var ks=row.querySelectorAll("kbd");for(var j=0;j<ks.length;j++)keys.push(ks[j].textContent)}var btn=document.querySelector("[data-platform=linux]");return {keys:keys,active:btn?btn.classList.contains("is-active"):false,count:document.querySelectorAll("[data-platform]").length};})())'));
check('Linux 平台按键显示正确', linux.active && linux.count === 3 && linux.keys.join('') === 'CtrlShiftC', linux.count + ' 个平台按钮 / ' + linux.keys.join(' + '));
await evaluate(client, 'document.querySelector("[data-platform=win]").click()');

console.log('\n== 6. 搜索面板 / 术语 / 移动端 ==');
await goto(client, '#/');
await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', modifiers: 4, key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75 });
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: 4, key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75 });
await new Promise((r) => setTimeout(r, 250));
const pal = JSON.parse(await evaluate(client, 'JSON.stringify((function(){return {open:!document.getElementById("palette").hidden,items:document.querySelectorAll(".palette__item").length,focus:document.activeElement&&document.activeElement.id};})())'));
check('⌘K 打开搜索面板', pal.open && pal.items > 5, pal.items + ' 条结果');
const palFilter = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var i=document.getElementById("paletteInput");i.value="ssh-keygen";i.dispatchEvent(new Event("input",{bubbles:true}));return {items:document.querySelectorAll(".palette__item").length,first:(document.querySelector(".palette__item .label")||{}).textContent||""};})())'));
check('搜索面板可过滤', palFilter.items > 0 && palFilter.items <= 5, palFilter.items + ' 条：' + palFilter.first);
await evaluate(client, 'document.getElementById("palette").hidden = true;');

await goto(client, '#/glossary');
const gl = await evaluate(client, 'document.querySelectorAll(".gloss__item").length');
check('术语表渲染', gl === data.gloss, gl + ' 条');

await client.send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: true });
await goto(client, '#/lesson/terminal-intro');
const mob = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var btn=document.getElementById("menuBtn");var vis=btn?getComputedStyle(btn).display:"none";btn.click();var open=document.body.classList.contains("nav-open");var side=getComputedStyle(document.getElementById("sidebar")).transform;return {btn:vis,open:open,width:document.documentElement.clientWidth,side:side};})())'));
check('移动端目录可打开', mob.btn !== 'none' && mob.open, '按钮 ' + mob.btn + ' / 抽屉 ' + mob.side);

console.log('\n== 7. 入场动画 ==');
await goto(client, '#/');
const rv = JSON.parse(await evaluate(client, 'JSON.stringify((function(){var h=document.querySelector(".hero h1");return {js:document.documentElement.classList.contains("js"),count:document.querySelectorAll(".reveal").length,inHero:h.classList.contains("in"),dur:getComputedStyle(h).transitionDuration};})())'));
check('入场动画已启用', rv.js && rv.count >= 18 && rv.inHero && rv.dur !== '0s', rv.count + ' 个元素 / ' + rv.dur);
await goto(client, '#/lesson/git-undo');
const revBefore = await evaluate(client, 'document.querySelectorAll(".reveal.in").length');
await evaluate(client, 'window.scrollTo(0, document.body.scrollHeight)');
await new Promise((r) => setTimeout(r, 1000));
const revAfter = await evaluate(client, 'document.querySelectorAll(".reveal.in").length');
check('滚动后元素继续入场', revAfter > revBefore, revBefore + ' → ' + revAfter);
await goto(client, '#/');
const delayed = await evaluate(client, 'JSON.stringify((function(){var els=document.querySelectorAll("[data-stagger] [data-delay]");var vals=[];for(var i=0;i<els.length;i++)vals.push(els[i].getAttribute("data-delay"));return vals;})())');
const dv = JSON.parse(delayed);
check('横向同组元素有错峰延迟', dv.length > 3 && dv.indexOf('70') >= 0, dv.slice(0, 6).join(' / ') + ' ms');

console.log('\n== 8. 运行期错误 ==');
check('无 JS 报错', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | ') || '0 个错误');

if (WANT_SHOTS) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(client, 'document.body.classList.remove("nav-open"); var s=document.getElementById("scrim"); if(s) s.hidden=true;');
  await new Promise((r) => setTimeout(r, 1800));
  const shots = [['#/', '01-home'], ['#/lesson/git-undo', '02-lesson'], ['#/lesson/vscode-editing', '03-shortcuts-lesson'], ['#/commands', '04-commands'], ['#/shortcuts', '05-shortcuts'], ['#/glossary', '06-glossary']];
  for (const [hash, name] of shots) {
    await goto(client, hash);
    await evaluate(client, 'document.querySelectorAll(".reveal").forEach(function(e){e.classList.add("in","no-anim");e.style.willChange="auto"})');
    await new Promise((r) => setTimeout(r, 260));
    await shot(client, name);
  }
  await goto(client, '#/');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise((r) => setTimeout(r, 400));
  await shot(client, '07-mobile-home', false);
  console.log('\n截图已写入 ' + SHOT_DIR);
}

const failed = results.filter((r) => !r.ok);
console.log('\n===== 结果：' + (results.length - failed.length) + '/' + results.length + ' 项通过 =====');
failed.forEach((f) => console.log('  未通过：' + f.name + ' -> ' + f.detail));
ws.close();
await closeTarget(target.id);
process.exit(failed.length ? 1 : 0);
