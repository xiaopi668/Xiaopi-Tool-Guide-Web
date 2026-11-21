/* 工具学校 · 应用逻辑（无依赖，双击 index.html 即可运行） */
(function () {
  'use strict';

  var PS = (window.PS = window.PS || {});
  PS.lessons = PS.lessons || [];
  PS.commands = PS.commands || [];
  PS.shortcuts = PS.shortcuts || [];
  PS.glossary = PS.glossary || [];

  /* ------------------------------------------------------------ 轨道定义 */
  var TRACKS = [
    { key: 'terminal', name: '终端与系统', en: 'Terminal & Shell',
      desc: '命令行不是黑魔法。用它看文件、找东西、管进程，很多图形界面里绕半天的操作，一行命令就完了。' },
    { key: 'git', name: 'Git 与版本控制', en: 'Version Control',
      desc: '把每一次改动变成能回头的快照。分支、合并、冲突、回滚，按真实工作流一步步走一遍。' },
    { key: 'vscode', name: 'VS Code', en: 'Editor',
      desc: '别只用鼠标点。命令面板、多光标、调试器、远程开发，把编辑器变成你的工作台。' },
    { key: 'dev', name: '开发环境与工具链', en: 'Toolchain',
      desc: 'Node、Python、浏览器开发者工具、Docker、SSH：让一个项目在本机跑起来需要的那一圈工具。' },
    { key: 'efficiency', name: '效率与排错', en: 'Efficiency',
      desc: '别名、历史、报错排查、安全习惯。决定你走得快不快的，往往是这些不起眼的细节。' },
    { key: 'agents', name: 'AI 编程助手', en: 'Agents',
      desc: 'Claude Code、Codex CLI、dsh：让 agent 读代码、改文件、跑命令，以及给它多大权限才安全。' },
    { key: 'ai', name: 'AI 时代', en: 'AI Everyday',
      desc: '聊天、搜索、写作、核查、本地模型：把 AI 用进日常工作，而不是只看演示。' }
  ];
  var TRACK_MAP = {};
  TRACKS.forEach(function (t) { TRACK_MAP[t.key] = t; });

  var TOOL_NAMES = {
    terminal: '终端 / Shell', git: 'Git', vscode: 'VS Code', node: 'Node.js / npm',
    python: 'Python', docker: 'Docker', ssh: 'SSH'
  };
  var TOOL_ORDER = ['terminal', 'git', 'vscode', 'node', 'python', 'docker', 'ssh'];

  var STORE_KEY = 'toolschool-v1';

  /* ------------------------------------------------------------ 状态 */
  var state = { done: {}, practice: {}, platform: null, cmdOs: null };
  try {
    var rawStored = localStorage.getItem(STORE_KEY);
    if (rawStored) {
      var parsed = JSON.parse(rawStored);
      state.done = parsed.done || {};
      state.practice = parsed.practice || {};
      state.platform = parsed.platform || null;
      state.cmdOs = parsed.cmdOs || null;
    }
  } catch (err) { /* 隐私模式或 file:// 限制，忽略 */ }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (err) {}
  }

  var lessons = PS.lessons.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  var lessonIndex = {};
  var trackLessons = {};
  lessons.forEach(function (l, i) {
    lessonIndex[l.id] = i;
    if (!trackLessons[l.track]) trackLessons[l.track] = [];
    trackLessons[l.track].push(l);
  });

  var UI = { cmdQuery: '', cmdTool: 'all', cmdAllPlatforms: false, scQuery: '', scCat: 'all' };

  /* ------------------------------------------------------------ 工具函数 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function inline(s) {
    return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, 1900);
  }

  var copySeq = 0;
  var copyRegistry = {};
  function registerCopy(text) {
    copySeq += 1;
    var id = 'cp' + copySeq;
    copyRegistry[id] = text;
    return id;
  }
  function copyText(text) {
    if (!text) { toast('没有可复制的内容'); return; }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        toast(ok ? '已复制到剪贴板' : '复制失败，请手动选中');
      } catch (err) { toast('复制失败，请手动选中'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板'); }, fallback);
    } else { fallback(); }
  }
  function copyButton(text, label) {
    return '<button class="copybtn" type="button" data-copy="' + registerCopy(text) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>' +
      (label || '复制') + '</button>';
  }
  function keysHtml(arr) {
    return (arr || []).map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('');
  }

  function detectPlatform() {
    var p = '';
    try { p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''; } catch (err) {}
    if (/mac|iphone|ipad|ipod/i.test(p)) return 'mac';
    if (/linux|android|ubuntu|fedora|debian/i.test(p)) return 'linux';
    return 'win';
  }
  function platform() { return state.platform || detectPlatform(); }
  function platformLabel() {
    return { mac: 'macOS', win: 'Windows', linux: 'Linux' }[platform()] || 'Windows';
  }
  function platformButtons() {
    var p = platform();
    var names = { mac: 'macOS', win: 'Windows', linux: 'Linux' };
    return ['mac', 'win', 'linux'].map(function (k) {
      return '<button type="button" data-platform="' + k + '" class="' + (p === k ? 'is-active' : '') + '">' + names[k] + '</button>';
    }).join('');
  }
  function commandFor(c, p) {
    if (!c) return '';
    if (p === 'win') return c.win || c.cmd;
    if (p === 'mac') return c.mac || c.cmd;
    return c.cmd;
  }
  function osLabel(os) {
    var names = { mac: 'macOS', win: 'Windows', linux: 'Linux' };
    return (os || []).map(function (k) { return names[k] || k; }).join(' / ');
  }
  function cmdPlatform() {
    if (state.cmdOs === 'win' || state.cmdOs === 'posix') return state.cmdOs;
    return platform() === 'win' ? 'win' : 'posix';
  }
  function cmdPlatformButtons() {
    var p = cmdPlatform();
    return '<button type="button" data-cmd-os="posix" class="' + (p === 'posix' ? 'is-active' : '') + '">macOS / Linux</button>' +
      '<button type="button" data-cmd-os="win" class="' + (p === 'win' ? 'is-active' : '') + '">Windows</button>';
  }
  function osBadge(c) {
    var os = c.os || ['mac', 'linux', 'win'];
    if (cmdPlatform() === 'win') {
      return os.indexOf('win') < 0 ? '仅 ' + osLabel(os) : '';
    }
    var hasMac = os.indexOf('mac') >= 0;
    var hasLinux = os.indexOf('linux') >= 0;
    if (hasLinux && !hasMac) return '仅 Linux';
    if (hasMac && !hasLinux) return '仅 macOS';
    if (!hasMac && !hasLinux) return '仅 Windows';
    return '';
  }
  function keysOf(shortcut, p) {
    if (!shortcut) return [];
    if (p === 'mac') return shortcut.mac || [];
    if (p === 'linux') return shortcut.linux || shortcut.win || [];
    return shortcut.win || [];
  }

  /* ------------------------------------------------------------ 入场动画 */
  var REVEAL = (function () {
    var supported = false;
    try { supported = !!(window.CSS && CSS.supports && CSS.supports('translate', '0 1px')); } catch (err) {}
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) {}
    var hasIO = typeof window.IntersectionObserver === 'function';
    var enabled = supported && !reduce && hasIO;
    if (enabled) document.documentElement.classList.add('js');
    var io = null;

    function showNow(nodes) {
      nodes.forEach(function (el) {
        el.classList.add('in', 'no-anim');
        el.style.willChange = 'auto';
      });
    }

    function setup(skip) {
      var nodes = qa('.reveal');
      if (!nodes.length) return;
      if (!enabled || skip) { showNow(nodes); return; }
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            var delay = el.getAttribute('data-delay');
            if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
            el.classList.add('in');
            io.unobserve(el);
            el.addEventListener('transitionend', function () {
              el.style.willChange = 'auto';
            }, { once: true });
          });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
      }
      io.disconnect();
      nodes.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var parent = el.parentNode;
        if (!el.hasAttribute('data-delay') && parent && parent.hasAttribute && parent.hasAttribute('data-stagger')) {
          var sibs = Array.prototype.filter.call(parent.children, function (n) {
            return n.classList && n.classList.contains('reveal');
          });
          var idx = sibs.indexOf(el);
          if (idx > 0) el.setAttribute('data-delay', String(Math.min(idx, 6) * 70));
        }
        io.observe(el);
      });
    }

    return { setup: setup };
  })();

  function currentRoute() {
    var h = (location.hash || '').replace(/^#/, '');
    var parts = h.split('/').filter(function (x) { return x.length; });
    if (!parts.length) return { name: 'home' };
    if (parts[0] === 'lesson') return { name: 'lesson', id: parts[1] || '' };
    if (['commands', 'shortcuts', 'glossary'].indexOf(parts[0]) >= 0) return { name: parts[0] };
    return { name: 'notfound' };
  }
  function currentLesson() {
    var r = currentRoute();
    if (r.name !== 'lesson') return null;
    return lessonIndex[r.id] != null ? lessons[lessonIndex[r.id]] : null;
  }

  /* ------------------------------------------------------------ 进度 */
  function doneCount() { return lessons.filter(function (l) { return state.done[l.id]; }).length; }
  function pct() { return lessons.length ? Math.round((doneCount() / lessons.length) * 100) : 0; }
  function paintProgress() {
    var fill = document.getElementById('progressFill');
    var label = document.getElementById('progressPct');
    if (fill) fill.style.width = pct() + '%';
    if (label) label.textContent = pct() + '%';
  }
  function markDone(id, on) {
    if (on) state.done[id] = true; else delete state.done[id];
    save(); paintProgress(); paintSidebar();
  }

  /* ------------------------------------------------------------ 侧栏 */
  function paintSidebar() {
    var side = document.getElementById('sidebar');
    if (!side) return;
    var cur = currentLesson();
    var html = [];
    TRACKS.forEach(function (track) {
      var list = trackLessons[track.key] || [];
      if (!list.length) return;
      var done = list.filter(function (l) { return state.done[l.id]; }).length;
      html.push('<div class="sidebar__group">');
      html.push('<div class="sidebar__label"><span>' + esc(track.name) + '</span><b>' + done + '/' + list.length + '</b></div>');
      list.forEach(function (l) {
        var active = cur && cur.id === l.id;
        html.push('<a class="sidebar__item' + (active ? ' is-active' : '') + '" href="#/lesson/' + l.id + '">' +
          '<span class="n">' + pad2(l.order) + '</span>' +
          '<span class="tx">' + esc(l.title) + '</span>' +
          (state.done[l.id] ? '<span class="tick">✓</span>' : '') +
          '</a>');
      });
      html.push('</div>');
    });
    side.innerHTML = html.join('');
  }

  /* ------------------------------------------------------------ 渲染入口 */
  function paintNav(r) {
    var map = { home: 'home', commands: 'commands', shortcuts: 'shortcuts', glossary: 'glossary' };
    qa('#nav a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === (map[r.name] || ''));
    });
  }
  function updateReadbar() {
    var bar = document.getElementById('readbar');
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  function render(keepScroll) {
    var r = currentRoute();
    copySeq = 0;
    copyRegistry = {};
    document.body.classList.remove('view-home', 'view-lesson', 'view-commands', 'view-shortcuts', 'view-glossary', 'view-notfound');
    document.body.classList.add('view-' + r.name);
    var main = document.getElementById('main');
    var html = '';
    var title = '工具学校 · 把电脑用成一把工具';
    if (r.name === 'home') {
      html = viewHome();
    } else if (r.name === 'lesson') {
      var l = currentLesson();
      html = l ? viewLesson(l) : viewNotFound();
      if (l) title = l.title + ' · 工具学校';
    } else if (r.name === 'commands') {
      html = viewCommands();
      title = '命令速查 · 工具学校';
    } else if (r.name === 'shortcuts') {
      html = viewShortcuts();
      title = '快捷键 · 工具学校';
    } else if (r.name === 'glossary') {
      html = viewGlossary();
      title = '术语表 · 工具学校';
    } else {
      html = viewNotFound();
    }
    main.innerHTML = html;
    document.title = title;
    paintSidebar();
    paintProgress();
    paintNav(r);
    var foot = document.getElementById('footStats');
    if (foot) foot.textContent = lessons.length + ' 节课 · ' + TRACKS.length + ' 条轨道';
    if (r.name === 'commands') initCommandsView();
    if (r.name === 'shortcuts') initShortcutsView();
    REVEAL.setup(keepScroll === true);
    updateReadbar();
    if (!keepScroll) window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ 首页 */
  var HERO_TERM = [
    ['git status', 'On branch main\nnothing to commit, working tree clean'],
    ['git switch -c feature/login', "Switched to a new branch 'feature/login'"],
    ['npm run dev', '  VITE v6.0  ready in 312 ms\n  Local:  http://localhost:5173/']
  ];
  function heroTerminal() {
    var body = HERO_TERM.map(function (pair) {
      return '<div class="term__line"><span class="term__prompt">$</span><span class="term__cmd">' + esc(pair[0]) + '</span></div>' +
        '<pre class="term__out">' + esc(pair[1]) + '</pre>';
    }).join('');
    return '<div class="hero__terminal"><div class="term__head"><span class="term__dots"><i></i><i></i><i></i></span>' +
      '<span class="term__label">~/projects/demo - zsh</span></div><div class="term__body">' + body + '</div></div>';
  }

  function viewHome() {
    var out = [];
    out.push('<div class="container">');
    out.push('<section class="hero enter">');
    out.push('<div class="hero__grid" data-stagger>');
    out.push('<div data-stagger>');
    out.push('<p class="hero__eyebrow meta reveal"><span class="dot"></span>计算机工具教程 · Tool School</p>');
    out.push('<h1 class="display reveal">把电脑<br><span class="nowrap">用成一把工具</span></h1>');
    out.push('<p class="hero__lede lede reveal">终端、Git、VS Code、开发环境、排错手册。' +
      lessons.length + ' 节短课，每节 10 到 15 分钟，配真实命令、快捷键和报错解法。不讲概念，只讲怎么用。</p>');
    out.push('<div class="hero__cta reveal">');
    out.push('<a class="lg-pill lg-pill--solid lg-pill--cta" href="#/lesson/' + (lessons[0] ? lessons[0].id : 'terminal-intro') + '">从第一课开始 <span aria-hidden="true">→</span></a>');
    out.push('<a class="lg-pill lg-pill--ghost lg-pill--cta" href="#/commands">浏览命令速查</a>');
    out.push('</div>');
    out.push('<div class="hero__meta reveal">');
    out.push('<div><b>' + lessons.length + '</b><span>节课</span></div>');
    out.push('<div><b>' + TRACKS.length + '</b><span>条学习轨道</span></div>');
    out.push('<div><b>' + PS.commands.length + '</b><span>条命令</span></div>');
    out.push('<div><b>' + PS.shortcuts.length + '</b><span>个快捷键</span></div>');
    out.push('</div>');
    out.push('</div>');
    out.push('<div class="reveal right">' + heroTerminal() + '</div>');
    out.push('</div></section></div>');

    out.push('<section class="section" id="tracks"><div class="container">');
    out.push('<div class="section__head reveal"><div><span class="meta">Learning Path</span>' +
      '<h2 class="h2">' + TRACKS.length + ' 条轨道，<br>从终端走到能自己解决问题</h2>' +
      '<p>按顺序学最稳，也可以直接跳到你现在卡住的那一块。每节课都能单独看。</p></div>' +
      '<a class="section__link" href="#/lesson/' + (lessons[0] ? lessons[0].id : 'terminal-intro') + '">从第一课开始 <span aria-hidden="true">→</span></a></div>');
    TRACKS.forEach(function (track, ti) {
      var list = trackLessons[track.key] || [];
      if (!list.length) return;
      var first = list[0];
      out.push('<article class="track reveal">');
      out.push('<div class="track__num">0' + (ti + 1) + '</div>');
      out.push('<div><h3><a href="#/lesson/' + first.id + '">' + esc(track.name) + '</a></h3>');
      out.push('<p>' + esc(track.desc) + '</p>');
      out.push('<div class="track__lessons">');
      list.forEach(function (l) {
        out.push('<a class="track__lesson" href="#/lesson/' + l.id + '"><span class="n">' + pad2(l.order) + '</span>' + esc(l.title) + '</a>');
      });
      out.push('</div></div>');
      out.push('<div class="track__meta"><span class="track__count">' + list.length + ' 课</span>' +
        '<span class="track__go" aria-hidden="true">→</span></div>');
      out.push('</article>');
    });
    out.push('</div></section>');

    out.push('<section class="section"><div class="container">');
    out.push('<div class="section__head reveal"><div><span class="meta">Toolkit</span><h2 class="h2">学的时候顺手用</h2>' +
      '<p>三件随时可以查的东西：命令、快捷键、报错解法。</p></div></div>');
    out.push('<div class="feature-grid" data-stagger>');
    out.push(featureCard('命令速查', '查询 ' + PS.commands.length + ' 条常用命令，按工具分类，点一下就复制。', '#/commands', 'COMMANDS'));
    out.push(featureCard('快捷键挑战', '随机出题，从四个组合里选出正确的那个，把肌肉记忆练出来。', '#/shortcuts', 'SHORTCUTS'));
    out.push(featureCard('报错排查手册', '端口被占用、找不到模块、push 被拒：最常见的报错怎么读懂、怎么解。', '#/lesson/troubleshoot', 'TROUBLESHOOT'));
    out.push('</div></div></section>');

    out.push('<section class="cta"><div class="container" data-stagger>');
    out.push('<span class="meta">Start Here</span>');
    out.push('<h2 class="silver reveal">打开终端，<br>从第一条命令开始。</h2>');
    out.push('<p class="reveal">不用先学完再动手。每节课都有一组可以马上在你自己电脑上跑的命令。</p>');
    out.push('<div class="cta__actions reveal"><a class="lg-pill lg-pill--solid lg-pill--cta" href="#/lesson/' + (lessons[0] ? lessons[0].id : 'terminal-intro') + '">开始学习</a>' +
      '<a class="lg-pill lg-pill--cta" href="#/glossary">先看看术语表</a></div>');
    out.push('</div></section>');
    return out.join('');
  }
  function featureCard(title, desc, href, tag) {
    return '<a class="feature reveal" href="' + href + '">' +
      '<span class="meta">' + esc(tag) + '</span>' +
      '<h3>' + esc(title) + '</h3><p>' + esc(desc) + '</p>' +
      '<span class="feature__go">打开 <span aria-hidden="true">→</span></span></a>';
  }

  /* ------------------------------------------------------------ 课程页 */
  function chip(text, cls) { return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + text + '</span>'; }
  function sectionHead(title, no) {
    if (!title) return '';
    return '<h2 class="sec__title"><span class="n">' + pad2(no) + '</span>' + esc(title) + '</h2>';
  }
  function viewLesson(l) {
    var i = lessonIndex[l.id];
    var track = TRACK_MAP[l.track] || { name: l.track };
    var prev = i > 0 ? lessons[i - 1] : null;
    var next = i < lessons.length - 1 ? lessons[i + 1] : null;
    var out = [];
    out.push('<article class="lesson">');
    out.push('<div class="lesson__crumb"><a href="#/">课程</a><span class="sep">/</span><span>' + esc(track.name) + '</span><span class="sep">/</span><span>第 ' + pad2(l.order) + ' 课</span></div>');
    out.push('<header class="lesson__head reveal">');
    out.push('<div class="lesson__eyebrow">' + chip(track.name, 'chip--solid') + chip('第 ' + pad2(l.order) + ' 课') + '</div>');
    out.push('<h1 class="lesson__title">' + esc(l.title) + '</h1>');
    out.push('<p class="lesson__sub">' + esc(l.subtitle) + '</p>');
    out.push('<div class="lesson__meta">' + chip(l.minutes + ' 分钟') + chip(l.level || '入门') +
      (state.done[l.id] ? chip('已完成', 'chip--ghost') : '') + '</div>');
    if (l.goal && l.goal.length) {
      out.push('<div class="goal"><h4>学完这一课，你会</h4><ul>');
      l.goal.forEach(function (g) { out.push('<li>' + esc(g) + '</li>'); });
      out.push('</ul></div>');
    }
    out.push('</header>');

    var no = 0;
    (l.sections || []).forEach(function (s) {
      out.push(renderSection(s, function () { no += 1; return no; }));
    });

    if (l.exercise) out.push(renderExercise(l));
    if (l.quiz && l.quiz.length) out.push(renderQuiz(l));

    out.push('<div class="finish reveal"><p>' + (state.done[l.id] ? '这一课已经标记完成。' : '学完了？标记一下，进度会存在你自己的浏览器里。') + '</p>' +
      '<button class="lg-pill ' + (state.done[l.id] ? 'lg-pill--ghost' : 'lg-pill--solid') + '" type="button" data-mark-done="' + l.id + '">' +
      (state.done[l.id] ? '取消完成标记' : '标记为已完成') + '</button></div>');

    out.push('<nav class="pager reveal" aria-label="课程翻页">');
    if (prev) out.push('<a href="#/lesson/' + prev.id + '"><span class="dir">上一课</span><span class="title">' + esc(prev.title) + '</span></a>');
    else out.push('<a class="is-empty" aria-hidden="true"></a>');
    if (next) out.push('<a class="next" href="#/lesson/' + next.id + '"><span class="dir">下一课</span><span class="title">' + esc(next.title) + '</span></a>');
    else out.push('<a class="next" href="#/commands"><span class="dir">全部学完</span><span class="title">去命令速查复习</span></a>');
    out.push('</nav>');
    out.push('</article>');
    return out.join('');
  }

  function renderSection(s, nextNo) {
    if (!s || !s.type) return '';
    if (s.type === 'text') {
      var n = s.title ? nextNo() : 0;
      return '<section class="sec reveal">' + sectionHead(s.title, n) + '<div class="prose">' + s.html + '</div></section>';
    }
    if (s.type === 'tip' || s.type === 'warn') {
      var isWarn = s.type === 'warn';
      return '<div class="callout reveal callout--' + (isWarn ? 'warn' : 'tip') + '">' +
        '<div class="callout__head"><span class="callout__icon">' + (isWarn ? '!' : '✓') + '</span>' + esc(s.title || (isWarn ? '注意' : '要点')) + '</div>' +
        '<div class="callout__body">' + s.html + '</div></div>';
    }
    if (s.type === 'steps') {
      var sn = s.title ? nextNo() : 0;
      var steps = (s.items || []).map(function (it, idx) {
        return '<div class="step"><div class="step__n">' + pad2(idx + 1) + '</div><div>' +
          '<h4>' + esc(it.title || '') + '</h4><div class="step__body">' + (it.html || '') + '</div></div></div>';
      }).join('');
      return '<section class="sec reveal">' + sectionHead(s.title, sn) + '<div class="steps">' + steps + '</div></section>';
    }
    if (s.type === 'table') {
      var tn = s.title ? nextNo() : 0;
      var head = (s.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('');
      var rows = (s.rows || []).map(function (row) {
        return '<tr>' + row.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
      }).join('');
      return '<section class="sec reveal">' + sectionHead(s.title, tn) +
        '<div class="tablewrap"><table class="tbl"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
    }
    if (s.type === 'code') return renderCode(s);
    if (s.type === 'terminal') return renderTerminal(s);
    if (s.type === 'shortcuts') {
      var kn = s.title ? nextNo() : 0;
      var rowsS = (s.items || []).map(function (it) {
        return '<div class="sc__row"><span class="sc__action">' + inline(it.action) + '</span>' +
          '<span class="sc__keys">' + keysHtml(it.mac) + '</span>' +
          '<span class="sc__keys sc__keys--win">' + keysHtml(it.win) + '</span></div>';
      }).join('');
      return '<section class="sec reveal">' + sectionHead(s.title, kn) +
        '<div class="sc"><div class="sc__head"><span>操作</span><span>macOS</span><span>Windows</span></div>' + rowsS + '</div></section>';
    }
    if (s.type === 'compare') {
      var cn = s.title ? nextNo() : 0;
      var left = s.left || { label: '错误做法', items: [] };
      var right = s.right || { label: '正确做法', items: [] };
      var lis = function (arr) { return (arr || []).map(function (x) { return '<li>' + inline(x) + '</li>'; }).join(''); };
      return '<section class="sec reveal">' + sectionHead(s.title, cn) +
        '<div class="compare">' +
        '<div class="compare__col compare__col--bad"><div class="compare__label">' + esc(left.label) + '</div><ul>' + lis(left.items) + '</ul></div>' +
        '<div class="compare__col compare__col--good"><div class="compare__label">' + esc(right.label) + '</div><ul>' + lis(right.items) + '</ul></div>' +
        (s.note ? '<div class="compare__note">' + s.note + '</div>' : '') +
        '</div></section>';
    }
    return '';
  }

  function highlightCode(src, lang) {
    var lines = String(src == null ? '' : src).split('\n');
    return lines.map(function (line) {
      var html = esc(line);
      if (lang === 'json') {
        html = html.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="k">$1</span>$2');
        return html;
      }
      if (lang === 'diff') {
        if (/^\+/.test(line)) return '<span class="k">' + html + '</span>';
        if (/^-/.test(line)) return '<span class="c">' + html + '</span>';
        return html;
      }
      var idx = -1;
      var m = line.match(/^\s*#/);
      if (m) idx = m[0].length - 1;
      else {
        var pos = line.indexOf(' # ');
        if (pos >= 0) idx = pos + 1;
      }
      if (idx >= 0) html = esc(line.slice(0, idx)) + '<span class="c">' + esc(line.slice(idx)) + '</span>';
      return html;
    }).join('\n');
  }
  function renderCode(s) {
    var text = s.text || '';
    var note = s.note ? '<figcaption class="term__note">' + s.note + '</figcaption>' : '';
    return '<figure class="code reveal">' +
      '<div class="code__head"><span class="code__title">' + esc(s.title || '代码') + '</span>' +
      '<span class="code__lang">' + esc(s.lang || 'text') + '</span>' + copyButton(text) + '</div>' +
      '<pre>' + highlightCode(text, s.lang) + '</pre>' + note + '</figure>';
  }
  function renderTerminal(s) {
    var cmd = s.command || '';
    var note = s.note ? '<figcaption class="term__note">' + s.note + '</figcaption>' : '';
    return '<figure class="term reveal">' +
      '<div class="term__head"><span class="term__dots"><i></i><i></i><i></i></span>' +
      '<span class="term__label">' + esc(s.title || '终端') + '</span>' + copyButton(cmd) + '</div>' +
      '<div class="term__body"><div class="term__line"><span class="term__prompt">$</span>' +
      '<span class="term__cmd">' + esc(cmd) + '</span></div>' +
      (s.output ? '<pre class="term__out">' + esc(s.output) + '</pre>' : '') + '</div>' + note + '</figure>';
  }

  function renderExercise(l) {
    var ex = l.exercise;
    if (!ex) return '';
    var saved = state.practice[l.id] || [];
    var items = (ex.items || []).map(function (it, idx) {
      return '<label class="exercise__item' + (saved[idx] ? ' is-checked' : '') + '">' +
        '<input class="exercise__check" type="checkbox" data-practice="' + l.id + '" data-idx="' + idx + '"' + (saved[idx] ? ' checked' : '') + '>' +
        '<span>' + inline(it.text) + (it.cmd ? ' <code>' + esc(it.cmd) + '</code>' : '') + '</span></label>';
    }).join('');
    return '<section class="exercise reveal" id="exercise">' +
      '<div class="exercise__top"><h3>' + esc(ex.title || '动手练一练') + '</h3><span class="meta">Practice</span></div>' +
      '<p class="exercise__brief">' + esc(ex.brief || '') + '</p>' +
      '<div class="exercise__list">' + items + '</div>' +
      '<p class="exercise__done">完成标准：<b>' + esc(ex.done || '') + '</b></p></section>';
  }

  function renderQuiz(l) {
    var qs = (l.quiz || []).map(function (item, qi) {
      var opts = (item.options || []).map(function (op, oi) {
        return '<button class="quiz__opt" type="button" data-answer="' + qi + '|' + oi + '">' +
          '<span class="k">' + 'ABCD'.charAt(oi) + '</span><span>' + esc(op) + '</span></button>';
      }).join('');
      return '<div class="quiz__q" data-qbox="' + qi + '"><h4>' + (qi + 1) + '. ' + esc(item.q) + '</h4>' +
        '<div class="quiz__opts">' + opts + '</div><div class="quiz__explain" hidden></div></div>';
    }).join('');
    return '<section class="quiz reveal" id="quiz"><h2 class="sec__title">小测验：确认你真的看懂</h2>' + qs + '</section>';
  }

  function answerQuiz(l, qi, oi) {
    var item = (l.quiz || [])[qi];
    if (!item) return;
    var box = document.querySelector('[data-qbox="' + qi + '"]');
    if (!box || box.getAttribute('data-answered') === '1') return;
    box.setAttribute('data-answered', '1');
    var correct = oi === item.answer;
    qa('.quiz__opt', box).forEach(function (b, k) {
      b.disabled = true;
      if (k === item.answer) b.classList.add('is-correct');
      else if (k === oi) b.classList.add('is-wrong');
    });
    var explain = q('.quiz__explain', box);
    if (explain) {
      explain.hidden = false;
      explain.innerHTML = '<b>' + (correct ? '答对了。' : '正确答案是 ' + 'ABCD'.charAt(item.answer) + '。') + '</b> ' + esc(item.explain || '');
    }
    if (!state.quiz) state.quiz = {};
    if (!state.quiz[l.id]) state.quiz[l.id] = [];
    state.quiz[l.id][qi] = oi;
    if (correct) {
      var allOk = (l.quiz || []).every(function (it, k) { return state.quiz[l.id][k] === it.answer; });
      if (allOk && !state.done[l.id]) {
        markDone(l.id, true);
        toast('全部答对，这一课已标记完成');
        var finish = q('.finish p');
        if (finish) finish.textContent = '这一课已经标记完成。';
      }
    }
    save();
  }

  /* ------------------------------------------------------------ 命令速查 */
  function toolName(t) { return TOOL_NAMES[t] || t; }
  function viewCommands() {
    var groups = {};
    PS.commands.forEach(function (c) {
      var t = c.tool || 'other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(c);
    });
    var tools = Object.keys(groups).sort(function (a, b) {
      var ia = TOOL_ORDER.indexOf(a); var ib = TOOL_ORDER.indexOf(b);
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      return ia - ib;
    });
    var out = [];
    out.push('<div class="page">');
    out.push('<header class="page__head reveal"><span class="meta">Command Reference</span>');
    out.push('<h1 class="page__title">命令速查</h1>');
    out.push('<p class="page__sub">按工具分组，点右侧按钮直接复制。macOS 与 Linux 合并为一档，只在两者写法不同时标注「仅 Linux」或「仅 macOS」；Windows 一档默认使用 PowerShell。</p></header>');
    out.push('<div class="shortcut-tools reveal"><div class="searchfield" style="flex:1;min-width:240px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>' +
      '<input id="cmdSearch" type="text" placeholder="搜索命令或用途，例如 rebase、端口、venv…" autocomplete="off" spellcheck="false"><kbd>/</kbd></div>' +
      '<div class="platform-toggle" id="cmdPlatform">' + cmdPlatformButtons() + '</div></div>');
    out.push('<div class="filters reveal" id="cmdFilters"><button class="filter is-active" type="button" data-tool="all">全部</button>');
    tools.forEach(function (t) {
      out.push('<button class="filter" type="button" data-tool="' + esc(t) + '">' + esc(toolName(t)) + '</button>');
    });
    out.push('<button class="filter" type="button" id="cmdAllPlatforms">显示其他系统</button>');
    out.push('</div>');
    out.push('<p class="note" id="cmdOsNote" style="margin:-12px 0 18px"></p>');
    tools.forEach(function (t) {
      out.push('<section class="cmd-group reveal" data-group-tool="' + esc(t) + '">');
      out.push('<h2 class="cmd-group__title">' + esc(toolName(t)) + '<b data-count>' + groups[t].length + ' 条</b></h2>');
      out.push('<div class="cmd-list">');
      groups[t].forEach(function (c) {
        var cp = cmdPlatform();
        var effective = cp === 'win' ? (c.win || c.cmd) : c.cmd;
        var osAttr = c.os ? ' data-os="' + esc(c.os.join(',')) + '"' : '';
        var search = ((c.cmd || '') + ' ' + (c.win || '') + ' ' + (c.desc || '') + ' ' + ((c.tags || []).join(' '))).toLowerCase();
        var tags = (c.tags || []).slice(0, 2).map(function (tag) { return '<span class="tag">' + esc(tag) + '</span>'; }).join('');
        var badge = osBadge(c);
        if (badge) tags += '<span class="tag tag--warn">' + esc(badge) + '</span>';
        out.push('<div class="cmd-row" data-tool="' + esc(t) + '"' + osAttr + ' data-search="' + esc(search) + '">' +
          '<div class="cmd-row__code">' + esc(effective) + '</div>' +
          '<div class="cmd-row__desc">' + inline(c.desc) + '</div>' +
          '<div class="cmd-row__side">' + tags + copyButton(effective, '复制') + '</div></div>');
      });
      out.push('</div></section>');
    });
    out.push('<div class="empty" id="cmdEmpty" hidden>没有匹配的命令，换个关键词试试。</div>');
    out.push('</div>');
    return out.join('');
  }
  function applyCmdFilter() {
    var query = UI.cmdQuery.trim().toLowerCase();
    var tool = UI.cmdTool;
    var cp = cmdPlatform();
    var visible = 0;
    var otherOs = [];
    qa('.cmd-row[data-tool]').forEach(function (row) {
      var okTool = tool === 'all' || row.getAttribute('data-tool') === tool;
      var okQuery = !query || (row.getAttribute('data-search') || '').indexOf(query) >= 0;
      var os = row.getAttribute('data-os');
      var list = os ? os.split(',') : ['mac', 'linux', 'win'];
      var okOs;
      if (cp === 'win') okOs = list.indexOf('win') >= 0;
      else okOs = list.indexOf('mac') >= 0 || list.indexOf('linux') >= 0;
      if (!okOs && UI.cmdAllPlatforms) okOs = true;
      if (!okOs) { otherOs.push(os); }
      var show = okTool && okQuery && okOs;
      row.hidden = !show;
      if (show) visible += 1;
    });
    qa('.cmd-group[data-group-tool]').forEach(function (group) {
      var rows = qa('.cmd-row', group);
      var shown = rows.filter(function (r) { return !r.hidden; }).length;
      group.hidden = shown === 0;
      var counter = q('b[data-count]', group);
      if (counter) counter.textContent = shown + ' 条';
    });
    var note = document.getElementById('cmdOsNote');
    if (note) {
      var union = {};
      otherOs.forEach(function (o) {
        (o || '').split(',').forEach(function (k) { if (k) union[k] = true; });
      });
      var parts = [];
      if (union.mac && union.linux) parts.push('macOS / Linux');
      else if (union.mac) parts.push('macOS');
      else if (union.linux) parts.push('Linux');
      if (union.win) parts.push('Windows');
      var labels = parts.join('、') || '其他系统';
      if (!otherOs.length) {
        note.textContent = cp === 'win'
          ? ''
          : '标着「仅 Linux」「仅 macOS」的命令在另一系统上写法不同，说明里给了替代命令。';
      } else if (UI.cmdAllPlatforms) {
        note.textContent = '正在显示其他系统的 ' + otherOs.length + ' 条命令；标着「仅 …」的在当前系统上不可用。';
      } else {
        note.textContent = '已隐藏 ' + otherOs.length + ' 条只在 ' + labels + ' 上提供的命令；点「显示其他系统」可以查看。';
      }
    }
    var empty = document.getElementById('cmdEmpty');
    if (empty) {
      empty.hidden = visible !== 0;
      if (visible === 0) {
        empty.textContent = tool === 'all'
          ? '没有匹配的命令，换个关键词试试。'
          : '当前只在「' + toolName(tool) + '」里搜索，点「全部」可以搜所有命令。';
      }
    }
    var allBtn = document.getElementById('cmdAllPlatforms');
    if (allBtn) allBtn.classList.toggle('is-active', UI.cmdAllPlatforms);
  }
  function initCommandsView() {
    var input = document.getElementById('cmdSearch');
    if (input) input.value = UI.cmdQuery;
    qa('#cmdFilters .filter').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tool') === UI.cmdTool);
    });
    applyCmdFilter();
  }

  /* ------------------------------------------------------------ 快捷键 */
  function shortcutGroups() {
    var groups = {};
    PS.shortcuts.forEach(function (s) {
      var app = s.app || '通用';
      if (!groups[app]) groups[app] = [];
      groups[app].push(s);
    });
    return groups;
  }
  function viewShortcuts() {
    var groups = shortcutGroups();
    var apps = Object.keys(groups);
    var out = [];
    out.push('<div class="page">');
    out.push('<header class="page__head reveal"><span class="meta">Keyboard Shortcuts</span>');
    out.push('<h1 class="page__title">快捷键</h1>');
    out.push('<p class="page__sub">先把最常用的十几个练成肌肉记忆，剩下的用的时候再查。下面还有一个小挑战。</p></header>');

    out.push('<section class="trainer reveal" id="trainer"><div class="trainer__top">' +
      '<span class="meta">快捷键挑战</span>' +
      '<span class="trainer__score" id="trScore">得分 0 / 0</span></div><div id="trainerBody"></div></section>');

    out.push('<div class="shortcut-tools reveal">');
    out.push('<div class="searchfield" style="flex:1;min-width:240px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>' +
      '<input id="scSearch" type="text" placeholder="搜索动作，例如 注释、命令面板、终端…" autocomplete="off" spellcheck="false"></div>');
    out.push('<div class="platform-toggle" id="platformToggle">' + platformButtons() + '</div>');
    out.push('</div>');

    out.push('<div class="filters reveal" id="scFilters"><button class="filter is-active" type="button" data-cat="all">全部</button>');
    apps.forEach(function (app) {
      out.push('<button class="filter" type="button" data-cat="' + esc(app) + '">' + esc(app) + '</button>');
    });
    out.push('</div>');

    apps.forEach(function (app) {
      out.push('<section class="cmd-group reveal" data-group-cat="' + esc(app) + '">');
      out.push('<h2 class="cmd-group__title">' + esc(app) + '<b>' + groups[app].length + ' 个</b></h2>');
      out.push('<div class="cmd-list">');
      groups[app].forEach(function (s) {
        var search = ((s.action || '') + ' ' + (s.cat || '') + ' ' + app).toLowerCase();
        out.push('<div class="cmd-row cmd-row--shortcut" data-cat="' + esc(app) + '" data-search="' + esc(search) + '">' +
          '<div class="cmd-row__desc">' + esc(s.action) + '</div>' +
          '<div class="cmd-row__keys">' + keysHtml(keysOf(s, platform())) + '</div></div>');
      });
      out.push('</div></section>');
    });
    out.push('<div class="empty" id="scEmpty" hidden>没有匹配的快捷键。</div>');
    out.push('</div>');
    return out.join('');
  }
  function applyScFilter() {
    var query = UI.scQuery.trim().toLowerCase();
    var cat = UI.scCat;
    var visible = 0;
    qa('.cmd-row[data-cat]').forEach(function (row) {
      var okCat = cat === 'all' || row.getAttribute('data-cat') === cat;
      var okQuery = !query || (row.getAttribute('data-search') || '').indexOf(query) >= 0;
      var show = okCat && okQuery;
      row.hidden = !show;
      if (show) visible += 1;
    });
    qa('.cmd-group[data-group-cat]').forEach(function (group) {
      group.hidden = !qa('.cmd-row', group).some(function (r) { return !r.hidden; });
    });
    var empty = document.getElementById('scEmpty');
    if (empty) {
      empty.hidden = visible !== 0;
      if (visible === 0) {
        empty.textContent = cat === 'all'
          ? '没有匹配的快捷键，换个关键词试试。'
          : '当前只在「' + cat + '」里搜索，点「全部」可以搜所有快捷键。';
      }
    }
  }
  function initShortcutsView() {
    var input = document.getElementById('scSearch');
    if (input) input.value = UI.scQuery;
    qa('#scFilters .filter').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-cat') === UI.scCat);
    });
    applyScFilter();
    startTrainer();
  }

  var trainer = { q: null, opts: [], correctIdx: 0, answered: false, correct: 0, total: 0 };
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function startTrainer() {
    trainer.correct = 0; trainer.total = 0;
    var score = document.getElementById('trScore');
    if (score) score.textContent = '得分 0 / 0';
    newTrainerRound();
  }
  function newTrainerRound() {
    var pool = PS.shortcuts.filter(function (s) {
      return s.mac && s.mac.length && s.win && s.win.length && keysOf(s, platform()).length;
    });
    if (!pool.length) return;
    var p = platform();
    var q0 = pool[Math.floor(Math.random() * pool.length)];
    var seen = {};
    seen[keysOf(q0, p).join('+')] = true;
    var opts = [q0];
    var guard = 0;
    while (opts.length < 4 && guard < 300) {
      guard += 1;
      var cand = pool[Math.floor(Math.random() * pool.length)];
      var k = keysOf(cand, p).join('+');
      if (seen[k]) continue;
      seen[k] = true;
      opts.push(cand);
    }
    shuffle(opts);
    trainer.q = q0;
    trainer.opts = opts;
    trainer.correctIdx = opts.indexOf(q0);
    trainer.answered = false;
    paintTrainer();
  }
  function paintTrainer() {
    var body = document.getElementById('trainerBody');
    if (!body || !trainer.q) return;
    var p = platform();
    var opts = trainer.opts.map(function (o, i) {
      return '<button class="trainer__opt" type="button" data-tr="' + i + '">' + keysHtml(keysOf(o, p)) + '</button>';
    }).join('');
    body.innerHTML = '<p class="trainer__q">' + esc(trainer.q.action) +
      '<span class="dim" style="font-size:12px;font-weight:400"> — ' + esc(trainer.q.app) + '（' + platformLabel() + '）</span></p>' +
      '<p class="trainer__hint">选出上面这个动作的快捷键组合</p>' +
      '<div class="trainer__opts">' + opts + '</div>' +
      '<div class="trainer__foot"><span class="trainer__score" id="trHint">凭直觉选，不用怕错。</span>' +
      '<button class="trainer__next" type="button" id="trNext" hidden>下一题 →</button></div>';
  }
  function answerTrainer(i) {
    if (trainer.answered) return;
    trainer.answered = true;
    trainer.total += 1;
    var correct = i === trainer.correctIdx;
    if (correct) trainer.correct += 1;
    qa('.trainer__opt').forEach(function (b, k) {
      b.disabled = true;
      if (k === trainer.correctIdx) b.classList.add('is-correct');
      else if (k === i) b.classList.add('is-wrong');
    });
    var score = document.getElementById('trScore');
    if (score) score.textContent = '得分 ' + trainer.correct + ' / ' + trainer.total;
    var hint = document.getElementById('trHint');
    if (hint) hint.textContent = correct ? '正确。' : '正确答案是 ' + keysOf(trainer.opts[trainer.correctIdx], platform()).join(' + ');
    var next = document.getElementById('trNext');
    if (next) next.hidden = false;
  }

  /* ------------------------------------------------------------ 术语表 */
  function viewGlossary() {
    var out = [];
    out.push('<div class="page">');
    out.push('<header class="page__head reveal"><span class="meta">Glossary</span><h1 class="page__title">术语表</h1>' +
      '<p class="page__sub">看课时遇到不认识的词，回这里查。都是大白话，不抄定义。</p></header>');
    out.push('<div class="gloss reveal">');
    PS.glossary.forEach(function (g) {
      out.push('<div class="gloss__item"><div class="gloss__term">' + esc(g.term) +
        (g.en ? '<em>' + esc(g.en) + '</em>' : '') + '</div>' +
        '<div class="gloss__desc">' + esc(g.desc) + '</div></div>');
    });
    out.push('</div></div>');
    return out.join('');
  }

  function viewNotFound() {
    return '<div class="page"><header class="page__head"><span class="meta">404</span>' +
      '<h1 class="page__title">这里没有内容</h1>' +
      '<p class="page__sub">链接可能写错了，或者这一课还没写出来。</p></header>' +
      '<a class="lg-pill lg-pill--solid" href="#/">回到课程首页</a></div>';
  }

  /* ------------------------------------------------------------ 命令面板 */
  var paletteState = { items: [], filtered: [], active: 0, open: false };
  function buildPaletteItems() {
    var items = [];
    items.push({ type: '页面', label: '课程首页', href: '#/', search: 'home 首页 课程' });
    items.push({ type: '页面', label: '命令速查', href: '#/commands', search: '命令 速查 command' });
    items.push({ type: '页面', label: '快捷键', href: '#/shortcuts', search: '快捷键 shortcut' });
    items.push({ type: '页面', label: '术语表', href: '#/glossary', search: '术语 词汇 glossary' });
    lessons.forEach(function (l) {
      var track = TRACK_MAP[l.track] || {};
      items.push({ type: '课程', label: l.title, sub: track.name || '', href: '#/lesson/' + l.id,
        search: (l.title + ' ' + l.subtitle + ' ' + (track.name || '')).toLowerCase() });
    });
    PS.commands.forEach(function (c) {
      items.push({ type: '命令', label: c.cmd, sub: c.tool, href: '#/commands',
        search: (c.cmd + ' ' + c.desc).toLowerCase() });
    });
    return items;
  }
  function paletteRender() {
    var box = document.getElementById('paletteResults');
    var input = document.getElementById('paletteInput');
    if (!box || !input) return;
    var query = input.value.trim().toLowerCase();
    var items = paletteState.items.filter(function (it) {
      return !query || it.search.indexOf(query) >= 0 || it.label.toLowerCase().indexOf(query) >= 0;
    }).slice(0, 30);
    paletteState.filtered = items;
    if (paletteState.active >= items.length) paletteState.active = 0;
    if (!items.length) { box.innerHTML = '<div class="empty">没有结果</div>'; return; }
    var html = [];
    var lastType = '';
    items.forEach(function (it, i) {
      if (it.type !== lastType) {
        html.push('<div class="palette__group">' + esc(it.type) + '</div>');
        lastType = it.type;
      }
      html.push('<div class="palette__item' + (i === paletteState.active ? ' is-active' : '') + '" data-palette-idx="' + i + '">' +
        '<span class="type">' + esc(it.type) + '</span>' +
        '<span class="label">' + esc(it.label) + '</span>' +
        (it.sub ? '<span class="sub">' + esc(it.sub) + '</span>' : '') + '</div>');
    });
    box.innerHTML = html.join('');
    var active = box.querySelector('.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() {
    var el = document.getElementById('palette');
    if (!el) return;
    paletteState.items = buildPaletteItems();
    paletteState.active = 0;
    paletteState.open = true;
    el.hidden = false;
    var input = document.getElementById('paletteInput');
    if (input) { input.value = ''; input.focus(); }
    paletteRender();
  }
  function closePalette() {
    var el = document.getElementById('palette');
    if (el) el.hidden = true;
    paletteState.open = false;
  }
  function paletteGo(idx) {
    var item = paletteState.filtered[idx];
    if (!item) return;
    closePalette();
    location.hash = item.href;
  }

  /* ------------------------------------------------------------ 玻璃顶栏 */
  function mountProgressiveBlur(el) {
    if (!el) return;
    var H = el.clientHeight || 64;
    var N = 9, maxBlur = 10, minBlur = 0, overlap = 8, gamma = 1.85;
    var step = H / N;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var top = Math.max(0, Math.round(i * step - overlap / 2));
      var height = Math.min(H, Math.round((i + 1) * step + overlap)) - top;
      var blur = minBlur + (maxBlur - minBlur) * Math.pow(1 - i / (N - 1), gamma);
      var mask;
      if (i === 0) mask = 'linear-gradient(to bottom, black 0%, black 76%, transparent 100%)';
      else if (i === N - 1) mask = 'linear-gradient(to bottom, transparent 0%, black 26%, black 100%)';
      else mask = 'linear-gradient(to bottom, transparent 0%, black 26%, black 76%, transparent 100%)';
      var layer = document.createElement('div');
      layer.className = 'progressive__layer';
      layer.style.top = top + 'px';
      layer.style.height = Math.max(height, 1) + 'px';
      layer.style.setProperty('--blur', blur.toFixed(2) + 'px');
      layer.style.setProperty('--mask', mask);
      layer.style.webkitMaskImage = mask;
      layer.style.maskImage = mask;
      frag.appendChild(layer);
    }
    el.innerHTML = '';
    el.appendChild(frag);
  }

  /* ------------------------------------------------------------ 事件 */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var copyEl = t.closest('[data-copy]');
    if (copyEl) {
      copyText(copyRegistry[copyEl.getAttribute('data-copy')] || '');
      copyEl.classList.add('is-done');
      var old = copyEl.innerHTML;
      copyEl.textContent = '已复制';
      setTimeout(function () { copyEl.innerHTML = old; copyEl.classList.remove('is-done'); }, 1400);
      return;
    }

    var doneEl = t.closest('[data-mark-done]');
    if (doneEl) {
      var lid = doneEl.getAttribute('data-mark-done');
      var nowDone = !state.done[lid];
      markDone(lid, nowDone);
      render(true);
      toast(nowDone ? '已标记完成' : '已取消完成标记');
      return;
    }

    var ansEl = t.closest('[data-answer]');
    if (ansEl) {
      var lesson = currentLesson();
      if (!lesson) return;
      var parts = ansEl.getAttribute('data-answer').split('|');
      answerQuiz(lesson, parseInt(parts[0], 10), parseInt(parts[1], 10));
      return;
    }

    var trEl = t.closest('[data-tr]');
    if (trEl) { answerTrainer(parseInt(trEl.getAttribute('data-tr'), 10)); return; }
    if (t.closest('#trNext')) { newTrainerRound(); return; }

    var platEl = t.closest('[data-platform]');
    if (platEl) {
      state.platform = platEl.getAttribute('data-platform');
      save();
      render(true);
      return;
    }

    var cmdOsBtn = t.closest('[data-cmd-os]');
    if (cmdOsBtn) {
      state.cmdOs = cmdOsBtn.getAttribute('data-cmd-os');
      save();
      render(true);
      return;
    }
    if (t.closest('#cmdAllPlatforms')) {
      UI.cmdAllPlatforms = !UI.cmdAllPlatforms;
      applyCmdFilter();
      return;
    }
    var cmdFilter = t.closest('#cmdFilters .filter');
    if (cmdFilter) {
      UI.cmdTool = cmdFilter.getAttribute('data-tool');
      qa('#cmdFilters .filter').forEach(function (b) { b.classList.toggle('is-active', b === cmdFilter); });
      applyCmdFilter();
      return;
    }

    var catFilter = t.closest('#scFilters .filter');
    if (catFilter) {
      UI.scCat = catFilter.getAttribute('data-cat');
      qa('#scFilters .filter').forEach(function (b) { b.classList.toggle('is-active', b === catFilter); });
      applyScFilter();
      return;
    }

    var palItem = t.closest('[data-palette-idx]');
    if (palItem) { paletteGo(parseInt(palItem.getAttribute('data-palette-idx'), 10)); return; }
    if (t.closest('[data-palette-close]')) { closePalette(); return; }
    if (t.closest('#paletteBtn')) { openPalette(); return; }

    if (t.closest('#menuBtn')) {
      var open = document.body.classList.toggle('nav-open');
      t.closest('#menuBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
      var scrim = document.getElementById('scrim');
      if (scrim) scrim.hidden = !open;
      return;
    }
    if (t.closest('#scrim')) {
      document.body.classList.remove('nav-open');
      var s2 = document.getElementById('scrim');
      if (s2) s2.hidden = true;
      return;
    }
    if (t.closest('#sidebar a')) {
      document.body.classList.remove('nav-open');
      var s3 = document.getElementById('scrim');
      if (s3) s3.hidden = true;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.hasAttribute && t.hasAttribute('data-practice')) {
      var lid = t.getAttribute('data-practice');
      var idx = parseInt(t.getAttribute('data-idx'), 10);
      if (!state.practice[lid]) state.practice[lid] = [];
      state.practice[lid][idx] = t.checked;
      save();
      var item = t.closest('.exercise__item');
      if (item) item.classList.toggle('is-checked', t.checked);
      var all = state.practice[lid] || [];
      var total = qa('[data-practice="' + lid + '"]').length;
      var checked = all.filter(Boolean).length;
      if (checked === total && total > 0) toast('练习全部完成');
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === 'cmdSearch') { UI.cmdQuery = t.value; applyCmdFilter(); return; }
    if (t.id === 'scSearch') { UI.scQuery = t.value; applyScFilter(); return; }
    if (t.id === 'paletteInput') { paletteState.active = 0; paletteRender(); }
  });

  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (paletteState.open) closePalette(); else openPalette();
      return;
    }
    if (!paletteState.open) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        var scrim = document.getElementById('scrim');
        if (scrim) scrim.hidden = true;
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      paletteState.active = Math.min(paletteState.active + 1, paletteState.filtered.length - 1);
      paletteRender();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      paletteState.active = Math.max(paletteState.active - 1, 0);
      paletteRender();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      paletteGo(paletteState.active);
    }
  });

  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () { updateReadbar(); scrollTick = false; });
  }, { passive: true });
  window.addEventListener('resize', function () { updateReadbar(); });
  window.addEventListener('hashchange', function () {
    document.body.classList.remove('nav-open');
    var scrim = document.getElementById('scrim');
    if (scrim) scrim.hidden = true;
    render();
  });

  /* ------------------------------------------------------------ 启动 */
  mountProgressiveBlur(document.getElementById('topbarBlur'));
  render();
})();
