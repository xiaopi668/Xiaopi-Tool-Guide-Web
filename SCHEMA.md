# 工具学校 · 课程数据契约（严格遵守）

本站是**纯黑、单色、排版驱动**的计算机工具教程。课程内容以数据形式存在，由 `assets/js/app.js` 统一渲染。你只写数据文件，不写页面、不写样式、不改 app.js。

## 文件形态
普通浏览器脚本（不是 ES module，禁止 import / export / require）：

~~~js
window.PS = window.PS || {};
window.PS.lessons = window.PS.lessons || [];
window.PS.lessons.push(
  { /* 课程 1 */ },
  { /* 课程 2 */ }
);
~~~

- 长文本用模板字符串（反引号）书写；禁止出现美元符号加花括号的插值写法。
- 文件末尾留一个换行；`node --check 文件路径` 必须通过。

## 课程对象字段

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| id | string | 全局唯一，小写英文加连字符，由任务指定 |
| order | number | 全局顺序，由任务指定 |
| track | string | terminal / git / vscode / dev / efficiency 之一 |
| title | string | 不超过 16 个汉字 |
| subtitle | string | 不超过 36 个汉字，一句话说清这课解决什么问题 |
| minutes | number | 6 到 20 |
| level | string | 入门 / 基础 / 进阶 |
| goal | string[] | 3 到 4 条，每条不超过 26 字，不要句号结尾 |
| sections | Section[] | 7 到 12 个，见下 |
| exercise | object | 见下 |
| quiz | Quiz[] | 3 题 |

## Section 类型（只能用这 9 种）

1. `{ type: 'text', title?: string, html: string }` 正文段落
2. `{ type: 'tip', title: string, html: string }` 关键提示卡
3. `{ type: 'warn', title: string, html: string }` 踩坑警告卡
4. `{ type: 'steps', title?: string, items: { title: string, html: string }[] }` 2 到 5 个编号步骤
5. `{ type: 'table', title?: string, head: string[], rows: string[][] }` 表格，每行长度等于表头
6. `{ type: 'code', title?: string, lang: 'bash' | 'json' | 'text' | 'diff', text: string, note?: string }` 可复制代码块
7. `{ type: 'terminal', title?: string, command: string, output?: string, note?: string }` 终端块：command 是用 `$` 提示符展示并复制的命令，output 是模拟输出（可选，纯文本，保留换行）
8. `{ type: 'shortcuts', title?: string, items: { action: string, mac: string[], win: string[], linux?: string[], note?: string }[] }` 快捷键表；mac/win 是按键数组，如 `['⌘','⇧','P']`、`['Ctrl','Shift','P']`；linux 可选，省略时按 win 显示
9. `{ type: 'compare', title?: string, left: { label: string, items: string[] }, right: { label: string, items: string[] }, note?: string }` 左错右对（或左旧右新）对照

html / text / output 字段内允许的标签仅有：`<p>` `<strong>` `<em>` `<code>` `<span class="hl">` `<ul><li>` `<br>`
不允许脚本、样式、图片、链接。

## exercise 字段

~~~js
exercise: {
  title: '动手练一练',                 // 可自定义
  brief: '在真实终端里完成下面几步，做完再回来。',  // 30 到 80 字
  items: [                            // 2 到 4 步
    { text: '在一个空文件夹里初始化仓库', cmd: 'git init' },  // cmd 可选
    { text: '创建第一个文件并提交' }
  ],
  done: 'git log 能看到一条提交记录，说明你完成了。'  // 完成标准，20 到 60 字
}
~~~

## quiz 字段

~~~js
quiz: [{ q: '题干', options: ['A', 'B', 'C', 'D'], answer: 1, explain: '为什么，40 到 90 字' }]
~~~

options 固定 4 个，answer 是正确项下标（0 开始）。干扰项要真实、有迷惑性。

## 完整示例（只是格式示例，不要写进你的文件）

~~~js
{
  id: 'sample',
  order: 0,
  track: 'terminal',
  title: '示例课程',
  subtitle: '用一句话说明这一课解决什么问题',
  minutes: 10,
  level: '入门',
  goal: ['知道命令由哪几部分组成', '能在终端里安全地移动位置'],
  sections: [
    { type: 'text', title: '先看一条命令', html: '<p>命令由三部分组成：<strong>程序名</strong>、选项、参数。</p>' },
    { type: 'terminal', title: '试一试', command: 'ls -la', output: 'total 24\ndrwxr-xr-x  5 user  staff  160  1 1 10:00 .', note: '输出里的每一列都有含义。' },
    { type: 'shortcuts', title: '常用快捷键', items: [{ action: '清屏', mac: ['⌘','K'], win: ['Ctrl','L'] }] },
    { type: 'compare', left: { label: '错误做法', items: ['直接把文件删掉'] }, right: { label: '正确做法', items: ['先用 ls 确认路径，再删除'] } }
  ],
  exercise: { title: '动手练一练', brief: '打开终端，完成下面的操作。', items: [{ text: '查看当前目录', cmd: 'pwd' }], done: '能说出自己当前所在的路径。' },
  quiz: [{ q: '下面哪条命令会显示隐藏文件？', options: ['ls', 'ls -a', 'cd', 'pwd'], answer: 1, explain: '-a 表示 all，会把以点开头的隐藏文件也列出来。' }]
}
~~~

## 写作要求

- 简体中文，第二人称「你」，直接、具体、可操作。像一位坐在旁边的工程师，不写空话。
- **每条命令都要说清楚它会做什么、在哪个目录执行、有什么风险。** 危险命令（rm -rf、git reset --hard、chmod 777）必须写明后果。
- 首次出现的术语用「中文（English）」，例如 暂存区（staging area）。
- 举例要真实：真实的命令、真实的报错文本、真实的路径、真实的插件名与快捷键。不确定的快捷键宁可不写。
- 不要用 emoji，不要用营销腔（震撼、神器、效率暴涨），不要写「众所周知」「简单来说」这类填充词。
- 段落短，多用列表和表格。一个 section 不要超过 220 字。
- 快捷键按 macOS 与 Windows 分别给出，不要混写。mac 用 ⌘ ⌥ ⇧ ⌃ 符号，win 用 Ctrl / Alt / Shift / Win 文字。
- 命令块要能直接复制运行；用注释说明关键行。
