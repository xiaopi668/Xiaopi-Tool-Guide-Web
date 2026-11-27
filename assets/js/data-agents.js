window.PS = window.PS || {};
window.PS.lessons = window.PS.lessons || [];
window.PS.lessons.push(
  {
    id: 'agent-intro',
    order: 30,
    track: 'agents',
    title: '什么是 AI 编程助手',
    subtitle: '补全、聊天、agent 是三件事，先分清再上手',
    minutes: 10,
    level: '入门',
    goal: [
      '分清补全、聊天和 agent 的区别',
      '理解 agent 的「读-改-跑-看」循环',
      '知道它在哪里会出错、需要你做什么'
    ],
    sections: [
      {
        type: 'text',
        title: '为什么是现在',
        html: "<p>过去两年，AI 从「补全下一行」变成了「自己动手」：读仓库、改文件、跑测试、看报错再修正。这带来一个直接后果——<strong>写代码的门槛在下降，判断结果的门槛在上升</strong>。</p><p>你不再需要背下每条命令，但需要能说清目标、看懂 diff、发现它在哪一步跑偏。这六节课讲的就是后者：先认识 agent 怎么工作，再上手三件工具，最后学会给它划边界。</p>"
      },
      {
        type: 'table',
        title: '三件工具怎么选',
        head: ["工具","形态","上手方式","适合"],
        rows: [["Claude Code","终端 / IDE / 桌面","安装脚本，登录 Claude 订阅或 Console","深度改代码、长会话协作"],["Codex CLI","终端","脚本 / npm / brew，登录 ChatGPT 或 API key","脚本化任务、exec 批处理"],["dsh","桌面应用","下载安装，选工作区开会话","本地项目、技能与多代理"],["OpenCode 等","终端 / 桌面","npm 或安装脚本，自接模型","想换模型或自建环境"]]
      },
      {
        type: 'text',
        title: '它不是更聪明的补全',
        html: `<p>很多人第一次用 AI 写代码，是在编辑器里让补全帮忙写下一行。那类工具只做一件事：根据上下文猜你接下来要敲什么，猜完就交给你。</p><p><strong>agent</strong> 是另一回事：它有自己的循环，能主动读文件、改代码、执行命令、读取输出，然后根据结果决定下一步。你给它一个目标，它自己拆步骤，中途不需要你一直盯着。</p>`
      },
      {
        type: 'table',
        title: '三种形态',
        head: ['形态', '输入', '能做什么', '适合'],
        rows: [
          ['补全', '光标附近的代码', '续写几行', '重复性代码、样板'],
          ['聊天', '一段提问', '解释、给建议、写片段', '问概念、查报错'],
          ['agent', '一个目标 + 仓库', '读文件、改文件、跑命令、看结果、再改', '多文件改动、调试、迁移']
        ]
      },
      {
        type: 'steps',
        title: 'agent 的一轮循环',
        items: [
          { title: '读', html: `<p>搜索仓库、打开相关文件，先建立上下文。这一步做得越充分，后面越少返工。</p>` },
          { title: '想', html: `<p>拆解任务，决定改哪几个文件、跑哪条命令。</p>` },
          { title: '改', html: `<p>写代码或执行命令。多数工具在这一步会请求你批准。</p>` },
          { title: '看', html: `<p>读取命令输出、测试结果、报错，再决定继续、修正还是停下问你。</p>` }
        ]
      },
      {
        type: 'text',
        title: '能力边界',
        html: `<p>agent 很强，但它<strong>看不到你没给它的东西</strong>：没打开的文件、没说的约束、线上的真实状态。它也会<strong>非常自信地做错</strong>——写出一段能跑但逻辑不对的代码，或者引用了不存在的接口。</p><p>所以你的角色不是「等它写完」，而是<strong>给上下文、定验收标准、审 diff</strong>。</p>`
      },
      {
        type: 'compare',
        title: '两种常见误解',
        left: { label: '误解', items: ['一句话就能得到能上线的功能', '它改完就不用看了', '越自动越好，权限全开'] },
        right: { label: '实际', items: ['目标越具体，产出越可用', 'diff 和测试必须自己过一遍', '权限按需放宽，默认最小'] },
        note: `<p>把它当成一个<strong>很快、但完全不了解你项目的新同事</strong>：能力不差，需要交代清楚，也需要 review。</p>`
      },
      {
        type: 'tip',
        title: '先让它读，别急着写',
        html: `<p>第一次进入一个仓库，最值钱的一句话是「先读一遍项目结构，告诉我它是怎么组织的，暂时不要改任何文件」。这句话能省掉后面大量「改错文件」的返工。</p>`
      },
      {
        type: 'warn',
        title: '它能执行命令，这既是能力也是风险',
        html: `<p>能跑 <code>npm test</code> 的工具，同样能跑 <code>rm -rf</code>。所以主流 agent 都带权限确认和沙箱。<strong>不要为了少点几次「允许」就把限制全关掉</strong>，尤其是在真实项目目录里。</p>`
      },
      {
        type: 'text',
        title: '常见产品',
        html: `<p>Claude Code、Codex CLI、dsh（DeepSeek Harness）、OpenCode、Cursor 等都属于这一类。它们的<strong>思想几乎一样</strong>：给目标、读上下文、改文件、跑命令、等你确认。学会一个，换到另一个主要只是记命令。</p>`
      },
      {
        type: 'code',
        title: '一条最小可用的任务描述',
        lang: 'text',
        text: '目标：首页在 4G 网络下首屏超过 3 秒，找出最慢的三个请求，先不要改代码。\n约束：只读 src/ 与 public/，不要安装依赖，不要动构建配置。\n验收：列出三个请求的耗时与原因，每条给出一个可验证的优化方向。',
        note: '`<p>目标 + 约束 + 验收。加上这三行，agent 才知道什么时候该停。</p>`'
      },
      {
        type: 'text',
        title: '怎么判断一个工具是不是 agent',
        html: '`<p>看三件事：能不能<strong>自己读多个文件</strong>、能不能<strong>执行命令并读取结果</strong>、能不能<strong>根据结果继续下一轮</strong>。只有第一条是「问答 + 检索」，三条都有才是 agent。</p><p>这也解释了为什么 agent 的教程里总在讲权限：它真的会动手。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '找一个你自己的仓库，让任意一个 agent 只读不改地介绍它，观察它先看哪些文件。',
      items: [
        { text: '打开 agent，进入项目目录' },
        { text: '输入：先读项目结构，说明入口、构建和测试怎么跑，不要修改文件' },
        { text: '对比它的描述和你自己的理解，看它漏了什么' }
      ],
      done: '能说出它读了哪些文件、哪一步理解错了。'
    },
    quiz: [
      { q: 'agent 和代码补全最本质的区别是什么？', options: ['模型更大', '它能自己执行命令并根据结果继续', '它支持更多语言', '它不需要联网'], answer: 1, explain: '补全只根据上下文续写；agent 有循环，能读文件、改代码、跑命令、看输出，再决定下一步。' },
      { q: '第一次进入一个陌生仓库，最该让 agent 先做什么？', options: ['直接重构', '先读结构并解释，暂不改动', '先跑测试', '先提交一次'], answer: 1, explain: '先建立上下文再动手，能显著减少改错文件、误解架构造成的返工。' },
      { q: '关于 agent 的输出，哪种态度是对的？', options: ['能跑就是对的', '它比我懂，直接合并', 'diff 和测试都要自己过一遍', '只要它说完成了就完成了'], answer: 2, explain: 'agent 会自信地写出逻辑错误或不存在的接口。diff 与测试是最后一道防线。' }
    ]
  },
  {
    id: 'claude-code',
    order: 31,
    track: 'agents',
    title: 'Claude Code 上手',
    subtitle: '安装、会话、CLAUDE.md 与权限',
    minutes: 14,
    level: '基础',
    goal: [
      '装好并登录 Claude Code',
      '用 -p、-c、-r 管理一次性与连续会话',
      '写一份能被 agent 用起来的 CLAUDE.md'
    ],
    sections: [
      {
        type: 'text',
        title: '安装',
        html: `<p>Claude Code 是 Anthropic 的终端 agent。官方推荐用安装脚本，不需要预先装 Node。</p>`
      },
      {
        type: 'terminal',
        title: '安装与检查',
        command: 'curl -fsSL https://claude.ai/install.sh | bash\nclaude --version',
        output: 'Claude Code installed successfully.\n2.1.118 (Claude Code)',
        note: `<p>Windows 用 PowerShell：<code>irm https://claude.ai/install.ps1 | iex</code>。装完用 <code>claude auth login</code> 登录，<code>claude auth status</code> 查看状态。</p>`
      },
      {
        type: 'terminal',
        title: '四种启动方式',
        command: 'claude\nclaude "解释这个项目的目录结构"\nclaude -p "列出所有 TODO"\nclaude -c\nclaude -r "auth-refactor" "继续上次的重构"',
        note: `<p><code>-p</code> 是一次性提问、输出后退出，适合脚本；<code>-c</code> 继续当前目录最近一次会话；<code>-r</code> 按会话名恢复。会话里的 <code>/resume</code> 也能切换历史会话。</p>`
      },
      {
        type: 'text',
        title: 'CLAUDE.md：项目给它的说明书',
        html: `<p>每次开始会话，Claude Code 都会读项目根目录的 <code>CLAUDE.md</code>（也支持 <code>AGENTS.md</code>）。这里应该写<strong>它猜不到、但每次都要用</strong>的信息：怎么构建、怎么跑测试、目录约定、禁区。</p>`
      },
      {
        type: 'code',
        title: 'CLAUDE.md 示例',
        lang: 'text',
        text: '# 项目说明\n\n## 常用命令\n- 安装依赖：pnpm install\n- 开发：pnpm dev（端口 5173）\n- 测试：pnpm test --run\n- 类型检查：pnpm typecheck\n\n## 约定\n- 组件放 src/components，一个文件一个组件\n- 不引入新的 UI 库，样式用现有 tokens\n- 提交信息用 Conventional Commits\n\n## 不要做\n- 不要修改 .env、package-lock.json\n- 不要动 legacy/ 目录\n- 不要执行数据库迁移',
        note: `<p>写得越具体，它越少问、越少猜。命令部分尤其重要：它需要知道「怎么验证自己改对了」。</p>`
      },
      {
        type: 'table',
        title: '.claude 目录里有什么',
        head: ['路径', '作用'],
        rows: [
          ['CLAUDE.md', '项目级长期指令，每次会话自动加载'],
          ['.claude/settings.json', '权限规则、环境变量、模型设置'],
          ['.claude/skills/<名字>/SKILL.md', '可复用的技能，按需加载'],
          ['.claude/agents/', '子代理定义，把专项任务拆出去'],
          ['.claude/hooks/', '在工具调用前后自动执行的脚本']
        ]
      },
      {
        type: 'text',
        title: '权限：默认每次确认',
        html: `<p>读文件通常不需要批准；<strong>执行命令、改文件、联网</strong>默认都会弹确认。提示里能看到它准备做什么，并可以选择「本次允许」「本次会话都允许」。请把它当成代码评审的一部分，而不是点掉的弹窗。</p>`
      },
      {
        type: 'tip',
        title: '上下文快满时用 /compact',
        html: `<p>长会话会占满上下文窗口。用 <code>/compact</code> 让它把前文压缩成摘要再继续；任务切换时干脆新开一个会话，比在旧会话里翻旧账更省事。</p>`
      },
      {
        type: 'warn',
        title: '不要为了省事关掉全部权限',
        html: `<p>权限确认是最后一道防线。在真实项目里全开，意味着一条错误命令就能删掉未提交的工作。要提效，应该写清楚 CLAUDE.md、缩小任务范围，而不是关掉确认。</p>`
      },
      {
        type: 'steps',
        title: '第一次使用的完整流程',
        items: [
          { title: '进入项目目录', html: `<p><code>cd your-project &amp;&amp; claude</code>。它会以当前目录为工作区。</p>` },
          { title: '先让它读', html: `<p>「先读项目结构，说明构建和测试怎么跑，不要改文件。」</p>` },
          { title: '补一份 CLAUDE.md', html: `<p>「根据你刚才的观察，起草一份 CLAUDE.md，包含命令、约定、禁区。」确认后提交。</p>` },
          { title: '做一个小任务', html: `<p>从修一个 bug 或加一个小功能开始，让它先给计划，你确认后再动手。</p>` }
        ]
      },
      {
        type: 'text',
        title: '权限模式与团队设置',
        html: '`<p>除了逐个批准，Claude Code 还支持按模式控制：只读、按需询问、自动接受编辑等。建议从默认模式开始，熟悉它的行为后再调整。团队可以把权限规则写进 <code>.claude/settings.json</code> 提交到仓库，让所有人的边界一致，而不是各点各的。</p><p>注意：放宽的是「少问几次」，不是「不用看」。编辑与命令的结果仍然要自己验收。</p>`'
      },
      {
        type: 'text',
        title: '子代理与技能',
        html: '`<p>当任务可以拆开时，让它把独立部分交给子代理并行处理：一个读前端、一个读后端，最后汇总。重复出现的流程（发布检查、周报生成）适合写成技能，用 <code>/技能名</code> 直接调用，比每次重新描述稳定得多。</p><p>技能的好处是按需加载：不用把整套流程塞进 CLAUDE.md，只在用到时展开，上下文不会被撑爆。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '在自己的项目里跑通一次「读结构 → 写 CLAUDE.md → 做小改动」的完整流程。',
      items: [
        { text: '安装并登录', cmd: 'claude auth login' },
        { text: '让 Claude Code 读项目并起草 CLAUDE.md' },
        { text: '提交 CLAUDE.md，再让它改一个小问题' },
        { text: '用 git diff 检查它的改动' }
      ],
      done: 'CLAUDE.md 能被提交，且下一次会话里它不再问「测试怎么跑」。'
    },
    quiz: [
      { q: 'claude -p "..." 和直接运行 claude 有什么区别？', options: ['没有区别', '-p 输出一次结果后退出，适合脚本', '-p 只能读文件', '-p 会关闭权限'], answer: 1, explain: '-p 是非交互模式：给一个提示，打印结果就退出，适合放进脚本或管道。' },
      { q: 'CLAUDE.md 最该写什么？', options: ['完整的项目源码', '构建、测试命令与项目约定', '所有的历史提交', '模型参数'], answer: 1, explain: '它每次会话都会加载，适合放「每次都要用、但 agent 猜不到」的信息：命令、目录约定、禁区。' },
      { q: '长会话上下文快满时，最合适的做法是？', options: ['继续堆问题', '删掉项目文件', '用 /compact 压缩，或新开会话', '关掉权限确认'], answer: 2, explain: '/compact 把前文压成摘要继续；任务切换时新开会话更干净。' }
    ]
  },
  {
    id: 'codex-cli',
    order: 32,
    track: 'agents',
    title: 'Codex CLI 上手',
    subtitle: '安装、交互与 exec、AGENTS.md、沙箱',
    minutes: 14,
    level: '基础',
    goal: [
      '装好 Codex CLI 并完成登录',
      '分清交互模式与 codex exec 的场景',
      '知道沙箱和审批在保护什么'
    ],
    sections: [
      {
        type: 'text',
        title: '安装',
        html: `<p>Codex CLI 是 OpenAI 的本地 agent。三种安装方式任选：官方脚本、npm、Homebrew。</p>`
      },
      {
        type: 'terminal',
        title: '三种安装方式',
        command: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh\nnpm install -g @openai/codex\nbrew install --cask codex\ncodex --version',
        note: `<p>Windows 用 <code>powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"</code>。装完在项目目录运行 <code>codex</code>，首次会让你选择登录方式。</p>`
      },
      {
        type: 'text',
        title: '两种工作模式',
        html: `<p><strong>交互模式</strong>：直接跑 <code>codex</code>，像聊天一样，它会持续读文件、改代码、执行命令。<strong>非交互模式</strong>：<code>codex exec "..."</code>，给一个任务、跑完退出，适合脚本和 CI。</p><p>要接着上次的会话，用 <code>codex resume</code>；<code>--last</code> 取当前目录最近一次。</p><p>选错模式的代价很直接：交互模式塞进脚本会卡在等待输入，exec 拿来做探索又缺少中途纠偏。</p>`
      },
      {
        type: 'terminal',
        title: '常用入口',
        command: 'codex\ncodex exec "把 src/utils.ts 里的日期格式化抽成函数，并补测试"\ncodex resume --last\ncodex -C ~/projects/demo',
        note: `<p><code>-C</code> 指定工作目录，避免在错误的目录里开跑。任务描述里带上<strong>文件、期望行为、验收方式</strong>，产出会稳定很多。</p>`
      },
      {
        type: 'text',
        title: 'AGENTS.md：仓库级说明',
        html: `<p>Codex 会读取仓库里的 <code>AGENTS.md</code>，规则和 Claude Code 的 <code>CLAUDE.md</code> 一样：写命令、结构、约定、禁区。多个 agent 共用一份约定时，可以只维护 AGENTS.md。</p>`
      },
      {
        type: 'code',
        title: 'AGENTS.md 示例',
        lang: 'text',
        text: '# AGENTS.md\n\n## 环境\n- Node 22，包管理器用 pnpm\n- 本地服务：pnpm dev（3000 端口）\n\n## 验证\n- 改完必须跑：pnpm test --run\n- 类型检查：pnpm typecheck\n\n## 约定\n- 新增依赖前先说明理由\n- 不要提交 dist/ 与 .env\n- API 变更要同步更新 docs/api.md',
        note: `<p>把「怎么验证」写在最前面。agent 知道自己会被检查，才会认真跑测试。</p>`
      },
      {
        type: 'text',
        title: '沙箱与审批',
        html: `<p>Codex 在不同系统上使用不同的沙箱：macOS 用 Seatbelt，Linux 用 bubblewrap，Windows 有原生沙箱。命令默认在受限环境里执行，越权操作会先问你。<code>codex sandbox</code> 可以用同样的策略单独跑一条命令，用来验证权限边界。</p><p>如果不确定某个操作为什么被拦，先用 <code>codex sandbox</code> 复现一次：同样的策略、同样的报错，排查起来比在会话里猜快得多。先跑小任务，再放开复杂操作；先读后改，先验证再合并。</p>`
      },
      {
        type: 'table',
        title: '交互与 exec 怎么选',
        head: ['场景', '用哪个', '原因'],
        rows: [
          ['探索、重构、多轮调整', 'codex', '需要你中途确认与纠偏'],
          ['一次性的明确任务', 'codex exec', '跑完即走，可放进脚本'],
          ['CI 里做检查', 'codex exec', '非交互，输出可收集'],
          ['继续昨天的会话', 'codex resume --last', '保留上下文']
        ]
      },
      {
        type: 'warn',
        title: '不要默认全自动',
        html: `<p>把审批和沙箱全部关掉，等于把终端交给一个会自信犯错的模型。先用小任务观察它的行为，再逐步放宽；真实项目目录里保持默认设置。</p>`
      },
      {
        type: 'steps',
        title: '第一次使用',
        items: [
          { title: '装好并登录', html: `<p>运行 <code>codex</code>，选择 Sign in with ChatGPT 或配置 API key。</p>` },
          { title: '在项目里先读', html: `<p>「先读项目，说明入口和测试怎么跑，不要改文件。」</p>` },
          { title: '补 AGENTS.md', html: `<p>让它根据观察起草 AGENTS.md，你确认后提交。</p>` },
          { title: '跑一个 exec 任务', html: `<p>用 <code>codex exec</code> 做一个小改动，观察它的输出和 diff。</p>` }
        ]
      },
      {
        type: 'text',
        title: '配置与 profile',
        html: '`<p>Codex 的配置放在 <code>$CODEX_HOME</code>（通常是 <code>~/.codex</code>）。你可以用 profile 给不同项目准备不同的默认值：一个偏保守、只读；一个允许改代码。<code>--profile</code> 选择配置层，<code>-C</code> 指定工作目录，两者配合能避免「在错误目录、用错误策略」开跑。</p><p>配置文件里可能出现密钥，记得把它排除在版本控制之外。需要提交给团队共享的，只有项目级的 <code>AGENTS.md</code>。</p>`'
      },
      {
        type: 'text',
        title: '输出怎么看',
        html: '`<p>exec 模式适合把输出接进脚本：它会把过程与结果写到标准输出。交互模式则会在每步之间停下来等你确认。无论哪种，最后都要回到 <code>git diff</code>：agent 的总结是线索，diff 才是事实。</p><p>在 CI 里用 exec 时，要把退出码当作判据。任务失败就该让流水线红掉，而不是看它打印了一句「已完成」就放行。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '装好 Codex CLI，在测试仓库里各跑一次交互模式和 exec。',
      items: [
        { text: '安装并登录', cmd: 'codex' },
        { text: '交互模式下让它解释项目，不修改文件' },
        { text: '用 exec 跑一个小任务', cmd: 'codex exec "..."' },
        { text: '用 git diff 检查它的改动' }
      ],
      done: '能说清两种模式的差别，并看懂它改了什么。'
    },
    quiz: [
      { q: 'codex exec 最适合什么场景？', options: ['多轮探索式重构', '一次性的明确任务或 CI', '调试复杂交互', '需要频繁确认的操作'], answer: 1, explain: 'exec 是非交互模式：给任务、跑完退出，适合脚本与流水线；探索式任务用交互模式更合适。' },
      { q: 'AGENTS.md 的作用是？', options: ['存放源码', '给 agent 的仓库级说明：命令、约定、禁区', '替代 package.json', '保存聊天记录'], answer: 1, explain: '它每次会话都会被读取，用来交代 agent 猜不到但必须遵守的信息。' },
      { q: '关于沙箱与审批，正确做法是？', options: ['一律关掉以提速', '先用小任务观察，再按需放宽', '只在 CI 里开启', '审批会降低代码质量'], answer: 1, explain: '默认最小权限，观察行为后再放宽；全关等于把终端交给会犯错的模型。' }
    ]
  },
  {
    id: 'dsh',
    order: 33,
    track: 'agents',
    title: 'dsh：DeepSeek Harness',
    subtitle: '桌面端 agent：工作区、会话、技能、插件与 MCP',
    minutes: 12,
    level: '基础',
    goal: [
      '理解 dsh 的工作区与会话模型',
      '知道技能、插件与 MCP 能扩展什么',
      '会用权限与沙箱控制风险'
    ],
    sections: [
      {
        type: 'text',
        title: '它是什么',
        html: `<p>dsh（DeepSeek Harness）是一个<strong>桌面端 agent 应用</strong>，不是命令行工具。打开后是一个本地界面：左边选工作区与会话，右边对话，agent 在后台调用文件、终端、搜索等工具。</p><p>当前版本没有独立的 <code>dsh</code> 命令行入口，网上如果看到「dsh xxx 命令」多半是别的工具，别照搬。</p>`
      },
      {
        type: 'table',
        title: '界面里的几个概念',
        head: ['概念', '含义'],
        rows: [
          ['工作区', '一个项目目录，agent 默认只能在这里读写'],
          ['会话', '一段连续对话，有自己的上下文和历史'],
          ['预设', '一套 agent 配置：模型、工具、提示词'],
          ['权限策略', '哪些操作需要你确认，哪些直接执行'],
          ['沙箱模式', '允许改的范围：仅工作区，或整台机器']
        ]
      },
      {
        type: 'table',
        title: '常用工具与边界',
        head: ['工具', '做什么', '注意'],
        rows: [
          ['读 / 写 / 编辑', '查看与修改文件', '写入前先读，避免覆盖'],
          ['搜索', '按文件名或内容定位', '大仓库先缩小目录'],
          ['终端', '执行命令、跑测试', '危险命令会请求确认'],
          ['代码执行', '用脚本批量调用工具', '适合重复性检查与统计'],
          ['子代理', '把独立子任务分出去并行做', '适合调研、审查、批量修改']
        ]
      },
      {
        type: 'text',
        title: '权限与沙箱',
        html: `<p>dsh 把「要不要问你」和「能改哪里」分成两层：<strong>审批策略</strong>决定哪些操作需要确认，<strong>沙箱</strong>决定文件系统范围。<code>workspace-write</code> 只能改当前工作区；<code>danger-full-access</code> 可以碰整台机器。</p><p>日常开发保持工作区写入即可。只有确实需要装系统包、改全局配置时，才临时放宽。</p>`
      },
      {
        type: 'steps',
        title: '一次典型任务',
        items: [
          { title: '选对工作区', html: `<p>一个工作区对应一个项目。开错目录，agent 会对着错误代码库工作。</p>` },
          { title: '新建会话', html: `<p>一个任务一个会话。长会话上下文会变脏，切换任务时新开更干净。</p>` },
          { title: '先读后写', html: `<p>让它先说明要改哪些文件、为什么，再批准动手。</p>` },
          { title: '验收', html: `<p>看 diff、跑测试；不满意就指出具体位置，而不是让它「再改改」。</p>` }
        ]
      },
      {
        type: 'text',
        title: '技能：把重复流程打包',
        html: "<p>技能是一份带 frontmatter 的 <code>SKILL.md</code>，放在 <code>~/.dsh/skills/名字/</code> 下，里面可以写步骤、判据，也可以带脚本。它和提示词的区别是<strong>按需加载</strong>：平时不占上下文，匹配到场景才展开。</p><p>适合固化的东西：出卷、发版检查、周报生成、数据清洗。把「每次都一样的流程」写进去，比每次重新描述稳定得多。</p>",
      },
      {
        type: 'code',
        title: 'SKILL.md 的结构',
        lang: 'text',
        text: "---\nname: weekly-report\ndescription: 把一周的 commit 与 issue 整理成周报草稿\nwhenToUse: 用户要求写周报、汇总本周进展时\n---\n\n# 周报生成\n\n1. 读取 worklog/*.md 与 git log --since=\"7 days ago\" --oneline\n2. 按「完成 / 进行中 / 风险」三组归类，每条一句话\n3. 输出 Markdown，不超过 300 字；风险部分必须写清影响面",
        note: "<p>frontmatter 里的 <code>description</code> 和 <code>whenToUse</code> 决定它什么时候被加载，写清楚触发场景比写漂亮话重要。</p>"
      },
      {
        type: 'text',
        title: '插件与插件市场',
        html: "<p>dsh 是<strong>插件化</strong>的：插件能给 agent 加工具、加连接器、加界面。安装走 <code>dsh plugin</code> 命令或应用内的市场入口；插件市场里的条目通常带着来源地址，装之前先看它来自哪个仓库、要什么权限。</p><p>典型例子是浏览器控制插件：它桥接你正在用的 Chrome / Firefox，让 agent 读页面、点控件、切标签，同时保留你的登录状态。这类插件能力很强，也意味着更大的权限面——只装你信得过的来源。</p>",
      },
      {
        type: 'text',
        title: 'MCP：接外部工具与数据',
        html: "<p>MCP（Model Context Protocol）是给 agent 接外部能力的协议。通过 MCP 服务器，可以把数据库、内部 API、文档系统接进来，这些能力会以工具的形式出现在会话里。</p><p>配置时守住两条：只接需要的服务器，给它最小的访问范围；优先本地或可信来源，不要随手接一个来路不明的公网服务。</p>",
      },
      {
        type: 'tip',
        title: '把工作区当边界',
        html: `<p>不要把家目录设为工作区。工作区越精确，误改的范围越小，agent 搜索也越快。</p>`
      },
      {
        type: 'warn',
        title: '别把「全权限」当默认',
        html: `<p>全权限模式适合一次性、可丢弃的环境。日常项目里开着它，一次误操作就可能改到系统配置或别的仓库。</p>`
      },
      {
        type: 'code',
        title: '一段可以直接用的任务描述',
        lang: 'text',
        text: '目标：给设置页加上「导出配置」按钮，导出当前设置为 JSON。\n范围：只改 src/pages/settings 与 src/lib/export.ts，不要动路由。\n验收：点击后下载 settings.json，内容包含主题与语言两项；补一个单测。',
        note: '`<p>工作区、范围、验收都写清楚，子代理并行时也不会改到同一批文件。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '在 dsh 里完成一次「读 → 计划 → 改 → 验收」的小任务。',
      items: [
        { text: '新建一个只包含测试项目的工作区' },
        { text: '让 agent 先读结构并给出改动计划' },
        { text: '批准后完成一个小改动' },
        { text: '检查 diff 并运行测试' }
      ],
      done: '整个过程没有越出工作区，改动可回滚。'
    },
    quiz: [
      { q: 'dsh 的工作区是什么？', options: ['一个聊天窗口', 'agent 默认能读写的项目目录', '模型列表', '插件市场'], answer: 1, explain: '工作区划定文件边界：workspace-write 模式下，agent 只能在这里读写。' },
      { q: 'workspace-write 与 danger-full-access 的区别是？', options: ['模型不同', '前者只能改工作区，后者可访问整台机器', '速度不同', '前者不能执行命令'], answer: 1, explain: '这是沙箱范围的两档：日常用工作区写入，装系统包等场景才临时放宽。' },
      { q: '切换到一个新任务时，比较好的习惯是？', options: ['继续用旧会话', '新开一个会话', '清空工作区', '换模型'], answer: 1, explain: '旧会话的上下文会干扰新任务，新开会话更干净，也更容易回看。' }
    ]
  },
  {
    id: 'agent-workflow',
    order: 34,
    track: 'agents',
    title: '让 agent 真正干活的流程',
    subtitle: '给目标、先计划、小步改、认真验收',
    minutes: 14,
    level: '进阶',
    goal: [
      '写出 agent 能执行的任务描述',
      '用「先计划后动手」减少返工',
      '建立一套可重复的验收习惯'
    ],
    sections: [
      {
        type: 'text',
        title: '开场三件套',
        html: `<p>一条好的任务描述包含三样东西：<strong>目标</strong>（要什么结果）、<strong>约束</strong>（不能碰什么、用什么方案）、<strong>验收</strong>（怎么算完成）。缺哪一样，agent 就会自己猜，猜错就要重来。</p>`
      },
      {
        type: 'compare',
        title: '同一件事，两种说法',
        left: {
          label: '模糊指令',
          items: ['帮我优化一下这个页面', '把测试修好', '重构用户模块', '看看有没有问题']
        },
        right: {
          label: '可执行指令',
          items: [
            '首页首屏 LCP 超过 2.5s，找出前三个原因并给方案，先不要改代码',
            'pnpm test 有 3 个失败，修到全绿，不要改测试断言',
            '把 src/user 里的请求逻辑抽到 api.ts，行为不变，补单测',
            '检查 src/pay 的错误处理，按严重程度列问题，先不要改'
          ]
        },
        note: `<p>差别不在字数，而在<strong>能不能验证</strong>。能验证的要求，agent 才知道什么时候该停。</p>`
      },
      {
        type: 'steps',
        title: '一次任务的完整流程',
        items: [
          { title: '先读', html: `<p>让它读相关文件并复述现状，确认它理解的和你想的一致。</p>` },
          { title: '给计划', html: `<p>要求列出改动文件、步骤、风险，先不要写代码。</p>` },
          { title: '小步执行', html: `<p>一次只做一步，做完跑测试，绿了再继续。</p>` },
          { title: '验收', html: `<p>看 diff、跑测试、手动点一遍关键路径。</p>` },
          { title: '提交', html: `<p>按改动拆成多条提交，信息写清做了什么、为什么。</p>` }
        ]
      },
      {
        type: 'text',
        title: '先计划，后动手',
        html: `<p>计划阶段是成本最低的纠错点。一句「先给方案，我确认后再改」能挡掉大部分方向性错误。计划里重点看三件事：<strong>要改哪些文件</strong>、<strong>有没有漏掉的调用方</strong>、<strong>怎么验证</strong>。</p>`
      },
      {
        type: 'text',
        title: '小步提交的价值',
        html: `<p>让 agent 一次改二十个文件，出问题时你无法判断是哪一步坏的。改成一次一个文件、一次一个行为，每步跑一次测试，出问题能立刻定位，也能单独回滚。</p>`
      },
      {
        type: 'tip',
        title: '报错要贴完整',
        html: `<p>「不行」「还是报错」会让它开始瞎猜。把<strong>完整错误、执行的命令、期望结果</strong>一起给它，定位速度会快一个数量级。</p>`
      },
      {
        type: 'text',
        title: '上下文是要管理的',
        html: `<p>会话越长，早期信息越容易被挤出窗口。做法：任务切换就新开会话；阶段性结论写进 <code>CLAUDE.md</code> / <code>AGENTS.md</code>；长任务用 <code>/compact</code> 压缩而不是硬撑。</p><p>还有一个便宜的办法：让它每完成一步就用一句话总结当前状态。你复制这条总结到新会话，比拖着旧上下文更清楚。</p>`
      },
      {
        type: 'warn',
        title: '不要盲信「已完成」',
        html: `<p>agent 说完成，只代表它认为改完了。测试没跑、diff 没看、边界没测，就不算完成。把「跑测试 + 看 diff」当成固定动作，而不是可选项。</p>`
      },
      {
        type: 'table',
        title: '常见失败与对策',
        head: ['症状', '常见原因', '对策'],
        rows: [
          ['改错文件', '没先读结构', '先让它复述目录与入口'],
          ['越改越乱', '一次改太多', '拆成小步，每步验证'],
          ['反复修不好', '缺少报错上下文', '贴完整错误与命令'],
          ['测试被改绿', '只求通过', '明确「不要改测试断言」'],
          ['上下文丢失', '会话太长', '新开会话或压缩']
        ]
      },
      {
        type: 'code',
        title: '任务模板（可直接套用）',
        lang: 'text',
        text: '目标：修复「导出 CSV 时中文乱码」。\n现状：src/export/csv.ts 用默认编码写出，Windows Excel 打开乱码。\n约束：只改这个文件与对应测试，不要升级依赖。\n验收：新增单测覆盖 BOM 场景，pnpm test --run 全绿。\n先给计划，我确认后再改。'
      },
      {
        type: 'tip',
        title: '一次只问一件事',
        html: '`<p>把「顺便再改个样式」塞进同一个任务，会让 diff 变脏、回滚变难。一次只做一件事，做完验收、提交，再开下一个。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '把一件真实的小任务，按「目标 / 约束 / 验收」写成一段指令交给 agent。',
      items: [
        { text: '写清目标、约束、验收标准' },
        { text: '要求它先给计划，不要动代码' },
        { text: '确认计划后分步执行' },
        { text: '跑测试并 review diff' }
      ],
      done: '全程只返工一次以内，且每条改动都能对应到计划里的一步。'
    },
    quiz: [
      { q: '一条可执行的 agent 指令，最少要包含什么？', options: ['目标和验收标准', '越详细越好，没有重点', '只要一句「帮我改」', '模型名称'], answer: 0, explain: '目标决定做什么，验收决定何时停。约束用来防止它跑偏。' },
      { q: '为什么要先让它给计划？', options: ['显得专业', '计划阶段纠错成本最低', '能减少 token', '必须走流程'], answer: 1, explain: '方向错了，越早发现越省事。计划里能看出它要改哪些文件、怎么验证。' },
      { q: '测试失败时，怎样描述最有效？', options: ['说「还是不行」', '贴完整报错、命令和期望结果', '让它自己猜', '把测试删掉'], answer: 1, explain: '完整错误 + 命令 + 期望，能直接定位；模糊描述只会让它反复试错。' }
    ]
  },
  {
    id: 'agent-safety',
    order: 35,
    track: 'agents',
    title: '权限、沙箱与安全',
    subtitle: '给 agent 多大权限，才既好用又不出事',
    minutes: 12,
    level: '进阶',
    goal: [
      '知道 agent 能造成的真实风险',
      '按任务选择权限与沙箱范围',
      '建立上线前的检查清单'
    ],
    sections: [
      {
        type: 'text',
        title: '它能执行命令，就能造成后果',
        html: `<p>agent 的工具箱里有终端。能跑 <code>npm test</code>，就能跑 <code>rm -rf</code>、<code>git reset --hard</code>、<code>curl | sh</code>。风险不是「模型有恶意」，而是<strong>它在错误的理解下执行了正确的命令</strong>。</p>`
      },
      {
        type: 'table',
        title: '风险与对策',
        head: ['风险', '典型场景', '对策'],
        rows: [
          ['误删文件', '清理临时文件时路径写错', '工作区沙箱 + 提交后再操作'],
          ['覆盖未提交改动', 'reset --hard、checkout', '先 commit 或 stash'],
          ['泄露密钥', '把 .env 贴进对话或提交', '.gitignore + 不粘贴密钥'],
          ['执行恶意脚本', 'curl 陌生脚本直接跑', '先读脚本再执行'],
          ['供应链风险', '安装来源不明的包', '锁定版本、审查依赖']
        ]
      },
      {
        type: 'text',
        title: '最小权限',
        html: `<p>默认停留在<strong>工作区写入</strong>。需要装系统包、改全局配置、访问工作区外的路径时，再临时放宽，用完收回。这不是麻烦，而是把「一次误操作」限制在可恢复的范围内。</p><p>判断标准很简单：这次操作坏了，能不能用一个 <code>git</code> 命令回滚？不能，就不该给它全权限。</p>`
      },
      {
        type: 'text',
        title: '密钥不进对话',
        html: `<p>API key、数据库密码、私钥都不要粘贴进对话。需要它读配置时，让它读 <code>.env.example</code> 这类脱敏文件。万一泄露，第一件事是<strong>立刻轮换</strong>，而不是删聊天记录。</p><p>同理，截图和日志在贴进去之前先扫一眼：连接串、token、内网地址经常藏在报错堆栈里。</p>`
      },
      {
        type: 'warn',
        title: '这几类命令要特别小心',
        html: `<ul><li><code>rm -rf</code>：先 <code>ls</code> 确认路径，能进回收站就别直接删</li><li><code>git reset --hard</code> / <code>git clean -fd</code>：未提交的工作会消失</li><li><code>curl ... | sh</code>：先下载读一遍再执行</li><li><code>npm publish</code>、<code>docker push</code>：会对外发布，确认版本与内容</li></ul>`
      },
      {
        type: 'steps',
        title: '让 agent 改代码前的检查',
        items: [
          { title: '工作区干净', html: `<p><code>git status</code> 没有未提交改动，或已经 stash。这样出问题能一键回滚。</p>` },
          { title: '开一条分支', html: `<p>在主分支上直接让 agent 改，回滚成本高。新开 feature 分支。</p>` },
          { title: '限定范围', html: `<p>明确告诉它只改哪些目录，别碰配置和密钥文件。</p>` },
          { title: '验收后再合并', html: `<p>测试通过、diff 看过、关键路径手动验一遍，再合并。</p>` }
        ]
      },
      {
        type: 'compare',
        title: '两种用法',
        left: {
          label: '图省事',
          items: ['权限全开，弹窗全关', '直接在主分支上改', '密钥随手贴进对话', '它说完成就提交']
        },
        right: {
          label: '稳妥',
          items: ['默认工作区写入，按需放宽', '每次改动开分支', '只用脱敏配置', '测试 + diff + 手动验证']
        },
        note: `<p>稳妥的做法多花几分钟，但把「不可恢复的事故」变成了「可以回滚的改动」。</p>`
      },
      {
        type: 'tip',
        title: '把检查写进项目',
        html: `<p>在 <code>CLAUDE.md</code> / <code>AGENTS.md</code> 里写明：不要碰 .env、不要改锁文件、提交前必须跑测试。规则写在仓库里，比每次口头叮嘱可靠。</p>`
      },
      {
        type: 'terminal',
        title: '动手前的三行确认',
        command: 'git status\ngit switch -c agent/export-csv\ngit stash list',
        output: 'On branch main\nnothing to commit, working tree clean',
        note: '`<p>工作区干净、在新分支上、没有遗留的 stash。三行都确认过，再让 agent 开始改。</p>`'
      },
      {
        type: 'text',
        title: '出事之后怎么收场',
        html: '`<p>改动还没提交：<code>git restore</code> 或 <code>git checkout -- .</code>。已经提交但没推送：<code>git reset --soft</code> 回退后重做。已经推送：用 <code>git revert</code> 追加反向提交，不要改写公共历史。密钥泄露：先轮换，再清理历史。</p><p>事后复盘时，把触发问题的那条命令写进 <code>AGENTS.md</code> 的禁区，比记在脑子里可靠。</p>`'
      },
      {
        type: 'text',
        title: '权限是会传染的',
        html: '`<p>团队里一个人开着全权限跑 agent，风险由整个仓库承担。把规则写进仓库配置，比依赖每个人的自觉更可靠。新成员入职时，把「默认沙箱 + 改前开分支」写成一条硬规矩，比事后追责有用，也更容易坚持。</p>`'
      },
    ],
    exercise: {
      title: '动手练一练',
      brief: '检查你当前项目的权限设置与 .gitignore，补上缺失的防护。',
      items: [
        { text: '确认 agent 的沙箱模式是工作区写入' },
        { text: '检查 .gitignore 是否包含 .env、node_modules、构建产物' },
        { text: '在 CLAUDE.md 或 AGENTS.md 里写三条「不要做」' },
        { text: '开一条分支，让 agent 做一次小改动并验收' }
      ],
      done: '项目里没有任何密钥会被提交，改动可随时回滚。'
    },
    quiz: [
      { q: 'agent 误删文件最常见的诱因是什么？', options: ['模型有恶意', '在错误的理解下执行了正确的命令', '网络问题', '磁盘故障'], answer: 1, explain: '风险通常来自理解偏差或路径写错，而不是模型主动作恶。沙箱与提交习惯能把影响限制住。' },
      { q: '让 agent 改代码前，最该先做的是？', options: ['关掉权限确认', '确保工作区干净并开一条分支', '把密钥发给它', '直接在主分支改'], answer: 1, explain: '干净的工作区 + 独立分支，让任何改动都能回滚或丢弃。' },
      { q: '密钥不小心泄露后，第一件事是？', options: ['删掉聊天记录', '立刻轮换密钥', '重启电脑', '改仓库名'], answer: 1, explain: '删除记录不能阻止已经泄露的凭据被使用；轮换才是止损。' }
    ]
  }
);
