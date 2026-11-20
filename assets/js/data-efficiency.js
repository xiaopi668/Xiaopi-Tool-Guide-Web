window.PS = window.PS || {};
window.PS.lessons = window.PS.lessons || [];
window.PS.lessons.push(
  {
    id: 'shell-efficiency',
    order: 26,
    track: 'efficiency',
    title: '终端效率：别名、历史与补全',
    subtitle: '把每天敲的命令压成几个字符，重复的动作交给 shell',
    minutes: 12,
    level: '基础',
    goal: [
      '把常用命令写成 alias 与函数放进配置文件',
      '用 history 与 Ctrl+R 找回几天前那条命令',
      '用 !$、cd -、目录栈少打一半字',
      '知道哪些别名和写法会给自己挖坑'
    ],
    sections: [
      {
        type: 'text',
        title: '这一课只讲提速',
        html: '<p>前面的终端课已经讲过怎么移动目录、怎么看文件。这一课不重复那些基础命令，只回答一个问题：<strong>同一件事，怎么少敲一半键。</strong></p><p>提速分三层：不敲（从历史里找回）、少敲（别名、函数、补全）、一次敲完（命令组合、花括号展开）。三层都依赖同一件事——你的 shell 有一个配置文件，每次启动会自动加载它。</p><p>macOS 默认 zsh（Z shell），配置文件是 <code>~/.zshrc</code>；多数 Linux 服务器默认 bash（Bourne Again Shell），配置文件是 <code>~/.bashrc</code>。先确认自己在哪个里：<code>echo $SHELL</code>。输出 <code>/bin/zsh</code> 就改前者，输出 <code>/bin/bash</code> 就改后者，改错文件不会报错，只是永远不生效。</p>'
      },
      {
        type: 'text',
        title: '别名：给长命令起个短名字',
        html: '<p>别名（alias）就是给一条命令起短名。用 <code>alias 名字=命令</code> 定义，用 <code>unalias 名字</code> 撤销。三条规则要记住：等号两边<strong>不能有空格</strong>；右边的命令里带空格就必须用单引号包住；别名只对当前这个交互式 shell 生效，关掉窗口就没了。</p><p>所以真正有用的别名必须写进配置文件。写完后用 <code>source ~/.zshrc</code> 让当前窗口重读一遍，之后新开的窗口会自动加载。想验证某个别名生没生效，直接敲 <code>alias ll</code>，有输出就是有。</p>'
      },
      {
        type: 'code',
        title: '把别名和函数写进 ~/.zshrc',
        lang: 'bash',
        text: '# ~/.zshrc —— 用 bash 的话把同样的内容写进 ~/.bashrc\n\n# 常用别名：短名 = 长命令\nalias ll=\'ls -lh\'          # 长格式，大小带单位\nalias la=\'ls -lAh\'         # 连隐藏文件一起列\nalias gs=\'git status -sb\'  # 一行一个文件\nalias gd=\'git diff\'\nalias ..=\'cd ..\'\nalias ports=\'lsof -nP -iTCP -sTCP:LISTEN\'   # 谁在监听端口\nalias myip=\'curl -s ifconfig.me; echo\'      # 查公网 IP\n\n# 别名带不了参数，需要参数就写函数\nmkcd() { mkdir -p \"$1\" && cd \"$1\"; }        # mkcd 目录名：建了再进\nglog() { git log --oneline --graph --decorate -n 20; }\n',
        note: '函数里的 \"$1\" 是第一个参数。写完先 source ~/.zshrc，再敲 mkcd demo 验证：目录建出来了，而且人已经在里面。'
      },
      {
        type: 'text',
        title: '历史：你已经敲过一遍了',
        html: '<p>shell 把敲过的命令记进历史文件（zsh 是 <code>~/.zsh_history</code>，bash 是 <code>~/.bash_history</code>），<code>history</code> 打印出来，前面的数字是编号。</p><p>配合叹号就是历史展开（history expansion）：<code>!!</code> 上一条整条命令，<code>!$</code> 上一条的最后一个参数，<code>!*</code> 上一条的全部参数，<code>!128</code> 第 128 条，<code>!git</code> 最近一条以 git 开头的命令。后面加 <code>:p</code> 只打印不执行，比如 <code>sudo !!:p</code> 先看清楚再决定按不按回车。</p>'
      },
      {
        type: 'terminal',
        title: '叹号展开实际长什么样',
        command: 'history 3\nnpm install -g pnpm\nsudo !!\nmkdir -p ~/work/notes-2026\ncd !$\npwd',
        output: '  498  git status\n  499  npm run build\n  500  history 3\nnpm ERR! code EACCES\nnpm ERR! syscall mkdir\nnpm ERR! path /usr/local/lib/node_modules/pnpm\nsudo npm install -g pnpm\nmkdir -p /Users/you/work/notes-2026\ncd /Users/you/work/notes-2026\n/Users/you/work/notes-2026',
        note: '这个例子里的 sudo !! 只是演示展开，不是推荐做法：用 sudo 装全局包会在系统目录留下 root 拥有的文件，以后每次升级都要 sudo。!! 会把上一条原样再执行一次，前面是 rm -rf 之类就没有第二次机会，所以先 !!:p。'
      },
      {
        type: 'shortcuts',
        title: '行编辑与历史快捷键',
        items: [
          { action: '反向搜索历史', mac: ['Ctrl', 'R'], win: ['Ctrl', 'R'], note: '按一次开始搜，再按一次跳到更早的匹配，回车执行，Ctrl+G 放弃' },
          { action: '跳到行首', mac: ['Ctrl', 'A'], win: ['Ctrl', 'A'] },
          { action: '跳到行尾', mac: ['Ctrl', 'E'], win: ['Ctrl', 'E'] },
          { action: '删掉光标前整段', mac: ['Ctrl', 'U'], win: ['Ctrl', 'U'], note: '删错了用 Ctrl+Y 粘回来' },
          { action: '删掉前一个词', mac: ['Ctrl', 'W'], win: ['Ctrl', 'W'] },
          { action: '清屏', mac: ['⌘', 'K'], win: ['Ctrl', 'L'], note: 'Ctrl+L 在两个平台的终端里都能用，而且保留可以回滚的历史输出' },
          { action: '中断正在跑的命令', mac: ['Ctrl', 'C'], win: ['Ctrl', 'C'] },
          { action: '补全路径或命令', mac: ['Tab'], win: ['Tab'], note: '按一次补到唯一前缀，按两次列出所有候选' }
        ]
      },
      {
        type: 'text',
        title: 'Tab 补全：顺带验证东西存在',
        html: '<p>补全（completion）不只是省字，它替你<strong>验证</strong>：敲 <code>cd ~/proj</code> 再按 Tab，补不出来就说明前缀不对或目录不在；补出来了再回车，就不会有「路径打错」这类错误。命令名、分支名、npm 脚本名同样能补。</p><p>zsh 首次使用要跑一遍 <code>compinit</code>，之后选项和子命令也能补；bash 需要装 <code>bash-completion</code> 包。<code>cd</code> 之后只按 Tab 会列出当前目录下所有子目录，这是找一个记不清名字的项目目录最快的方式。装 fzf 之后 Ctrl+R 会变成全屏模糊搜索。</p>'
      },
      {
        type: 'code',
        title: '值得抄进配置文件的几行',
        lang: 'bash',
        text: '# ~/.zshrc\nHISTSIZE=50000\nSAVEHIST=50000\nHISTFILE=~/.zsh_history\nsetopt HIST_IGNORE_DUPS    # 连续重复的命令只记一次\nsetopt HIST_IGNORE_SPACE   # 以空格开头的命令不进历史，临时命令用\nsetopt SHARE_HISTORY       # 多个窗口共用同一份历史\nsetopt HIST_VERIFY         # !! 先展开给你看，回车才执行\nsetopt AUTO_CD             # 直接敲目录名就进去，不用打 cd\n\nautoload -Uz compinit && compinit\nzstyle \':completion:*\' matcher-list \'m:{a-zA-Z}={A-Za-z}\'   # 补全忽略大小写\n',
        note: 'HIST_VERIFY 是这里最值钱的一行：它把 !! 从「直接执行」改成「先给你看」，手感几乎不变，风险小很多。用 bash 的话，对应的是 HISTCONTROL=ignoreboth 和 shopt -s histappend。'
      },
      {
        type: 'text',
        title: '命令组合：一次敲完三件事',
        html: '<p>三个连接符决定下一条什么时候跑：<code>;</code> 不管前面成功失败都跑；<code>&amp;&amp;</code> 前面成功（退出码 0）才跑；<code>||</code> 前面失败才跑。竖线 <code>|</code> 把上一条的输出交给下一条当输入。</p><p>几个每天都在用的组合：<code>mkdir -p app/{src,test,docs}</code> 一次建三个目录，花括号展开是 shell 自己做的，不依赖任何工具；<code>npm run build 2&gt;&amp;1 | tee build.log</code> 既在屏幕上看到又存成文件；<code>history | grep docker | tail -5</code> 翻出最近用过的 docker 命令；<code>cd /tmp || echo 目录不存在</code> 让失败有一句人话。</p>'
      },
      {
        type: 'text',
        title: '两个目录之间来回：cd - 与目录栈',
        html: '<p><code>cd -</code> 回到上一个目录，并把目标路径打印出来。代码目录和日志目录之间来回，一天能用几十次，比重新敲一遍长路径快得多。</p><p>要在三四个目录之间跳，用目录栈（directory stack）：<code>pushd /var/log</code> 进目录并把原位置压进栈，<code>popd</code> 弹回上一层，<code>dirs -v</code> 看带编号的整个栈，<code>pushd +1</code> 直接跳到第 1 层。zsh 里加上 <code>setopt AUTO_PUSHD</code> 之后，普通的 <code>cd</code> 也会自动压栈，回退用 <code>cd -</code> 或 <code>popd</code> 都行。注意 <code>cd -</code> 只记一个「上一个」，跳三个目录就不够用了。</p>'
      },
      {
        type: 'tip',
        title: '先跑通，再起名',
        html: '<p>别名最容易写坏的地方是<strong>把还没跑通的命令包起来</strong>。先在终端里完整敲一遍，确认输出对、报错清楚，再粘进配置文件改成别名。否则你以后每次出错，都要多怀疑一层「是不是我的别名写错了」。</p><p>起名也要避开已有命令：把 <code>ls</code> 设成 <code>ls -lh</code> 还凑合，把 <code>grep</code>、<code>cd</code>、<code>git</code> 改掉就不行——脚本和肌肉记忆都会跟着变，报错时你还以为自己用的是原版。真要包一层，用函数并且起个新名字。</p>'
      },
      {
        type: 'warn',
        title: '别名不生效的三个原因',
        html: '<p><strong>改完不生效</strong>：你在 zsh 里改了 <code>~/.bashrc</code>。用 <code>echo $SHELL</code> 确认，别靠记忆。</p><p><strong>当前窗口生效、新窗口不生效</strong>：只敲了 <code>source</code> 没写进文件，或者写进了 <code>~/.zsh_profile</code> 这类不存在的文件。</p><p><strong>只有脚本里不生效</strong>：非交互式 shell 不展开别名，这是设计如此，不是配置错了。脚本里要用短名字，就写函数，或者把命令写全。另外 macOS 上从图标启动的图形程序读不到 <code>~/.zshrc</code>，编辑器终端里找不到 nvm 装的 node，通常就是这件事。</p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '打开你自己的终端，先确认 shell 类型，再写三条每天都用得到的别名，最后用历史展开跑一条长命令。',
      items: [
        { text: '打印当前使用的 shell，确认该改哪个配置文件', cmd: 'echo $SHELL' },
        { text: '在配置文件末尾加三条别名（ll、gs、ports），保存后重新加载', cmd: 'source ~/.zshrc' },
        { text: '验证别名真的生效了', cmd: 'alias ll' },
        { text: '敲一条带长路径的命令，再用 !$ 复用它的最后一个参数', cmd: 'mkdir -p ~/work/demo && cd !$' }
      ],
      done: '新开一个终端窗口，三个别名不用重新定义就能用，说明配置写对了。'
    },
    quiz: [
      {
        q: '你在 zsh 里加了 alias，当前窗口却没生效，先去查哪件事？',
        options: ['配置文件是不是写在了 ~/.bashrc', '有没有执行 source ~/.zshrc', 'zsh 是否支持 alias', '是不是得重启电脑'],
        answer: 1,
        explain: '定义写在文件里只对新启动的 shell 生效，当前窗口要用 source 让它重读一遍。写错文件也会造成同样的现象，但验证 source 只花一秒，是最该先做的检查。'
      },
      {
        q: '上一条命令是 mkdir -p ~/work/report-v2，这时 cd !$ 会做什么？',
        options: ['回到上一个目录', '进入 ~/work/report-v2', '打印上一条命令的完整内容', '清空历史记录'],
        answer: 1,
        explain: '!$ 是历史展开里的最后一个参数，等价于 !!:$ 的简写。上一条的最后一个参数正好是那个路径，于是 cd 拿到的就是它，长路径不用再敲第二遍。'
      },
      {
        q: 'npm run build && git push 里的 git push 什么时候执行？',
        options: ['无论构建成功失败都执行', '构建成功后才执行', '构建失败后才执行', '两条命令并行执行'],
        answer: 1,
        explain: '&& 表示前一条退出码为 0 才继续。分号才是无条件继续，|| 是失败才继续。部署脚本里这条区别决定你推上去的是能跑的代码，还是一堆半成品。'
      }
    ]
  },
  {
    id: 'troubleshoot',
    order: 27,
    track: 'efficiency',
    title: '报错排查手册',
    subtitle: '把「跑不起来」拆成四个固定动作，照着做就能定位到那一行',
    minutes: 16,
    level: '基础',
    goal: [
      '用四步法把一团报错缩小到一个原因',
      '认出九种最常见的报错并知道往哪查',
      '分清是命令没装、权限不够还是程序自己崩了',
      '搜报错时知道该删掉哪些噪声'
    ],
    sections: [
      {
        type: 'steps',
        title: '排错四步法：顺序不要跳',
        items: [
          {
            title: '读完整错误，别只看最后一行',
            html: '<p>先判断属于哪一类：<strong>命令打不到</strong>（command not found）、<strong>权限或路径不对</strong>（permission denied、no such file）、<strong>程序自己崩了</strong>（stack trace、traceback）、<strong>外部依赖不配合</strong>（端口被占、CORS、版本冲突）。类别不同，往下钻的方向完全不同。</p>'
          },
          {
            title: '定位到第一处，别修最后一个症状',
            html: '<p>一次构建能滚出三百行，真正的错误通常只有一行，后面全是连带错误（cascading error）。从下往上找第一个出现 <code>error</code> 的位置，或者直接搜索 <code>error:</code> 的第一次出现。修第一个，不要修最后一个。</p>'
          },
          {
            title: '最小复现，让问题稳定出现',
            html: '<p>新建一个空目录，只装那一个包、只留五行代码，把它复现出来。能稳定复现，你才有一条验证「修好了没有」的路；复现不出来就动手改，改完也不知道是自己修对了还是巧合。</p>'
          },
          {
            title: '带着错误原文搜索',
            html: '<p>复制之前先做减法：删掉路径里的用户名、版本号、时间戳、临时目录名，只留通用部分，再加技术栈关键词。比如 <code>ENOENT .env.local vite</code>。错误码优先搜官方文档，加 <code>site:github.com/issues</code> 能直接看到别人报过的同一个 bug。</p>'
          }
        ]
      },
      {
        type: 'table',
        title: '九种高频报错速查',
        head: ['报错原文', '常见原因', '解决'],
        rows: [
          ['zsh: command not found: xxx', '没装、没进 PATH，或装在另一个 shell 的配置里', 'type -a 名字 看有没有；echo $PATH 看路径；装完重开终端'],
          ['Permission denied', '文件没有执行位，或当前用户对该目录没有写权限', 'chmod +x 脚本；写权限问题换目录或改所有者，别习惯性 sudo'],
          ['EADDRINUSE: address already in use :::3000', '端口被占，多半是上一次的服务没关干净', 'lsof -nP -iTCP:3000 -sTCP:LISTEN 找 PID，kill -15；或换端口'],
          ['Cannot find module ./utils/date', '依赖没装、名字写错，或路径大小写不对', '带点的是自己的文件，查路径与大小写；不带点的是包，npm install'],
          ['npm ERR! code ERESOLVE', '两个包的 peer 依赖版本要求互相冲突', 'npm ls 包名 看谁在要求；升降版本对齐，别长期靠 --legacy-peer-deps'],
          ['! [rejected] main -> main (fetch first)', '远程有你本地没有的提交，推送会被拒', 'git pull --rebase origin main 再 push；共享分支不要强推'],
          ['blocked by CORS policy', '浏览器跨源，服务端没回 Access-Control-Allow-Origin', '服务端加响应头，或开发时用代理；curl 能通就是浏览器策略'],
          ['EACCES: permission denied, mkdir /usr/local/lib', '全局安装目录属于 root，当前用户写不进去', '给 npm 换自己的 prefix，或改用 nvm；不要形成 sudo 习惯'],
          ['中文变成 ??? 或 锟斤拷', '文件按 GBK 存、按 UTF-8 读，或反过来', 'file -I 看真实编码，iconv 转成 UTF-8；编辑器统一存 UTF-8']
        ]
      },
      {
        type: 'terminal',
        title: 'command not found：先分清没装还是没进 PATH',
        command: 'yarn -v\ntype -a yarn\necho $PATH',
        output: 'zsh: command not found: yarn\nyarn: aliased to echo \'use pnpm instead\'\n/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        note: 'type -a 会列出所有同名命令，包括别名和函数：有时候不是没装，而是被一个别名挡住了。echo $PATH 用冒号分隔，顺序就是查找顺序，前一个目录里的同名程序会赢。装了 node 却找不到 npm 时，先怀疑版本管理器（nvm、fnm、volta）没在当前窗口初始化。'
      },
      {
        type: 'terminal',
        title: '端口被占用：EADDRINUSE',
        command: 'node server.js',
        output: 'node:events:497\n      throw er; // Unhandled \'error\' event\n      ^\n\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1740:16)\n    at listenInCluster (node:net:1798:12)\n    at Server.listen (node:net:1881:7)\n    at Module._compile (node:internal/modules/cjs/loader:1546:14)\n  errno: -48,\n  code: EADDRINUSE,\n  syscall: listen,\n  address: ::,\n  port: 3000\n\nNode.js v20.11.1',
        note: '下一步是找占用者：lsof -nP -iTCP:3000 -sTCP:LISTEN 给出 PID，kill -15 PID 是请它自己退出，能保存数据、能关连接；kill -9 是直接杀，进程来不及清理，可能留下半写状态和临时文件。Windows 用 netstat -ano | findstr :3000 拿 PID，再 taskkill /PID 12345 /F。'
      },
      {
        type: 'terminal',
        title: 'Cannot find module：带点和带点的是两件事',
        command: 'node index.js',
        output: 'node:internal/modules/cjs/loader:1147\n  throw err;\n  ^\n\nError: Cannot find module \'./utils/date\'\nRequire stack:\n- /Users/you/app/index.js\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)\n  code: \'MODULE_NOT_FOUND\',\n  requireStack: [ \'/Users/you/app/index.js\' ]',
        note: '带 ./ 或 ../ 的是你自己的文件，带裸名字的（express、lodash）是 npm 包，两条修法完全不同。自己文件最常见三个原因：漏了扩展名、文件名大小写不一致（macOS 默认不区分大小写，Linux 服务器区分，本地能跑上线就崩）、文件其实在上一层目录。ESM 项目里必须写全 .js 后缀，否则报 ERR_MODULE_NOT_FOUND。'
      },
      {
        type: 'terminal',
        title: 'npm ERR! ERESOLVE：依赖树打架',
        command: 'npm install react-dom@18',
        output: 'npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR!\nnpm ERR! While resolving: app@0.1.0\nnpm ERR! Found: react@17.0.2\nnpm ERR! node_modules/react\nnpm ERR!   react\"^17.0.2\" from the root project\nnpm ERR!\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer react\"^18.2.0\" from react-dom@18.3.1\nnpm ERR! node_modules/react-dom\nnpm ERR!   react-dom\"18\" from the root project',
        note: '这几段把因果写得很清楚：项目里装的是 react 17，react-dom 18 要求 peer 是 18。npm ls react 能看到谁把它锁在 17。--legacy-peer-deps 能让安装过去，但装出来的是 npm 认为不成立的依赖树，之后运行时报的错离真正原因更远。'
      },
      {
        type: 'terminal',
        title: 'git push 被拒：(fetch first)',
        command: 'git push origin main',
        output: 'To github.com:you/app.git\n ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs to \'github.com:you/app.git\'\nhint: Updates were rejected because the remote contains work that you do\nhint: not have locally. This is usually caused by another repository pushing\nhint: to the same ref. You may want to first integrate the remote changes\nhint: (e.g., \'git pull ...\') before pushing again.',
        note: '照 hint 做，但要选对合并方式：git pull --rebase origin main 把你本地的提交接在远程之后，历史是一条直线；直接 git pull 会多出一个合并提交。git push --force 会覆盖远程，别人的提交直接消失——共享分支上不要用；非用不可时用 --force-with-lease，它在远程被人改动后会拒绝推送。'
      },
      {
        type: 'text',
        title: 'Permission denied 分两种，解法相反',
        html: '<p>看报错里的路径，先分清是<strong>执行</strong>还是<strong>写入</strong>。跑自己的脚本报 <code>zsh: permission denied: ./deploy.sh</code>，是文件没有执行位，<code>chmod +x deploy.sh</code> 立刻解决。给 chmod 加 <code>-R 777</code> 会让目录里所有文件对所有人可读可写可执行，事后没人能查清是谁改的，别拿它求省事。</p><p>写系统目录报 <code>EACCES: permission denied, open /usr/local/lib/node_modules</code>，说明全局目录属于 root。正确做法是给 npm 换一个自己的前缀（<code>npm config set prefix ~/.npm-global</code>），而不是凡事 sudo——用 sudo 装出来的文件，以后每次升级都要 sudo。'
      },
      {
        type: 'text',
        title: 'CORS 不是服务器拒绝了你',
        html: '<p>控制台原文：<code>Access to fetch at http://localhost:5173/api from origin ... has been blocked by CORS policy: No Access-Control-Allow-Origin header is present on the requested resource</code>。这是<strong>浏览器</strong>的策略（同源策略与 CORS），服务器其实回了数据。</p><p>最直接的证据：用 <code>curl</code> 请求同一个地址能拿到 JSON，说明接口本身是通的。两条正路——服务端加 <code>Access-Control-Allow-Origin</code> 响应头（带 Cookie 时还要 <code>Allow-Credentials</code>，且不能用通配符），或者开发时用代理把请求变成同源（Vite 的 <code>server.proxy</code>）。关掉浏览器安全检查只是把问题藏起来，上线照样炸。'
      },
      {
        type: 'text',
        title: '乱码：先确认文件到底是什么编码',
        html: '<p>症状：本该显示中文的地方出现 <code>锟斤拷</code>、<code>????</code>、<code>Ã¤Â¸Â­</code>，或者 JSON 第一行解析失败但肉眼看不出问题（那是 BOM，文件开头三个看不见的字节）。</p><p>先查真相：macOS 用 <code>file -I 文件名</code>，Linux 用 <code>file -i 文件名</code>，输出里的 <code>charset=utf-8</code> 才是结论，别靠编辑器猜。GBK 存的文件按 UTF-8 读就是乱码的根源，<code>iconv -f GBK -t UTF-8 old.txt &gt; new.txt</code> 转换，原文件留着比对。Windows 的 cmd 默认代码页常是 GBK，用 <code>chcp 65001</code> 切到 UTF-8 能解决终端里的显示问题。'
      },
      {
        type: 'tip',
        title: '搜报错前先做减法',
        html: '<p>原样复制 <code>Error: ENOENT: no such file or directory, open /Users/xiaopi/app/.env.local</code> 去搜，命中的是别人机器上的路径，几乎没有结果。删掉用户名、绝对路径、版本号、时间戳，留下 <code>ENOENT .env.local vite</code>，命中率立刻不一样。</p><p>再加技术栈和场景词，比如 <code>docker compose</code>、<code>next build</code>。看答案先看日期和版本：三年前的解法在新版本上经常失效，尤其是构建工具和 Node 相关的报错。'
      },
      {
        type: 'warn',
        title: '四个会把小问题放大成大问题的动作',
        html: '<p><strong>sudo 一切</strong>：sudo 只是跳过权限检查，产生的 root 文件和「以后次次 sudo」会陪着你。</p><p><strong>报错先 rm -rf node_modules</strong>：依赖冲突多半是版本问题，重装只解决一半，还损失了现场。</p><p><strong>直接 kill -9</strong>：进程来不及释放端口和临时文件，有时让「端口被占用」更严重。先 -15，等两秒还没退再 -9。</p><p><strong>把 --force 当解法</strong>：<code>git push --force</code> 会盖掉别人的提交，<code>npm audit fix --force</code> 会跨大版本升级依赖，两者都能把能跑的东西修成跑不起来的。</p>'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '故意造一个「端口被占用」，然后用 lsof 找出占用者并正确结束它，把四步法完整走一遍。',
      items: [
        { text: '在一个窗口起一个占住 8000 端口的服务', cmd: 'python3 -m http.server 8000' },
        { text: '在另一个窗口起同一个端口，读完整个报错', cmd: 'python3 -m http.server 8000' },
        { text: '找出占用 8000 的进程号', cmd: 'lsof -nP -iTCP:8000 -sTCP:LISTEN' },
        { text: '用 kill -15 结束它，再确认端口空出来了', cmd: 'kill -15 进程号' }
      ],
      done: '能说出占用端口的进程是谁、为什么 -15 比 -9 更安全，这课就到位了。'
    },
    quiz: [
      {
        q: '一次构建滚出三百行报错，你应该从哪里读起？',
        options: ['最后一行的最后一个词', '最上面第一处 error，再往下看连带错误', '中间的任意一行', '清空日志重新跑一次'],
        answer: 1,
        explain: '构建和运行时报错大多是连锁的，第一处才是根因，后面的多半是被它带出来的次生错误。从第一条 error 开始，能省掉一路追症状的时间。'
      },
      {
        q: 'lsof -nP -iTCP:3000 -sTCP:LISTEN 里的 -nP 有什么用？',
        options: ['只显示 node 进程', '不解析主机名和端口名，直接显示数字', '强制结束占用端口的进程', '列出所有 TCP 连接'],
        answer: 1,
        explain: 'n 禁止把 IP 反查成域名，P 禁止把端口 3000 翻成服务名。两个都关掉，输出更干净也更快，端口号一定以数字出现，方便你直接抄进下一条命令。'
      },
      {
        q: 'npm 报 ERESOLVE，加上 --legacy-peer-deps 装上了，代价是什么？',
        options: ['依赖体积变大', '跳过 peer 依赖检查，装出的依赖树可能互不兼容', '项目不能再提交到 git', '以后不能再执行 npm install'],
        answer: 1,
        explain: '这个参数让 npm 忽略 peer 冲突继续安装，装是装上了，运行时仍可能因为版本不匹配崩掉，而且报错位置离真正原因更远。先对齐版本才是解法。'
      }
    ]
  },
  {
    id: 'security-habits',
    order: 28,
    track: 'efficiency',
    title: '安全习惯：别把钥匙贴在门上',
    subtitle: '密码、密钥、权限、备份，四件必须在出事之前做完的事',
    minutes: 12,
    level: '进阶',
    goal: [
      '用密码管理器做到一站一个随机密码',
      '让 .env 与密钥永远进不了仓库',
      '泄露之后按轮换、清历史、复查的顺序处理',
      '知道 npm audit 和 3-2-1 备份怎么用'
    ],
    sections: [
      {
        type: 'text',
        title: '先想清楚谁在敲门',
        html: '<p>大多数「被盗」不是有人盯上你，而是<strong>自动化扫描</strong>：爬公开仓库找密钥的机器人、拿拖库（data breach）数据去撞库（credential stuffing）的脚本、扫 22 和 3389 端口的僵尸网络。它们不挑人，只看有没有把钥匙贴在门上。</p><p>习惯比工具重要，但有几件工具能把门槛拉到普通攻击之上：密码管理器、两步验证、把密钥挡在仓库外、能恢复的备份。顺序也有讲究——先做密码管理器和两步验证，收益最大；密钥和备份是下一次项目开工前该准备好的。</p>'
      },
      {
        type: 'text',
        title: '密码管理器：你只需要记住一个密码',
        html: '<p>密码管理器（password manager）把账号密码存进一个加密的库，你只需要记住一个主密码。常见的有 1Password、Bitwarden、KeePassXC；浏览器自带的保存也比「一个密码走天下」强得多。</p><p>它解决的核心问题不是「记不住」，而是<strong>让每个站点都有独立的随机密码</strong>。一个站被拖库，撞库脚本会拿那组账号密码去试你所有账号；一站一密，损失就停在那一个站。主密码要长、不复用、不写进任何文档，最好是一句只有你知道的短语，再加两个数字和符号。</p>'
      },
      {
        type: 'text',
        title: '两步验证：第二把钥匙单独放',
        html: '<p>两步验证（two-factor authentication，2FA）是在密码之外再要一个动态码。优先级从高到低：<strong>硬件密钥（security key，如 YubiKey）→ 认证器 App 的 TOTP 动态码 → 短信验证码</strong>。短信能被拦截和补卡，当兜底用，别当首选。</p><p>开启 2FA 时网站会给你一组恢复码（recovery codes），那是唯一的后路：手机丢了、App 卸载了，靠它进账号。打印出来或存进密码管理器的安全笔记，别只存在那部手机上。先开这四个：邮箱、GitHub、云服务商、域名注册商——域名丢了，站点就是别人的。'
      },
      {
        type: 'code',
        title: '.gitignore 示例：把钥匙挡在仓库外',
        lang: 'text',
        text: `# .gitignore —— 放在仓库根目录

# 1. 环境变量与密钥
.env
.env.local
.env.*.local
*.pem
*.key
id_rsa
id_ed25519

# 2. 但示例文件必须提交，让同事知道要配哪些键
!.env.example

# 3. 依赖与构建产物
node_modules/
dist/
.next/
coverage/

# 4. 系统与编辑器杂物
.DS_Store
Thumbs.db
*.log`,
        note: '注意第 2 条：.env.example 里只写键名和注释，不写真实值。提交它，团队才知道要配哪些变量；少了这条，别人拿到仓库只能靠猜。.gitignore 对已经被跟踪的文件无效，这一点后面还会踩到。'
      },
      {
        type: 'terminal',
        title: '先查一遍：密钥有没有已经进过仓库',
        command: 'git ls-files | grep -E "\\.env|\\.pem|id_rsa"\ngit log --all --oneline -- .env',
        output: '.env.local\na1b2c3d fix: 加上本地配置',
        note: 'git ls-files 列出被跟踪的文件，出现在这里就说明已经提交过；git log --all -- .env 会翻遍所有分支的历史。只删工作区的文件没有用，仓库里那份仍然在，别人 clone 下来就能看到。'
      },
      {
        type: 'steps',
        title: '密钥已经泄露：按这个顺序处理',
        items: [
          {
            title: '第一件事是轮换，不是删除',
            html: '<p>去服务商后台重新生成 API key、改数据库密码、撤销 token，然后更新到部署环境。删掉 .env 而留着旧密钥，等于把钥匙从门上拿下来放进抽屉。</p>'
          },
          {
            title: '确认这把钥匙能干什么',
            html: '<p>看密钥的权限范围：对象存储的 key 可能能读全桶数据，某个搜索服务的 key 只是花点钱。翻访问日志和账单，看有没有异常调用，再决定要不要通知同事和用户。</p>'
          },
          {
            title: '清理 git 历史',
            html: '<p>用 <code>git filter-repo --path .env --invert-paths</code>（先装 git-filter-repo）或 BFG 把文件从所有提交里删掉。这一步<strong>会重写历史</strong>，所有提交的哈希都会变。</p>'
          },
          {
            title: '强推，并让所有人重新 clone',
            html: '<p><code>git push --force --all</code> 之后，同事本地的旧克隆里还留着旧提交，下次 push 会把密钥带回来。必须通知他们重新拉取或重新克隆；已经 fork 的仓库和 PR 里的副本，平台方不一定清得掉。</p>'
          }
        ]
      },
      {
        type: 'terminal',
        title: 'npm audit：看清依赖里已经公开的漏洞',
        command: 'npm audit --omit=dev\nnpm audit fix',
        output: '# npm audit report\n\naxios  <1.6.2\nSeverity: moderate\nServer-Side Request Forgery in axios\nfix available via npm audit fix\n1 moderate severity vulnerability\n\nTo address issues that do not require attention, run:\n  npm audit fix',
        note: 'npm audit 读的是依赖树里的已知漏洞公告（advisory）。--omit=dev 只看生产依赖，报告更接近真实风险。npm audit fix 只在小版本范围内升级；npm audit fix --force 会跨大版本，可能直接改坏项目，执行前先提交代码。'
      },
      {
        type: 'table',
        title: '最小权限：给每样东西刚好够用的权限',
        head: ['对象', '常见错误', '该怎么做'],
        rows: [
          ['数据库账号', '应用和人都用 root 连接', '应用用只有增删改查权限的账号，迁移用另一个账号'],
          ['SSH 登录', 'root 密码登录，22 端口对全网开放', '只允许密钥登录、禁用密码，按需限制来源 IP'],
          ['文件权限', 'chmod -R 777 求省事', '目录 755、文件 644，只给必须写的目录写权限'],
          ['CI 的 token', '直接用个人全权限 token', '用仓库级的只读或只写 token，按流水线需要分配'],
          ['云账号', '所有人共用一把长期 access key', '一人一个子账号并开 MFA，能用量身角色就不用长期密钥']
        ]
      },
      {
        type: 'text',
        title: '公共网络与代理：中间有人听得见',
        html: '<p>咖啡厅和机场的 Wi-Fi 上，同网段的人能做 ARP 欺骗（ARP spoofing）和伪造热点（evil twin），把你的流量引到他的机器。判断标准很简单：<strong>地址栏有没有锁、域名对不对</strong>。HTTPS 在证书正确时内容仍加密，但对方能看到你访问了哪些域名。</p><p>代理（proxy）同理：<code>http_proxy</code>、<code>https_proxy</code> 一旦指向别人的服务器，明文流量全在对方手里，返回的内容也可能被改。用自己可控的代理，别随手装来路不明的加速器。要在不信任的网络里工作，用自己搭的 VPN 或 SSH 隧道：<code>ssh -D 1080 用户名@服务器</code> 在本机开一个 socks 代理。'
      },
      {
        type: 'text',
        title: '备份：3-2-1 原则与「恢复一次」',
        html: '<p>3-2-1 原则：<strong>3 份数据、2 种介质、1 份异地</strong>。本机一份、移动硬盘一份、云上一份，任何一份坏掉都还剩两份。异地那份专门对付火灾、偷盗、勒索软件这类会同时毁掉本机和本地硬盘的情况。</p><p>关键不是备份，是<strong>验证恢复</strong>。没试过恢复的备份不算备份：每季度挑一个文件，从备份里真的还原出来打开看看。工具用 restic、borg 或 Time Machine 都行，但记得加密——备份盘丢了，里面的数据不该被别人直接读走。'
      },
      {
        type: 'tip',
        title: '密钥只从环境变量进程序',
        html: '<p>代码里不要出现字面量的密钥：<code>const key = "sk-..."</code> 一旦提交就永远在历史里。统一走环境变量——Node 用 <code>process.env.API_KEY</code> 配合 dotenv 读 <code>.env</code>，Python 用 <code>os.environ</code>，前端构建时用平台注入的变量（注意：打进前端包的变量等于公开）。</p><p>线上不要把 .env 传上去，用平台的环境变量面板或密钥管理服务。同一份代码在本地和线上都能跑，而密钥只存在于运行环境里。'
      },
      {
        type: 'warn',
        title: '删掉 .env 不等于事情结束',
        html: '<p>最常见的错误处理：发现泄露 → 往 .gitignore 加一行 → 提交 → 以为搞定。密钥仍然在历史提交里，任何人 clone 下来 <code>git log -p</code> 就能看到，扫描机器人几分钟内就能用掉它。</p><p>第二个错误：只清理了当前分支。远端分支、标签、fork、PR 副本都要单独确认。所以顺序永远是<strong>先轮换密钥，再清理历史</strong>——清理失败也不至于失守。'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '在你自己的一个真实仓库里补上 .gitignore，然后用 git 查一遍历史，看有没有 .env 或私钥文件进去过。',
      items: [
        { text: '列出被跟踪的文件，找有没有 .env 或私钥', cmd: 'git ls-files | grep -E "\\.env|\\.pem|id_rsa"' },
        { text: '翻历史，看 .env 有没有出现在某次提交里', cmd: 'git log --all --oneline -- .env' },
        { text: '把 .env、*.pem 写进 .gitignore 并提交这次改动', cmd: 'git add .gitignore && git commit -m "chore: 忽略密钥文件"' }
      ],
      done: '两条查询都没有输出，且 .gitignore 里已经包含 .env，这一课就做完了。'
    },
    quiz: [
      {
        q: '.env 已经被提交过，这时把它写进 .gitignore 会发生什么？',
        options: ['文件自动从历史里消失', '不再跟踪新改动，但历史里仍有旧内容', '会阻止其他人 clone 仓库', '需要先手工删掉本地文件'],
        answer: 1,
        explain: '.gitignore 只影响还没被跟踪的文件。已提交的文件会继续被 git 管理，历史里每一次提交都保留着当时的密钥，必须重写历史才清得掉。'
      },
      {
        q: '发现线上用的 API key 泄露，第一步该做什么？',
        options: ['从最新提交里删掉那行代码', '去服务商后台轮换密钥让它作废', '把仓库改成私有仓库', '先通知所有同事'],
        answer: 1,
        explain: '改私有或删代码都不能让已经流出的密钥失效，扫描机器人可能在几分钟内就用掉它。先轮换让旧密钥作废，后面的清理和通知才有意义。'
      },
      {
        q: '3-2-1 备份原则里的那个 1 指什么？',
        options: ['每天备份一次', '至少一份放在异地', '只保留一份备份', '每年检查一次'],
        answer: 1,
        explain: '三份数据、两种介质、一份异地。异地那份用来对付火灾、偷盗、勒索软件这类会同时毁掉本机和本地硬盘的情况，它本身还应该是加密的。'
      }
    ]
  },
  {
    id: 'roadmap',
    order: 29,
    track: 'efficiency',
    title: '学习路线图与下一步',
    subtitle: '把这一站学过的东西接成一条能自己往前走的线',
    minutes: 10,
    level: '进阶',
    goal: [
      '说清从终端到部署的七个阶段',
      '给自己排出每天二十分钟的练法',
      '用三个小项目检验学到的工具',
      '遇到新工具时知道先去哪里查'
    ],
    sections: [
      {
        type: 'text',
        title: '一条线，七个站',
        html: '<p>这些工具不是七门独立的课，是同一条流水线上的七个环节：你在<strong>终端</strong>里敲命令，用 <strong>Git</strong> 把改动存成能回退的历史，在<strong>编辑器</strong>里写代码，用<strong>一门语言</strong>把想法写成程序，用<strong>包管理器</strong>借别人的轮子，靠<strong>调试</strong>弄明白它为什么不按你想的跑，最后<strong>部署</strong>出去让别人真的用上。</p><p>顺序有意义：后一步都在用前一步。跳过终端直接学框架，会在「命令跑不起来」上卡住；不学 Git 就写项目，会在改坏之后没法回头。卡住的时候往回退一站，通常比硬着头皮往前冲快。'
      },
      {
        type: 'table',
        title: '全景：七个阶段与判断标准',
        head: ['阶段', '要学的东西', '学会的标志', '大概用时'],
        rows: [
          ['终端', '路径、管道、权限、进程', '不看教程能起服务、查端口、读日志', '1-2 周'],
          ['Git', 'add、commit、branch、merge、rebase', '敢开分支，能读懂 git log --graph', '2-3 周'],
          ['编辑器', '快捷键、搜索、多光标、插件', '全程不碰鼠标改完一个文件', '1 周起步，长期打磨'],
          ['一门语言', '语法、数据结构、错误处理', '能读写文件、发 HTTP 请求、处理异常', '1-2 个月'],
          ['包管理', '依赖、锁文件、版本范围', '能解释 package-lock 为什么要提交', '1 周'],
          ['调试', '断点、日志、栈追踪、最小复现', '能从报错定位到具体那一行', '2-3 周'],
          ['部署', '构建、环境变量、域名、日志', '把自己的项目挂上公网并看到访问日志', '2 周']
        ]
      },
      {
        type: 'text',
        title: '每天二十分钟，比周末五小时管用',
        html: '<p>技能是肌肉记忆，靠频率而不是靠单次时长。每天二十分钟连做三周，比周末一次性看五小时教程有效得多——后者看完就忘，因为手没动过。</p><p>二十分钟切成四段：前五分钟复述昨天做了什么，中间十分钟只做一件具体的事，接着三分钟读官方文档里相关的那一节，最后两分钟写下今天卡在哪里、明天第一步做什么。四段时间到点就停，不用延长。'
      },
      {
        type: 'steps',
        title: '二十分钟怎么排',
        items: [
          { title: '复述昨天（5 分钟）', html: '<p>合上笔记，用自己的话讲一遍昨天那条命令做了什么。讲不出来的地方就是没学会的地方，今天先补它，别往前赶。</p>' },
          { title: '只做一件事（10 分钟）', html: '<p>这件事要小到当天能做完：把别名写进配置文件并验证生效、给仓库开一个分支并合并、用断点看一个变量的值。做不完就砍小，不要延长。</p>' },
          { title: '读一小节文档（3 分钟）', html: '<p>读你刚用过的那条命令的 man 页，或者官方文档里对应的那一节。手刚动过，这时候读文档最容易读进去，也最容易记住边界情况。</p>' },
          { title: '记一行（2 分钟）', html: '<p>写下「今天练了什么、卡在哪、明天第一步」。三行就够。一周后回看，你会发现卡住的地方在重复，那就是下一个要专门练的点。</p>' }
        ]
      },
      {
        type: 'text',
        title: '项目驱动：先有一个想做出来的东西',
        html: '<p>跟着教程敲，你永远走在别人铺好的路上；有具体目标时，卡住的地方才是你真正要学的。判断标准很朴素：<strong>这个东西能给别人用吗</strong>。能跑在自己机器上不算，能让别人打开一个网址用上才算。</p><p>项目别选大的。一个人两周做不完的项目，通常会停在「目录搭好了，写了两天」。选一个能在一周内出可运行版本、之后再慢慢加功能的东西，先让它能用，再让它好用。'
      },
      {
        type: 'table',
        title: '三个练手项目，难度递增',
        head: ['项目', '会用到', '做完的标志'],
        rows: [
          ['个人书签页', 'HTML/CSS、Git、静态部署', '有一个公开网址，能增删书签，改动有提交历史'],
          ['命令行小工具', '终端、文件读写、包管理', '能通过 npm 或 pip 装上，--help 能说清用法'],
          ['带数据库的待办', '后端、数据库、环境变量、部署', '线上能注册登录，服务重启后数据还在']
        ]
      },
      {
        type: 'text',
        title: '查文档的顺序：man、--help、官方文档、搜索',
        html: '<p>顺序别反。先 <code>man 命令</code> 看本地这一版的确切参数，再 <code>命令 --help</code> 看常用示例，然后去官方文档读概念章节，最后才搜索。前三个是程序自带的说明，和你手上的版本完全对得上；搜索结果是别人环境的二手信息。</p><p>搜索时把报错去噪：删掉用户名、绝对路径、版本号、时间戳，只留通用部分，再加上技术栈关键词。加 <code>site:github.com/issues</code> 能直接看到别人报过的同一个 bug，顺手看一眼答案的日期。'
      },
      {
        type: 'terminal',
        title: '三个查用法的地方',
        command: 'man git-rebase\ngit rebase --help\ntldr git rebase',
        output: 'GIT-REBASE(1)                       Git Manual                      GIT-REBASE(1)\n\nNAME\n       git-rebase - Reapply commits on top of another base tip\n\nSYNOPSIS\n       git rebase [-i | --interactive] [options] [--exec cmd]',
        note: 'man 页里按 / 输入关键词搜索，n 跳到下一个匹配，q 退出。--help 一般打开同一个 man 页或网页版文档。tldr 是社区维护的「只给常用例子」的版本，要单独安装：brew install tldr 或 npm install -g tldr。'
      },
      {
        type: 'shortcuts',
        title: '查文档时的常用键',
        items: [
          { action: '页内搜索', mac: ['⌘', 'F'], win: ['Ctrl', 'F'] },
          { action: 'man 页里搜索', mac: ['/'], win: ['/'], note: '输入关键词回车，n 下一个，N 上一个，q 退出' },
          { action: '跳到页面顶部或底部', mac: ['⌘', '↑'], win: ['Ctrl', 'Home'], note: 'Windows 对应到底部是 Ctrl+End' },
          { action: '终端新开一个标签页', mac: ['⌘', 'T'], win: ['Ctrl', 'Shift', 'T'] },
          { action: '在编辑器里全局搜索', mac: ['⌘', '⇧', 'F'], win: ['Ctrl', 'Shift', 'F'], note: '按文件名找用 ⌘P / Ctrl+P，比翻目录快' }
        ]
      },
      {
        type: 'tip',
        title: '卡住超过二十分钟，换四个动作',
        html: '<p>先把问题写成一句话：<strong>我想做什么、我做了什么、报了什么错、我期望什么</strong>。写的过程经常自己就把问题解决了。</p><p>然后依次试：缩到最小复现；翻官方文档里相关那一节；搜去噪后的报错；最后才问人，问的时候把上面那句话和完整报错一起贴上。只发一句「跑不起来」，能得到的回答也只有「再试试」。'
      },
      {
        type: 'warn',
        title: '教程地狱：收藏三十个，跑过零个',
        html: '<p>看视频时的「懂了」是错觉，你的大脑在跟着讲者的逻辑走，不是自己在解决问题。收藏得越多，越容易产生「我在学习」的感觉，手上却什么都没留下。</p><p>解法是把教程当参考手册而不是课程表：先定一个要做的东西，卡住了再去查对应章节。还有一条：别在学新工具时同时换三个变量——新语言加新框架加新数据库一起上，报错时你分不清是谁的问题。'
      },
      {
        type: 'text',
        title: '把整站串起来',
        html: '<p>回头看这一站：终端让你能指挥机器，Git 让你敢改东西，编辑器让手跟得上想法，语言让你把想法写成程序，包管理让你不必重造轮子，调试让你出错时不慌，部署让这些东西真的被别人用上。效率那一课教你怎么少敲、怎么找错，安全习惯教你别把辛苦搭起来的东西一次送掉。</p><p>接下来不用等谁来教。<strong>挑上面三个项目里的第一个，今天晚上花二十分钟，把目录建起来、git init、写第一行。</strong>会用工具的人不是学完所有课才开始做东西的人，是一边做一边查的人。'
      }
    ],
    exercise: {
      title: '动手练一练',
      brief: '给自己排一周的表：每天二十分钟，写清哪天做什么，并选一个练手项目把仓库建好。',
      items: [
        { text: '选一个项目，建目录并初始化仓库', cmd: 'mkdir my-bookmarks && cd my-bookmarks && git init' },
        { text: '写下这一周的五个小目标，每个都要能在二十分钟内做完' },
        { text: '做第一个目标并提交', cmd: 'git add -A && git commit -m "chore: 初始化项目"' }
      ],
      done: '仓库里有一条提交，纸上有五天的具体安排，两个都在就算完成。'
    },
    quiz: [
      {
        q: '为什么每天二十分钟比周末一次五小时更容易学会？',
        options: ['大脑每天只能吸收二十分钟', '技能靠高频重复形成肌肉记忆，间隔复习更牢', '周末的时间不属于你', '长时间学习会伤眼睛'],
        answer: 1,
        explain: '技能靠重复与间隔巩固，每天动手会让记忆在遗忘再回忆的循环里变牢。一次长时间输入缺少动手和复习，离开教程就忘，也很难发现自己哪一步没懂。'
      },
      {
        q: '想查一个新命令的参数，第一步应该看哪里？',
        options: ['搜索前几篇博客', 'man 命令或 命令 --help', '直接去问同事', '翻程序的源码'],
        answer: 1,
        explain: 'man 和 --help 是本地这一版程序自带的说明，参数和版本完全对得上。博客与搜索结果是别人环境里的二手信息，容易过时或版本不一致。'
      },
      {
        q: '判断一个练手项目「做完了」，最靠谱的标准是哪个？',
        options: ['代码行数够多', '本地能跑起来', '别人能通过一个网址用上它', '用到了所有学过的工具'],
        answer: 2,
        explain: '能部署出去被别人使用，意味着构建、环境变量、域名、日志这些真实环节都走通了。本地能跑只证明一半，代码行数和工具数量跟做没做完没有关系。'
      }
    ]
  }
);
