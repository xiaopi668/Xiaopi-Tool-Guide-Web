/* 工具学校 · 轨道 dev（开发环境与工具链）· 第 21-25 课 */
window.PS = window.PS || {};
window.PS.lessons = window.PS.lessons || [];
window.PS.lessons.push(
  {
    id: 'node-npm',
    order: 21,
    track: 'dev',
    title: 'Node.js 与 npm/pnpm',
    subtitle: '把依赖装进项目文件夹，而不是装进整台电脑',
    minutes: 15,
    level: '基础',
    goal: [
      '看懂 node -v 和 npm -v 各自在报什么',
      '用 nvm 在多个 Node 版本之间来回切',
      '分清 npm install 和 npm i -D',
      '知道哪些文件该提交、哪些绝对不能'
    ],
    sections: [
      {
        type: 'text',
        title: '先把这三个东西分开',
        html: '<p>一句话：<strong>Node.js 是让 JavaScript 跑在浏览器外面的运行时（runtime）</strong>；npm 是随 Node 一起装上的包管理器（package manager），版本号也是一起来的；pnpm 是另一个包管理器，读同一份 package.json，但装依赖的方式不一样。</p><p>你敲的 <code>node -v</code> 看运行时版本，<code>npm -v</code> 看包管理器版本。两个数字对不上是正常的，它们本来就不是同一个东西。</p><p>版本号是三段式：<code>20.11.1</code> 里的 20 是大版本，11 是小版本，1 是修订号。大版本之间会不兼容，小版本只加功能，修订号只修 bug。</p>'
      },
      {
        type: 'terminal',
        title: '先确认装没装',
        command: 'node -v && npm -v',
        output: 'v20.11.1\n10.2.4',
        note: '在任意目录执行，只读不写。如果第一行就报 zsh: command not found: node，说明 Node 没装，或者装了但没进 PATH。'
      },
      {
        type: 'code',
        title: 'nvm：装版本、切版本',
        lang: 'bash',
        text: 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\n\n# 重开终端后\nnvm install --lts        # 装当前 LTS，例如 20.x\nnvm install 18           # 装指定大版本的最新小版本\nnvm use 18               # 只对当前终端生效，关掉就回默认\nnvm alias default 20     # 把默认版本设成 20\nnvm ls                   # 看装了哪些、当前在用哪个',
        note: '为什么需要它：老项目锁在 Node 16，新项目要 20，直接装新版覆盖旧的，老项目当场报 SyntaxError: Unexpected token ? ——问号语法在 16 上还不存在。nvm 把每个版本装进独立目录，用一个软链接决定当前用哪个，切版本不重新下载。安装脚本只写 ~/.nvm 和几行 shell 配置，不动系统目录。项目根目录放一个 .nvmrc 写一行 20，进目录后敲 nvm use 会读它。Windows 用 nvm-windows，命令要写完整版本号：nvm install 20.11.1、nvm use 20.11.1。'
      },
      {
        type: 'code',
        title: 'package.json：项目的身份证',
        lang: 'json',
        text: '{\n  "name": "my-app",\n  "version": "0.1.0",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "lint": "eslint ."\n  },\n  "dependencies": {\n    "react": "^18.2.0"\n  },\n  "devDependencies": {\n    "vite": "^5.2.0",\n    "eslint": "^8.57.0"\n  },\n  "engines": {\n    "node": ">=20"\n  }\n}',
        note: '这个文件要提交到 Git。^18.2.0 表示 18.2.0 及以上但不跨到 19，真正锁死的精确版本在 package-lock.json 里。JSON 不允许尾逗号，多一个就报 npm ERR! code EJSONPARSE。'
      },
      {
        type: 'table',
        title: '四个字段，各管一件事',
        head: ['字段', '写什么', '生产环境还需要吗'],
        rows: [
          ['dependencies', '代码跑起来必须引入的包，如 react、express', '需要，会一起打包上线'],
          ['devDependencies', '只在开发、构建、测试时用，如 vite、eslint、typescript', '不需要'],
          ['scripts', '命令别名，用 npm run 名字 执行', '需要，部署命令常写在这'],
          ['engines', '声明 Node 版本范围，如 >=20', '需要，版本不对会警告']
        ]
      },
      {
        type: 'text',
        title: 'npm install 和 npm i -D 的区别',
        html: '<p><code>npm install</code> 不带包名时，把 dependencies 和 devDependencies 都装上；带包名时<strong>默认写进 dependencies</strong>。</p><p><code>npm i -D 包名</code> 是 <code>npm install --save-dev 包名</code> 的缩写，写进 devDependencies。判断标准只有一句：<span class="hl">这东西打包上线之后还要不要运行？要，就 dependencies；只在你自己电脑上干活，就 devDependencies。</span></p><p>装错了不用删文件重来：再执行一次 <code>npm i -D 包名</code>，npm 会把它从 dependencies 搬到 devDependencies，lock 文件一起更新。</p>'
      },
      {
        type: 'warn',
        title: 'node_modules 绝对不要提交',
        html: '<p>它动辄几万个文件、几百 MB，里面还有针对你操作系统编译的二进制文件。提交上去，队友在 Windows 上拉下来就是一堆崩溃，Git 本身也会慢到几乎不可用。</p><p>项目根目录建 <code>.gitignore</code>，写三行：<code>node_modules/</code>、<code>dist/</code>、<code>.env</code>。已经误提交过的，先 <code>git rm -r --cached node_modules</code>（只从 Git 索引里移除，磁盘上的文件不动），再提交一次。</p><p><strong>该提交的是 package.json 和 package-lock.json</strong>：前者说我要什么，后者说我最后装到了什么。</p>'
      },
      {
        type: 'text',
        title: 'package-lock.json 到底锁了什么',
        html: '<p>package.json 写的是范围（<code>^5.2.0</code>），意味着今天装到 5.2.1，下个月可能装到 5.3.0。lock 文件记录<strong>每个包的确切版本、下载地址和校验值</strong>，连依赖的依赖也记。</p><p>它让「我这能跑」变成「谁都能跑出同一套依赖」。CI 里用 <code>npm ci</code>：只认 lock 文件，装之前先删掉 node_modules，版本对不上直接报 <code>npm ERR! can only install packages when your package.json and package-lock.json are in sync</code>，比 npm install 严格，也更快。</p><p>lock 文件冲突时不要手改。回到主干执行 <code>npm install</code> 重新生成，再把你的改动合并进去。</p>'
      },
      {
        type: 'code',
        title: 'npm run：把长命令收进 scripts',
        lang: 'bash',
        text: 'npm run dev        # 执行 scripts.dev，也就是 vite\nnpm run build      # 执行 scripts.build\nnpm run            # 不带名字，列出所有可用脚本\nnpm run dev -- --port 5174   # -- 后面的参数原样传给脚本',
        note: '报 Missing script: dev 就是 scripts 里没有这个名字，先 npm run 看一眼真实名字。只有 start 和 test 可以省略 run：npm start、npm test。'
      },
      {
        type: 'terminal',
        title: 'npx：用完就走的临时执行',
        command: 'npx serve .',
        output: 'Need to install the following packages:\n  serve@14.2.1\nOk to proceed? (y)',
        note: 'npx 把包下到缓存里执行，不写进 package.json，也不装进 node_modules。适合跑一次性的工具：npx create-vite@latest my-app、npx prettier --write .。带 @版本号可以避免每次都拉最新版。'
      },
      {
        type: 'text',
        title: 'pnpm 为什么快',
        html: '<p>npm 给每个项目都往自己的 node_modules 里复制一份完整的包。十个项目用同一个 React，磁盘上就有十份。</p><p>pnpm 把所有包按内容存在一个全局仓库（store）里，项目的 node_modules 中放的是<strong>硬链接（hard link）</strong>——同一个文件在磁盘上只有一份，多个路径指向它。所以装第二个项目几乎不下载，磁盘占用小得多，切分支重装也就几秒。</p><p>用法和 npm 基本一样：<code>pnpm install</code>、<code>pnpm add lodash</code>、<code>pnpm add -D vite</code>、<code>pnpm run dev</code>。注意<strong>一个项目只用一种</strong>，npm 和 pnpm 混用会生成两套 lock 文件，node_modules 结构也会互相打架。</p>'
      },
      {
        type: 'terminal',
        title: '国内镜像源：装不动时先换源',
        command: 'npm config set registry https://registry.npmmirror.com',
        note: '这条写进用户级 ~/.npmrc，对所有项目生效。查当前源用 npm config get registry，恢复官方源就设回 https://registry.npmjs.org。pnpm 用 pnpm config set registry https://registry.npmmirror.com。只想对单个项目生效，就在项目根目录建 .npmrc 写一行 registry=https://registry.npmmirror.com。'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '在空文件夹里从零建一个 npm 项目，装一个开发依赖和一个运行时依赖，再用脚本把它跑起来。',
      items: [
        { text: '新建文件夹并生成 package.json', cmd: 'mkdir demo-node && cd demo-node && npm init -y' },
        { text: '装一个构建工具，打开 package.json 确认它落在 devDependencies', cmd: 'npm i -D vite' },
        { text: '装一个运行时依赖，同样确认它落在 dependencies', cmd: 'npm i dayjs' },
        { text: '加一条脚本并执行，确认能打印 Node 版本', cmd: 'npm pkg set scripts.hello="node -v" && npm run hello' }
      ],
      done: 'package.json 里两个依赖各在其位，npm run hello 能打印出 v20 这样的版本号，说明脚本生效了。'
    },
    quiz: [
      {
        q: '你在项目里执行 npm i -D typescript，它会被写进哪里？',
        options: ['dependencies', 'devDependencies', '只写 package-lock.json，不写 package.json', '全局 node_modules'],
        answer: 1,
        explain: '参数 -D 是 --save-dev 的缩写，装完写进 devDependencies 而不是 dependencies。它的含义是这个包只在开发和构建时用，别人执行 npm ci --omit=dev 部署生产环境时不会装它。'
      },
      {
        q: 'package-lock.json 应该提交到 Git 吗？',
        options: ['不该，它体积太大', '该，它锁定每个依赖的精确版本，保证所有人装出同一套', '只在用 pnpm 时才提交', '该，但冲突时可以手动改完再提交'],
        answer: 1,
        explain: '它记录了每个包的确切版本和校验值，提交后别人和 CI 才能装出完全相同的依赖。冲突时重新执行 npm install 生成，不要手改。'
      },
      {
        q: '终端报 zsh: command not found: node，最可能的原因是什么？',
        options: ['项目里没装依赖', 'Node 没装，或者装了但没进 PATH', 'package.json 写错了', '镜像源挂了'],
        answer: 1,
        explain: '这个报错来自 shell，意思是它在 PATH 里找不到 node 这个可执行文件，跟项目内容无关。用 nvm 装完记得重开终端或 source 一下配置文件。'
      }
    ]
  },

  {
    id: 'python-venv',
    order: 22,
    track: 'dev',
    title: 'Python 与虚拟环境',
    subtitle: '每个项目一套独立的包，不再把系统 Python 装乱',
    minutes: 14,
    level: '基础',
    goal: [
      '看懂 python3 -V 输出的版本和路径',
      '用 venv 建出项目专用的环境',
      '分清 python 与 python3 的差别',
      '知道 .venv 与清单独该提交'
    ],
    sections: [
      {
        type: 'text',
        title: '先确认你手上是哪个 Python',
        html: '<p>macOS 和大多数 Linux 自带 Python，版本往往偏旧；Windows 默认没有，要去 python.org 装，安装时<strong>一定要勾上 Add python.exe to PATH</strong>，否则后面每条命令都会提示找不到。</p><p>两个命令名要分开看：<code>python3</code> 在 macOS 和 Linux 上一直存在；<code>python</code> 在很多系统上要么不存在，要么指向早就停更的 Python 2。搞不清就用带 3 的那个。</p>'
      },
      {
        type: 'terminal',
        title: '三条命令看清现状',
        command: 'python3 -V && which python3 && python -V',
        output: 'Python 3.11.6\n/usr/bin/python3\nzsh: command not found: python',
        note: '都在任意目录执行，只读版本和路径，不改任何文件。最后一行报错不代表环境坏了，它就是在告诉你这个名字没有对应的程序。'
      },
      {
        type: 'text',
        title: '为什么必须用 venv',
        html: '<p>直接 <code>pip install requests</code> 会把包装进系统 Python 的 site-packages。问题是<strong>你的项目和操作系统共用同一套包</strong>：A 项目要 requests 2.28，B 项目要 2.31，你只能留一个，另一个项目当场报 <code>ImportError: cannot import name</code>。</p><p>更麻烦的是系统自带的工具（macOS 的 /usr/bin 工具、Linux 发行版里 apt 装的脚本）依赖特定版本。你升级了它，某个命令行工具就坏掉，而且很难查出是谁干的。</p><p>虚拟环境（virtual environment）给每个项目开一个独立目录，里面有自己的一份解释器和 site-packages。装什么都只影响这个目录，删掉就等于什么都没发生。</p>'
      },
      {
        type: 'terminal',
        title: '新版系统会直接拦住你',
        command: 'pip3 install requests',
        output: 'error: externally-managed-environment\n\nThis environment is externally managed\n-> To install Python packages system-wide, try apt install\n   python3-xyz, where xyz is the package you are trying to\n   install.\n\nnote: If you believe this is a mistake, please contact your\nPython installation or OS distribution provider.',
        note: '这是 PEP 668 的保护，不是 bug。它在提醒你别往系统 Python 里装东西。正确反应是建虚拟环境，而不是加 --break-system-packages 硬闯过去。'
      },
      {
        type: 'steps',
        title: '建环境、激活、确认、退出',
        items: [
          { title: '建环境', html: '<p>在项目根目录执行 <code>python3 -m venv .venv</code>，会生成一个 .venv 目录，里面有独立的解释器和 pip，几十 MB。<strong>名字前面的点表示隐藏目录</strong>，用 ls -a 才看得到。这条命令只写当前目录。</p>' },
          { title: '激活', html: '<p>macOS / Linux：<code>source .venv/bin/activate</code>。Windows PowerShell：<code>.\\.venv\\Scripts\\Activate.ps1</code>；cmd：<code>.venv\\Scripts\\activate.bat</code>。激活只影响当前这个终端窗口。</p>' },
          { title: '确认装到哪', html: '<p>激活后提示符前面多出 <code>(.venv)</code>，此时 <code>pip -V</code> 第一行会显示路径在 .venv 里面。<span class="hl">这一步不要跳过</span>：后面每条 pip install 都靠它判断有没有装对地方。</p>' },
          { title: '退出', html: '<p>敲 <code>deactivate</code>。它是激活脚本临时注册的命令，不在任何目录里，所以只在激活状态下有效，退出后再敲会报 command not found。</p>' }
        ]
      },
      {
        type: 'code',
        title: '从零开始的完整流程',
        lang: 'bash',
        text: 'cd ~/projects/my-app\npython3 -m venv .venv              # 建环境，只写当前目录\nsource .venv/bin/activate          # macOS / Linux 激活\n# .\\.venv\\Scripts\\Activate.ps1     # Windows PowerShell 用这行\npip install -r requirements.txt    # 有清单就按清单装\npip install requests               # 没有清单就直接装一个新包\npip freeze > requirements.txt      # 把当前精确版本写进清单\ndeactivate                         # 退出环境',
        note: '顺序不能反：先激活，再 pip install。忘了激活就来装，包会进系统 Python，而当时不会有任何提示。'
      },
      {
        type: 'terminal',
        title: '激活前后，两个路径的差别',
        command: 'source .venv/bin/activate && which python && pip -V',
        output: '/Users/you/projects/my-app/.venv/bin/python\npip 24.0 from /Users/you/projects/my-app/.venv/lib/python3.11/site-packages/pip (python 3.11)',
        note: '两行输出都带 .venv 路径，说明你确实在虚拟环境里。如果 which python 指向 /usr/bin/python3，激活没生效，先查是不是在另一个终端窗口里操作。'
      },
      {
        type: 'table',
        title: '四个常见坑，按现象对照查',
        head: ['现象', '原因', '怎么修'],
        rows: [
          ['激活了，pip 还是装到全局', 'IDE 内置终端没执行激活脚本，或在另一个窗口装的', 'which pip 看路径里有没有 .venv'],
          ['PowerShell 提示无法加载脚本', '执行策略禁止运行 .ps1', 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'],
          ['python 和 python3 不是同一个', '旧系统里 python 指向 Python 2', '统一用 python3，Windows 用 py -3'],
          ['程序报 Permission denied', '之前装过一次全局包，写进了系统目录', '建虚拟环境重装，不要用 sudo pip']
        ]
      },
      {
        type: 'table',
        title: '哪些东西要提交',
        head: ['文件或目录', '要提交 Git 吗', '原因'],
        rows: [
          ['requirements.txt', '要', '只有包名和版本，几行文本，别人靠它还原环境'],
          ['.venv/', '不要', '几十 MB 的平台相关二进制，换台机器就不能用'],
          ['pyproject.toml', '要', '现代项目的依赖与构建配置，用来代替 requirements'],
          ['__pycache__/', '不要', '编译缓存，运行时会自动重新生成']
        ]
      },
      {
        type: 'tip',
        title: 'pip freeze 把版本写死',
        html: '<p><code>pip freeze</code> 输出的是<strong>当前环境里所有包</strong>的精确版本，包括依赖的依赖，所以清单会很长。好处是可复现：别人执行 <code>pip install -r requirements.txt</code> 装出来的和你一模一样。</p><p>只想记直接依赖，就手写一份不带版本号的清单（一行 <code>requests</code>），代价是每个人装到的版本不同。团队协作选前者，一个人写脚本两者都行。</p>'
      },
      {
        type: 'text',
        title: '让编辑器用同一个环境',
        html: '<p>激活只改终端，编辑器要单独选。VS Code 里按 <code>⇧⌘P</code>（Windows 是 <code>Ctrl+Shift+P</code>），输入 <code>Python: Select Interpreter</code>，选中路径带 <code>.venv</code> 的那一条，状态栏会显示 <code>3.11.6 (.venv)</code>。</p><p>选错的表现很典型：终端里 <code>import requests</code> 正常，编辑器里满屏黄色波浪线提示找不到模块。<strong>那不是代码的问题，是解释器选错了。</strong></p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '在一个空目录里建虚拟环境，装一个包，导出清单，再退出环境确认这个包没有进系统 Python。',
      items: [
        { text: '建目录并创建虚拟环境', cmd: 'mkdir demo-venv && cd demo-venv && python3 -m venv .venv' },
        { text: '激活并确认 pip 指向 .venv', cmd: 'source .venv/bin/activate && which pip' },
        { text: '装一个包并把精确版本导出成清单', cmd: 'pip install requests && pip freeze > requirements.txt' },
        { text: '退出环境，确认系统 Python 里没有这个包', cmd: 'deactivate && python3 -c "import requests"' }
      ],
      done: '清单里有 requests，退出环境后同一条命令报 ModuleNotFoundError，隔离就生效了。'
    },
    quiz: [
      {
        q: '为什么不该直接 pip install 到系统 Python？',
        options: ['会让 pip 变慢', '不同项目要的版本会互相覆盖，还可能弄坏系统工具', 'pip 不支持这种方式', '系统 Python 装不了第三方包'],
        answer: 1,
        explain: '系统 Python 只有一套 site-packages，两个项目要不同版本时必然打架；操作系统工具也依赖它，升级会连带弄坏。虚拟环境把这份风险关进项目目录。'
      },
      {
        q: 'Windows PowerShell 里激活 .venv 应该执行哪条？',
        options: ['source .venv/bin/activate', '.\\.venv\\Scripts\\Activate.ps1', 'python -m activate', 'pip install venv'],
        answer: 1,
        explain: 'Windows 的虚拟环境把激活脚本放进 Scripts 目录，PowerShell 执行 Activate.ps1，cmd 执行 activate.bat；在 PowerShell 里敲 source 只会提示找不到这个命令。source 加 bin 目录是 macOS 和 Linux 的写法。'
      },
      {
        q: 'pip freeze > requirements.txt 记录的是什么？',
        options: ['只有你手动装的那几个包', '当前环境里所有包及其精确版本', 'Python 解释器版本', '每个包的下载地址'],
        answer: 1,
        explain: 'freeze 会把环境里所有已安装的包连同版本号列出来，连依赖的依赖也包含在内。这样别人按清单安装，能得到和你完全一致的组合。'
      }
    ]
  },

  {
    id: 'devtools',
    order: 23,
    track: 'dev',
    title: '浏览器开发者工具',
    subtitle: '看清页面在发什么请求、报什么错，不用靠猜',
    minutes: 15,
    level: '基础',
    goal: [
      '会用两个平台各自的键打开面板',
      '在 Elements 里改样式并看懂盒模型',
      '用 Console 顺着报错找到自己那一行',
      '用 Network 查一次接口的完整往返'
    ],
    sections: [
      {
        type: 'text',
        title: '它是什么，怎么打开',
        html: '<p>开发者工具（DevTools）是浏览器内置的一套面板：看页面结构、样式、网络请求、控制台报错、本地存储。它<strong>不会改动线上页面</strong>，所有修改只存在于你自己的浏览器里，刷新就还原。</p><p>macOS 用 <code>⌥⌘I</code>，Windows 用 <code>F12</code> 或 <code>Ctrl+Shift+I</code>。面板默认停在右侧或下方，拖它的标题栏可以换位置，点右上角三个点是更多面板的入口。</p>'
      },
      {
        type: 'shortcuts',
        title: '六个每天都会用到的键',
        items: [
          { action: '打开或收起开发者工具', mac: ['⌥', '⌘', 'I'], win: ['F12'], note: '焦点在页面上时有效' },
          { action: '选中页面上的元素', mac: ['⌥', '⌘', 'C'], win: ['Ctrl', 'Shift', 'C'], note: '点一下元素，Elements 直接跳过去' },
          { action: '直接跳到 Console', mac: ['⌥', '⌘', 'J'], win: ['Ctrl', 'Shift', 'J'] },
          { action: '打开命令菜单', mac: ['⇧', '⌘', 'P'], win: ['Ctrl', 'Shift', 'P'], note: '搜面板名、开关功能比翻菜单快' },
          { action: '强制刷新，跳过缓存', mac: ['⇧', '⌘', 'R'], win: ['Ctrl', 'Shift', 'R'], note: '改完样式没生效先试它' },
          { action: '在所有文件里搜字符串', mac: ['⌥', '⌘', 'F'], win: ['Ctrl', 'Shift', 'F'] }
        ]
      },
      {
        type: 'text',
        title: 'Elements：看结构，也看盒模型',
        html: '<p>左上角那个箭头图标（或 <code>⌥⌘C</code>）点亮后，鼠标悬停到页面上，对应节点会高亮。点一下，右侧 Styles 面板列出这个元素命中的全部 CSS 规则，<strong>被划掉的行表示被更具体的选择器覆盖了</strong>——样式不生效时先看这里有没有划掉。</p><p>双击属性值可以当场改，比如把 color 改成红色，页面立刻变。往下滚到底部是盒模型（box model）图：由内到外是 content、padding、border、margin，鼠标移到某一层，页面上对应区域会亮。<span class="hl">元素为什么比你想的宽？九成是 padding 或 margin，不是 width。</span></p>'
      },
      {
        type: 'text',
        title: 'Console：报错的第一现场',
        html: '<p>红字就是错误，点开左侧三角能看到调用栈（stack trace）。看<strong>最上面一排属于你项目的那个文件</strong>，例如 <code>app.js:42</code>，点它直接跳到 Sources 对应行。</p><p>输入框可以执行任意 JavaScript，作用在当前页面，刷新就没了。<code>$0</code> 指向你刚才在 Elements 选中的元素，所以 <code>$0.style.background = "red"</code> 能直接改它的底色；<code>copy($0.outerHTML)</code> 把它的 HTML 复制进剪贴板。</p>'
      },
      {
        type: 'code',
        title: 'Console 里最常用的五行',
        lang: 'bash',
        text: 'console.log("用户数据", user)      // 普通输出，可以跟多个参数\nconsole.warn("旧接口即将下线")       // 黄色警告\nconsole.error("请求失败", err)       // 红色，带调用栈\nconsole.table(list)                 // 数组或对象打成表格，比 log 好读\nconsole.time("render"); /* 代码 */; console.timeEnd("render")   // 测一段代码耗时',
        note: '上线前把调试用的输出清掉，尤其是打印 token、手机号、完整接口返回的那几条。这些内容在用户浏览器里是明文可见的。'
      },
      {
        type: 'text',
        title: 'Network：一次请求的完整证据',
        html: '<p>打开 Network 面板再刷新页面，每条请求都会列出来。信息太多就先点 <strong>Fetch/XHR</strong>，只看接口。点开一条，右侧分四块：Headers 看状态码和请求头，Payload 看你发出去的参数，Response 看服务端返回的原文，Timing 看每一段耗时。</p><p>两个开关能省很多时间：<strong>Disable cache</strong> 勾上后请求不走缓存，改完代码立刻看到新版本；顶部限速选 <strong>Slow 3G</strong>，能复现弱网下的样子——加载慢、按钮点了没反应这类问题基本只能这样查。</p>'
      },
      {
        type: 'table',
        title: '最该看懂的几个状态码',
        head: ['状态码', '含义', '接下来查什么'],
        rows: [
          ['200', '成功', '看 Response 里的数据对不对，不要只看页面显示'],
          ['301 / 302', '重定向', '请求地址写错了，或者 http 被跳到了 https'],
          ['304', '走了缓存，没有重新下载', '要拿最新内容就勾 Disable cache 再刷新'],
          ['401 / 403', '没登录 / 登录了但没权限', '看请求头里有没有带上 Cookie 或 Authorization'],
          ['404', '路径不存在', '对比接口文档，注意结尾斜杠和大小写'],
          ['500', '服务端崩了', '不是前端问题，把这条请求和返回贴给后端']
        ]
      },
      {
        type: 'text',
        title: 'Sources：让代码停在你要看的那一行',
        html: '<p>在 Sources 里找到你的 JS 文件，点行号就设了一个断点（breakpoint）。代码跑到这行会暂停，右侧能看到此刻所有变量的值，鼠标悬在变量上也行。上方按钮依次是继续、单步跳过、单步进入、跳出。</p><p>临时调试更快的办法是在代码里写一行 <code>debugger</code>：只要 DevTools 开着就会停在那里，关掉面板就不影响线上用户。</p>'
      },
      {
        type: 'text',
        title: 'Application：前端到底存了什么',
        html: '<p>Application 面板能看到 Local Storage、Session Storage、Cookie、Cache Storage。查登录状态最常看 Cookie：<code>HttpOnly</code> 打了勾的 Cookie 是 JavaScript 读不到的，所以 <code>document.cookie</code> 里看不见它<strong>不代表它不存在</strong>。</p><p>改一个值再刷新，就能验证这个字段到底影不影响页面。清站点数据也在这一页：左下 Clear storage，勾上要清的项，点 Clear site data。</p>'
      },
      {
        type: 'tip',
        title: '勾上 Preserve log，别让日志被跳转冲掉',
        html: '<p>登录、支付这类流程提交后会跳转页面，而 Network 和 Console 默认在跳转时清空——你正要看的那个失败请求就这么没了。在 Network 顶部勾 <strong>Preserve log</strong>，Console 的右上角设置里也有同名项。</p><p>查「点提交之后报 500」这类问题，这一项是第一个要勾的。也可以在命令菜单里把限速调成 Offline，模拟断网看页面怎么兜底。</p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '随便打开一个网站，用开发者工具找出它发出的一个接口请求，再用控制台改一个元素的样式。',
      items: [
        { text: '打开任意页面，打开面板并切到 Network，刷新一次', cmd: 'location.reload()' },
        { text: '点 Fetch/XHR 筛选，点开一条请求，在 Response 里找到返回的 JSON' },
        { text: '切到 Console，用 $0 给选中元素加一层描边', cmd: '$0.style.outline = "2px solid red"' },
        { text: '勾上 Disable cache 再刷新，看同一条请求的体积有没有变小' }
      ],
      done: '你能说出这条请求的状态码、返回里有哪些字段，也看到 $0 改的是哪个元素。'
    },
    quiz: [
      {
        q: '在 Elements 里改完 CSS，刷新页面就还原了，为什么？',
        options: ['浏览器有 bug', '面板里的修改只存在当前页面，不会写回源文件', '缓存没清', '必须先保存工作区'],
        answer: 1,
        explain: 'Elements 的修改只作用于当前页面的内存，刷新即丢弃。要永久生效必须改源文件，或者用 Workspace 把面板和本地目录关联起来。'
      },
      {
        q: 'Network 里一条请求显示 304，说明什么？',
        options: ['请求失败了', '服务端出错了', '浏览器用了缓存，内容没变，没有重新下载', '被重定向到了别的地址'],
        answer: 2,
        explain: '304 Not Modified 是协商缓存的结果：浏览器带上 If-None-Match 问服务端，服务端说没变，于是省掉一次下载。想强制拿新内容就勾 Disable cache。'
      },
      {
        q: '调试登录跳转时请求记录消失了，应该怎么做？',
        options: ['重新登录一次', '在 Network 里勾上 Preserve log', '先清空浏览器缓存', '换一个浏览器再试'],
        answer: 1,
        explain: '页面跳转时 Network 和 Console 默认清空记录。勾上 Preserve log 后，跳转前的请求和报错都会留下来，正好用来查提交之后发生了什么。'
      }
    ]
  },

  {
    id: 'docker-basics',
    order: 24,
    track: 'dev',
    title: 'Docker 基础：把环境装进盒子',
    subtitle: '同一份镜像，在你电脑和服务器上跑出同样的结果',
    minutes: 16,
    level: '进阶',
    goal: [
      '说清容器和虚拟机的区别',
      '用 docker run 起一个服务并映射端口',
      '写四行 Dockerfile 把项目打成镜像',
      '知道挂载目录会带来什么权限问题'
    ],
    sections: [
      {
        type: 'text',
        title: '容器解决的是「我这能跑」',
        html: '<p>你写了个 Node 服务，本机能跑。同事拉下来报 <code>Error: Cannot find module express</code>；换到服务器又报 <code>GLIBC_2.28 not found</code>。原因不复杂：<strong>代码一样，运行环境不一样</strong>——Node 版本、系统库、环境变量、时区，任何一项不同都会让程序起不来。</p><p>容器（container）的思路是把程序加它需要的整个环境打成一个包，到哪都按包里的样子跑。这个包叫镜像（image），跑起来的实例叫容器。</p>'
      },
      {
        type: 'compare',
        title: '直接在电脑上装 vs 用容器',
        left: { label: '直接在电脑上装', items: ['项目 A 要 Node 16，项目 B 要 Node 20，只能来回切版本', '同事的系统版本和你不同，报错查不出来', '换台电脑要重装一遍所有工具，半天起步', '装错了留下的残留文件很难清干净'] },
        right: { label: '用容器', items: ['每个项目自带版本，互不干扰', '镜像里就是这个程序需要的全部东西，结果可复现', '一条 docker run 就能跑，换机器也一样', '删容器等于全部清掉，不污染系统'] },
        note: '<p>容器不是虚拟机。它和宿主机共用同一个系统内核，所以启动是秒级、开销接近零。代价是 Windows 和 macOS 上跑的是 Linux 容器，中间隔了一层虚拟机，文件读写性能比 Linux 差一截。</p>'
      },
      {
        type: 'terminal',
        title: '把镜像拉下来',
        command: 'docker pull node:20-alpine',
        output: '20-alpine: Pulling from library/node\nStatus: Downloaded newer image for node:20-alpine\ndocker.io/library/node:20-alpine',
        note: '这条只下载，不运行，不会在你电脑上留下任何可执行程序。alpine 是精简版 Linux，镜像约 130 MB；换成 node:20 会到 1 GB 左右。看本地有哪些镜像用 docker images。'
      },
      {
        type: 'terminal',
        title: '跑一条一次性命令',
        command: 'docker run -it --rm node:20-alpine node -v',
        output: 'v20.11.1',
        note: '-it 让容器接上你的终端，--rm 表示退出后自动删除容器。末尾的 node -v 是在容器里执行的命令，不是你本机的。这条命令不写你的磁盘。'
      },
      {
        type: 'text',
        title: '不加 --rm，容器退出后会留在那',
        html: '<p><code>docker run</code> 不加 <code>--rm</code> 时，容器退出后仍然留在磁盘上，占空间也占名字。<code>docker ps</code> 只看正在跑的，<code>docker ps -a</code> 才看得到已退出的那些。</p><p>退出的容器不会自动清。攒到几十个，磁盘会明显变少。确认不要了用 <code>docker rm 容器ID</code> 删；还在跑的要先 <code>docker stop</code>。名字重复导致的 <code>Conflict. The container name is already in use</code> 也是这么来的。</p>'
      },
      {
        type: 'table',
        title: '四条命令管住日常',
        head: ['命令', '做什么', '注意什么'],
        rows: [
          ['docker images', '列出本地镜像和体积', '只读，无风险'],
          ['docker ps -a', '列出所有容器，含已退出', '只读，用来看残留'],
          ['docker rm 容器ID', '删除已退出的容器', '正在跑的删不掉，先 docker stop'],
          ['docker rmi 镜像名', '删除本地镜像', '被容器引用时删不掉，先删容器']
        ]
      },
      {
        type: 'warn',
        title: '挂载目录：最方便，也最容易踩权限',
        html: '<p><code>-v "$(pwd)":/app</code> 把当前目录映射进容器的 /app，改代码不用重新构建。它有两个必须知道的后果。</p><ul><li><strong>挂载会盖住镜像里同名目录</strong>。镜像里 /app 已经装好了依赖，你一挂载，容器看到的是你本机那份目录，缺依赖就直接报找不到模块。</li><li><strong>容器默认以 root 运行</strong>，它在挂载目录生成的文件在宿主机上属于 root。之后你删不掉、编辑器也保存不了，只能 sudo。加 <code>-u "$(id -u):$(id -g)"</code> 让它用你的身份跑。</li></ul><p>还有一条：macOS 和 Windows 的挂载要经过共享层，几万个文件的 node_modules 读写会明显变慢。</p>'
      },
      {
        type: 'code',
        title: '四行 Dockerfile',
        lang: 'bash',
        text: 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]',
        note: 'FROM 选基础镜像，WORKDIR 设容器里的工作目录（不存在会自动建），COPY 把当前目录复制进去，CMD 是启动时默认执行的命令。在 Dockerfile 所在目录执行 docker build -t my-app:0.1 . ，最后的点表示构建上下文是当前目录，不能省。这四行能跑，但没利用缓存：任何文件一改，COPY 那一层失效，依赖得重装。正式项目会把 COPY package*.json ./ 和 RUN npm ci 提到 COPY . . 之前。'
      },
      {
        type: 'terminal',
        title: '端口映射：让浏览器访问到容器里的服务',
        command: 'docker run -d -p 3000:3000 --name web my-app:0.1',
        output: '9f2c1a7b4e8d',
        note: '-p 前面是宿主机端口，后面是容器里的端口，写反了浏览器就打不开。-d 表示后台运行，命令立刻返回容器 ID。之后访问 http://localhost:3000，实际连的是容器里监听 3000 的那个进程。'
      },
      {
        type: 'text',
        title: 'docker compose：把几个容器编成一组',
        html: '<p>一个 Web 服务通常还带数据库、缓存。挨个 <code>docker run</code> 记参数很痛苦，compose 用一个 <code>compose.yaml</code> 描述这些容器：镜像、端口、挂载、环境变量、启动顺序，然后一条命令全起来。</p><p>常用就三条：<code>docker compose up -d</code> 后台启动全部，<code>docker compose logs -f</code> 跟日志，<code>docker compose down</code> 停止并删除这些容器。加 <code>-v</code> 会连数据卷一起删，<strong>数据库里的数据会没</strong>。</p>'
      },
      {
        type: 'terminal',
        title: '清理：先看清它会删什么',
        command: 'docker system prune',
        output: 'WARNING! This will remove:\n  - all stopped containers\n  - all networks not used by at least one container\n  - all dangling images\n  - all dangling build cache\n\nTotal reclaimed space: 3.412GB',
        note: '默认只删悬空的东西：没 tag 的镜像、已退出的容器、没用的网络，相对安全。加 -a 会连所有没被运行中容器使用的镜像一起删，下次用要重新拉；再加 --volumes 会删数据卷，数据库数据一起没。执行前先 docker ps -a 和 docker images 过一遍。'
      },
      {
        type: 'tip',
        title: '把不该进镜像的东西挡在门外',
        html: '<p><code>COPY . .</code> 会把 <code>.git</code>、<code>node_modules</code>、<code>.env</code> 一起塞进镜像。<code>.env</code> 里通常有密钥，进了镜像就等于跟着镜像分发到任何地方，而且历史层里删不掉。</p><p>在 Dockerfile 同目录建 <code>.dockerignore</code>，写四行：<code>node_modules</code>、<code>.git</code>、<code>.env</code>、<code>dist</code>。语法和 .gitignore 一样，作用是构建时这些文件不参与复制。</p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '用官方 Node 镜像在容器里跑一行命令，再把一个本地目录挂进去，看看新建文件的属主变成谁。',
      items: [
        { text: '拉一个精简版 Node 镜像并确认它在本地', cmd: 'docker pull node:20-alpine && docker images' },
        { text: '在容器里打印 Node 版本，退出后容器应自动删除', cmd: 'docker run -it --rm node:20-alpine node -v' },
        { text: '挂载当前目录并建一个文件，回到宿主机看属主', cmd: 'docker run --rm -v "$(pwd)":/app -w /app node:20-alpine touch test.txt && ls -l test.txt' }
      ],
      done: 'docker ps -a 里没有残留容器，test.txt 出现在你当前目录，用 ls -l 看它的属主显示为 root。'
    },
    quiz: [
      {
        q: '-p 3000:8080 表示什么？',
        options: ['容器 3000 映射到宿主机 8080', '宿主机 3000 映射到容器 8080', '容器内外都用 3000', '随机分配两个端口'],
        answer: 1,
        explain: '冒号左边是宿主机端口，右边是容器里进程监听的端口。写反了浏览器打不开，因为容器里的服务根本没在 3000 上监听，你连不上它。'
      },
      {
        q: '容器在挂载目录里生成的文件属主是 root，怎么避免？',
        options: ['把目录 chmod 777', '用 -u 传入你本机的用户和组 ID，让容器以你的身份运行', '每次都用 sudo 删文件', '改用 docker cp 复制文件'],
        answer: 1,
        explain: '容器默认以 root 身份运行，写出的文件自然属于 root。启动时用 -u 传 UID 和 GID，或者在镜像里建普通用户并用 USER 指令指定，都能避免。'
      },
      {
        q: 'docker system prune -a 会做什么？',
        options: ['只删已退出的容器', '删除没被运行中容器使用的所有镜像，以及已退出容器和构建缓存', '只清日志文件', '重启 Docker 服务'],
        answer: 1,
        explain: '-a 会把没有被运行中容器引用的镜像全删掉，下次用要重新拉取。它不动数据卷，但加 --volumes 就会连数据库数据一起删，执行前务必确认。'
      }
    ]
  },

  {
    id: 'ssh-keys',
    order: 25,
    track: 'dev',
    title: 'SSH 与密钥：免密登录服务器',
    subtitle: '生成一对密钥，让服务器认你的机器，不再每次输密码',
    minutes: 14,
    level: '进阶',
    goal: [
      '说清公钥和私钥各自能做什么',
      '生成 ed25519 密钥并装到服务器上',
      '用 config 给常用服务器起别名',
      '按报错文本定位连不上的原因'
    ],
    sections: [
      {
        type: 'text',
        title: 'SSH 在做两件事',
        html: '<p>SSH（Secure Shell）是一条加密通道。你敲的每个字符、服务器返回的每个字节都在通道里加密传输，中间的路由器只能看到有一串流量，看不到内容。</p><p>连上之前要做两次认证：<strong>你确认服务器是真的</strong>（否则可能连到一台冒充它的机器），<strong>服务器确认你是你</strong>。前者靠指纹，后者靠密码或密钥。密钥登录就是后者的免密方案。</p>'
      },
      {
        type: 'terminal',
        title: '第一次连一台新机器',
        command: 'ssh root@203.0.113.10',
        output: 'The authenticity of host \'203.0.113.10 (203.0.113.10)\' can\'t be established.\nED25519 key fingerprint is SHA256:q5Kd8s2fH1mZ7cVbQ0nLp4xYaJ6tR9wUeS3gP8Zp8.\nThis key is not known by any other names.\nAre you sure you want to continue connecting (yes/no/[fingerprint])?',
        note: '它在问你信不信这台机器。输 yes 后指纹写进 known_hosts，以后不再问。看不到内容就别急着输 yes：用别的渠道核对一下指纹，这一步能挡住一次冒充。'
      },
      {
        type: 'text',
        title: '公钥和私钥：一个是锁，一个是钥匙',
        html: '<p><code>ssh-keygen</code> 一次生成两个文件：<code>id_ed25519</code> 是私钥，<code>id_ed25519.pub</code> 是公钥。公钥可以随便发——它只是锁，贴到 GitHub、贴到服务器都无所谓；私钥是钥匙，<strong>永远不要发给任何人，不要粘进网页，不要提交进仓库</strong>。</p><p>认证过程是：服务器拿你的公钥出一道只有对应私钥能解的题，你本地的私钥解开了，就证明你是你。私钥全程不出你的机器——这也是它比密码安全的地方，服务器那边根本不存在能直接偷走的东西。</p>'
      },
      {
        type: 'terminal',
        title: '生成一对 ed25519 密钥',
        command: 'ssh-keygen -t ed25519 -C "you@example.com"',
        output: 'Generating public/private ed25519 key pair.\nEnter file in which to save the key (/Users/you/.ssh/id_ed25519):\nEnter passphrase (empty for no passphrase):\nYour identification has been saved in /Users/you/.ssh/id_ed25519\nYour public key has been saved in /Users/you/.ssh/id_ed25519.pub\nThe key fingerprint is:\nSHA256:q5Kd8s2fH1mZ7cVbQ0nLp4xYaJ6tR9wUeS3gP8Zp8 you@example.com',
        note: '-t ed25519 指定算法，比老的 rsa 更短更安全；-C 只是备注，写在公钥末尾，方便你在 GitHub 上认出是哪台机器的。两个回车都直接按，就是默认路径、不设口令。已有同名文件时它会问你 Overwrite (y/n)，拿不准就输 n 换个文件名。'
      },
      {
        type: 'code',
        title: '看一眼公钥，贴到该贴的地方',
        lang: 'bash',
        text: 'cat ~/.ssh/id_ed25519.pub        # 输出以 ssh-ed25519 开头的一整行\npbcopy < ~/.ssh/id_ed25519.pub   # macOS 复制到剪贴板\nclip < ~/.ssh/id_ed25519.pub     # Windows cmd 复制\n# PowerShell 用：Get-Content $env:USERPROFILE\\.ssh\\id_ed25519.pub | Set-Clipboard',
        note: '这一整行就是要贴进 GitHub 的 Settings、SSH and GPG keys、New SSH key 里的内容。贴错成私钥（文件名不带 .pub 的那个）是最常见的失误，一旦贴出去就立刻作废并重新生成。'
      },
      {
        type: 'terminal',
        title: '把公钥装到服务器上',
        command: 'ssh-copy-id -i ~/.ssh/id_ed25519.pub root@203.0.113.10',
        output: 'Number of key(s) added: 1\n\nNow try logging into the machine, with:   ssh root@203.0.113.10\nand check to make sure that only the key(s) you wanted were added.',
        note: '它会用密码登录一次，把你的公钥追加到服务器上 ~/.ssh/authorized_keys 末尾。Windows 没有 ssh-copy-id，用这句代替：type $env:USERPROFILE\\.ssh\\id_ed25519.pub | ssh root@203.0.113.10 "cat >> ~/.ssh/authorized_keys"。'
      },
      {
        type: 'code',
        title: '~/.ssh/config：给常用服务器起别名',
        lang: 'bash',
        text: 'Host vps\n    HostName 203.0.113.10\n    User deploy\n    Port 2222\n    IdentityFile ~/.ssh/id_ed25519\n    ServerAliveInterval 60\n\nHost github.com\n    HostName github.com\n    User git\n    IdentityFile ~/.ssh/id_ed25519',
        note: '配好之后只敲 ssh vps 就行，端口和密钥自动带上。ServerAliveInterval 60 表示每分钟发一次心跳，防止空闲连接被路由器掐断。这个文件的权限必须是 600，否则 ssh 会告警 Bad owner or permissions 并整份忽略它。'
      },
      {
        type: 'text',
        title: '权限 600 是硬要求',
        html: '<p>OpenSSH 拒绝使用权限过宽的私钥，会直接报错退出：<code>WARNING: UNPROTECTED PRIVATE KEY FILE!</code> 后面跟 <code>Permissions 0644 for /home/you/.ssh/id_ed25519 are too open.</code></p><p>Linux 和 macOS 上执行四条：<code>chmod 700 ~/.ssh</code>、<code>chmod 600 ~/.ssh/id_ed25519</code>、<code>chmod 644 ~/.ssh/id_ed25519.pub</code>、<code>chmod 600 ~/.ssh/config</code>。<strong>不要用 chmod 777 绕过去</strong>：那是把私钥变成全机器可读，等于把钥匙挂在门上。</p><p>Windows 没有这套权限位，对应的是文件 ACL，一般不用改；只有把 .ssh 目录复制进 WSL 时才要注意属主。</p>'
      },
      {
        type: 'table',
        title: '四个真实报错，对着查',
        head: ['报错文本', '原因', '处理'],
        rows: [
          ['Permission denied (publickey).', '服务器没找到匹配的公钥，或本地没提供私钥', '确认 ssh-copy-id 成功，加 -v 看实际用了哪把钥匙'],
          ['Permissions 0644 ... are too open', '私钥权限太宽', 'chmod 600 ~/.ssh/id_ed25519'],
          ['WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!', '服务器换过密钥，或你连到了别的机器', '核对后 ssh-keygen -R 主机名 删掉旧记录'],
          ['Connection refused', '端口没开、sshd 没跑，或防火墙拦了', '换端口试 ssh -p 2222，再查服务器上 sshd 是否在跑']
        ]
      },
      {
        type: 'steps',
        title: 'Permission denied (publickey) 的排查顺序',
        items: [
          { title: '先加 -v 看清楚', html: '<p>执行 <code>ssh -v root@203.0.113.10</code>，重点看 <code>Offering public key:</code> 和 <code>Authentications that can continue:</code> 两行。前者列出你实际提供的钥匙，后者告诉你服务器还接受哪些方式。</p>' },
          { title: '确认公钥真的到了服务器', html: '<p>用密码登录一次，执行 <code>cat ~/.ssh/authorized_keys</code>，看有没有你那一整行。<strong>注意是不是同一个用户</strong>：装到 root，却用 deploy 登录，一样不通。</p>' },
          { title: '检查服务器端权限', html: '<p>服务器上 <code>~/.ssh</code> 要 700，<code>authorized_keys</code> 要 600，家目录不能被组或其他用户写。<code>chmod g-w,o-w ~</code> 能修掉最常见的那种。</p>' },
          { title: '确认 sshd 允许密钥登录', html: '<p><code>/etc/ssh/sshd_config</code> 里应为 <code>PubkeyAuthentication yes</code>，改完 <code>systemctl restart ssh</code>。<strong>改之前先留一个已登录的会话别关</strong>，配错会把自己锁在外面。</p>' },
          { title: '换一把钥匙显式指定', html: '<p>本地有多把钥匙时，默认可能只试 id_rsa。显式指定：<code>ssh -i ~/.ssh/id_ed25519 root@203.0.113.10</code>。</p>' }
        ]
      },
      {
        type: 'terminal',
        title: 'GitHub 上用同一套密钥',
        command: 'ssh -T git@github.com',
        output: 'Hi yourname! You\'ve successfully authenticated, but GitHub does not provide shell access.',
        note: '第一次执行会问要不要信任 github.com 的指纹，输 yes。看到这行就说明公钥生效了，之后 git clone git@github.com:用户名/仓库.git 不再要密码。报 Permission denied (publickey) 就回到上一步的清单，多半是公钥没加到 GitHub，或者密钥不在默认路径。'
      },
      {
        type: 'warn',
        title: '私钥一旦泄露，删掉也没用',
        html: '<p>私钥文件名不带 .pub，内容以 <code>-----BEGIN OPENSSH PRIVATE KEY-----</code> 开头。它一旦进了聊天记录、截图、Git 提交，就等于钥匙已经公开，<strong>事后删掉不算补救</strong>，要按已泄露处理。</p><p>处理顺序：登录服务器，把 authorized_keys 里对应的那行删掉；在 GitHub 上删掉那把 key；重新 <code>ssh-keygen</code> 生成一对。如果私钥进过 Git 历史，还要用 <code>git filter-repo</code> 清掉，因为仓库可能早被克隆过。</p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '生成一把专用的 ed25519 密钥，把公钥装到一台你能登录的服务器上，再配一个别名连一次。',
      items: [
        { text: '生成一把带备注的密钥（已有旧密钥就换个文件名，别覆盖）', cmd: 'ssh-keygen -t ed25519 -C "dev@laptop"' },
        { text: '把公钥装到服务器，然后只用密钥登录一次', cmd: 'ssh-copy-id -i ~/.ssh/id_ed25519.pub root@203.0.113.10' },
        { text: '在 ~/.ssh/config 里加 Host 别名，用别名连', cmd: 'ssh vps' },
        { text: '修好权限，并验证 GitHub 那边的密钥状态', cmd: 'chmod 600 ~/.ssh/id_ed25519 && ssh -T git@github.com' }
      ],
      done: '用别名 ssh vps 连上去不再询问密码，ssh -T git@github.com 返回以 Hi 开头、带你自己用户名的一行。'
    },
    quiz: [
      {
        q: '哪个文件可以安全地发给别人，或者贴到网站上？',
        options: ['id_ed25519', 'id_ed25519.pub', '两个都不行', '两个都可以'],
        answer: 1,
        explain: '带 .pub 的是公钥，本质是一把锁，放进服务器的 authorized_keys 或 GitHub 上都是它的正常用途。不带 .pub 的私钥是钥匙，任何情况下都不该离开你的机器。'
      },
      {
        q: '私钥权限是 0644，ssh 会怎样？',
        options: ['照常登录', '忽略权限继续，只是速度变慢', '报 UNPROTECTED PRIVATE KEY FILE 并拒绝使用这把钥匙', '自动把它改回 0600'],
        answer: 2,
        explain: 'OpenSSH 拒绝使用组或其他用户可读的私钥，报 Permissions 0644 are too open 后直接退出，服务器都连不上。改成 chmod 600 就能解决，不要为了省事用 777，那等于让整台机器都能读你的钥匙。'
      },
      {
        q: '连一台重装过的服务器，报 REMOTE HOST IDENTIFICATION HAS CHANGED，怎么办？',
        options: ['把 known_hosts 整个删掉', '确认是同一台机器后，用 ssh-keygen -R 主机名 删掉它的旧记录', '在 ssh 命令里关掉严格检查', '重新生成一对密钥'],
        answer: 1,
        explain: '这个警告表示服务器指纹和上次记录不一致，可能是重装，也可能是有人在中间冒充。先核对，再用 ssh-keygen -R 精确删掉那一台，别整个删 known_hosts。'
      }
    ]
  }
);

