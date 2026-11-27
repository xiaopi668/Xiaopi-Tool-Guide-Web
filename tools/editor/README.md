# 内容编辑器

一个 GTK3 桌面程序，用来改网站课程与速查数据。改完点保存，会直接写回 `content/` 并重新生成网站用的 `assets/js/data-*.js`。

## 启动

```bash
python3 tools/editor/editor.py
# 或
./tools/editor/run.sh
```

依赖：PyGObject、GTK 3、WebKit2 4.1、Node.js（用于生成数据文件）。

### 安装到应用菜单

```bash
./tools/editor/install.sh
```

会安装三样东西：

- 命令 `tool-school-editor`（`~/.local/bin`）
- 菜单项「工具学校 · 内容编辑器」（`~/.local/share/applications`）
- 图标（`~/.local/share/icons/hicolor`）

之后可以从应用菜单打开，或直接运行 `tool-school-editor`。安装脚本记录的是当前仓库路径，仓库移动后重新运行一次即可。

卸载：

```bash
./tools/editor/uninstall.sh
```

## 能改什么

- **课程**：标题、副标题、轨道、顺序、时长、难度、学习目标
- **章节**：9 种类型（text / tip / warn / steps / table / code / terminal / shortcuts / compare），支持新增、上移、下移、复制、删除
- **练习**：说明、步骤、完成标准
- **测验**：3 道题，题干、4 个选项、正确答案、解析
- **速查数据**：命令（含 Windows/macOS 写法与可用系统）、快捷键（macOS / Windows / Linux）、术语
- **新建 / 删除课程**：自动分配顺序号，校验 id 唯一

## 预览

切到「预览」标签或按 F5：会把当前内存里的内容写进临时目录，用 WebKit 加载真实页面，所以预览和线上一致。改了没保存也能预览。

## 保存与备份

- 保存时先把 `content/` 复制到 `tools/editor/backups/<时间戳>/`，再写回并调用 `build-data.mjs` 重新生成 JS
- 备份保留最近 30 份，「撤销上次保存」可一键回滚
- 保存后会自动跑一遍结构校验（章节数、测验题数、表格列数等），有问题会弹窗列出，但文件已经写入，改完再存一次即可

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 保存 | Ctrl+S |
| 新建课程 | Ctrl+N |
| 刷新预览 | F5 |

## 数据流

```
content/lessons/*.json  ─┐
content/refs.json       ─┴─> node tools/editor/build-data.mjs ─> assets/js/data-*.js
```

`content/` 是唯一的内容源；`assets/js/data-*.js` 是生成物，不要手改。只想改一两个字段时也可以直接编辑 JSON，再跑一次构建：

```bash
node tools/editor/build-data.mjs
```
