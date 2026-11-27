#!/usr/bin/env python3
"""工具学校内容编辑器的数据层：读写 content/、备份、构建、预览工作区。"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
BACKUPS = Path(__file__).resolve().parent / "backups"
TRACKS = ["terminal", "git", "vscode", "dev", "efficiency", "agents"]
TRACK_NAMES = {
    "terminal": "终端与系统",
    "git": "Git 与版本控制",
    "vscode": "VS Code",
    "dev": "开发环境与工具链",
    "efficiency": "效率与排错",
    "agents": "AI 编程助手",
}
LEVELS = ["入门", "基础", "进阶"]
SECTION_TYPES = ["text", "tip", "warn", "steps", "table", "code", "terminal", "shortcuts", "compare"]

HEADER = "/* 由 content/ 生成，请勿手改；修改内容请用 tools/editor 或改 content/*.json 后运行 build-data.mjs */\n"


def lesson_path(track):
    return CONTENT / "lessons" / (track + ".json")


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


class Store:
    def __init__(self):
        self.lessons = {t: [] for t in TRACKS}
        self.refs = {"commands": [], "shortcuts": [], "glossary": []}
        self.load()

    def load(self):
        for t in TRACKS:
            p = lesson_path(t)
            self.lessons[t] = read_json(p) if p.exists() else []
        self.refs = read_json(CONTENT / "refs.json")

    def all_lessons(self):
        out = []
        for t in TRACKS:
            out.extend(self.lessons[t])
        return sorted(out, key=lambda l: l.get("order", 0))

    def find(self, lesson_id):
        for t in TRACKS:
            for lesson in self.lessons[t]:
                if lesson.get("id") == lesson_id:
                    return t, lesson
        return None, None

    def next_order(self):
        orders = [l.get("order", 0) for l in self.all_lessons()]
        return (max(orders) + 1) if orders else 1

    # ---------------- 备份 ----------------
    def backup(self):
        BACKUPS.mkdir(parents=True, exist_ok=True)
        stamp = time.strftime("%Y%m%d-%H%M%S")
        dest = BACKUPS / stamp
        n = 1
        while dest.exists():
            dest = BACKUPS / (stamp + "-" + str(n))
            n += 1
        shutil.copytree(CONTENT, dest / "content")
        keep = 30
        dirs = sorted([d for d in BACKUPS.iterdir() if d.is_dir()], key=lambda d: d.name)
        for old in dirs[:-keep]:
            shutil.rmtree(old, ignore_errors=True)
        return dest

    def latest_backup(self):
        if not BACKUPS.exists():
            return None
        dirs = sorted([d for d in BACKUPS.iterdir() if d.is_dir()], key=lambda d: d.name)
        return dirs[-1] if dirs else None

    def undo(self):
        last = self.latest_backup()
        if last is None:
            raise RuntimeError("没有可用的备份")
        src = last / "content"
        if not src.exists():
            raise RuntimeError("备份内容缺失")
        for item in src.iterdir():
            if item.is_dir():
                shutil.copytree(item, CONTENT / item.name, dirs_exist_ok=True)
            else:
                shutil.copy2(item, CONTENT / item.name)
        self.load()
        self.build()
        return last.name

    # ---------------- 保存 ----------------
    def save(self):
        self.backup()
        for t in TRACKS:
            write_json(lesson_path(t), self.lessons[t])
        write_json(CONTENT / "refs.json", self.refs)
        self.build()
        return self.validate()

    def build(self):
        proc = subprocess.run(
            ["node", str(ROOT / "tools/editor/build-data.mjs")],
            capture_output=True, text=True, cwd=str(ROOT)
        )
        if proc.returncode != 0:
            raise RuntimeError((proc.stdout or "") + (proc.stderr or ""))
        return proc.stdout

    def validate(self):
        problems = []
        ids = set()
        for lesson in self.all_lessons():
            lid = lesson.get("id")
            if not lid:
                problems.append("有课程缺少 id")
                continue
            if lid in ids:
                problems.append(lid + "：id 重复")
            ids.add(lid)
            sections = lesson.get("sections") or []
            if not (7 <= len(sections) <= 12):
                problems.append(lid + "：章节数 " + str(len(sections)) + "（应为 7-12）")
            for s in sections:
                if s.get("type") not in SECTION_TYPES:
                    problems.append(lid + "：未知章节类型 " + str(s.get("type")))
                if s.get("type") == "table":
                    width = len(s.get("head") or [])
                    for row in s.get("rows") or []:
                        if len(row) != width:
                            problems.append(lid + "：表格列数不一致")
                            break
            quiz = lesson.get("quiz") or []
            if len(quiz) != 3:
                problems.append(lid + "：测验 " + str(len(quiz)) + " 题（应为 3）")
            for q in quiz:
                if len(q.get("options") or []) != 4:
                    problems.append(lid + "：选项不是 4 个")
                if not (0 <= int(q.get("answer", -1)) <= 3):
                    problems.append(lid + "：答案下标越界")
            ex = lesson.get("exercise") or {}
            if len(ex.get("items") or []) < 2:
                problems.append(lid + "：练习少于 2 步")
        return problems

    # ---------------- 预览 ----------------
    def make_preview(self, lesson_id):
        tmp = Path(tempfile.mkdtemp(prefix="ts-preview-"))
        (tmp / "assets" / "js").mkdir(parents=True)
        shutil.copy2(ROOT / "index.html", tmp / "index.html")
        os.symlink(ROOT / "assets" / "css", tmp / "assets" / "css")
        os.symlink(ROOT / "assets" / "js" / "app.js", tmp / "assets" / "js" / "app.js")
        for t in TRACKS:
            body = HEADER + "window.PS = window.PS || {};\nwindow.PS.lessons = window.PS.lessons || [];\n"
            body += "window.PS.lessons.push(\n" + ",\n".join(
                json.dumps(l, ensure_ascii=False, indent=2) for l in self.lessons[t]
            ) + "\n);\n"
            (tmp / "assets" / "js" / ("data-" + t + ".js")).write_text(body, encoding="utf-8")
        refs = self.refs
        refs_body = HEADER + "window.PS = window.PS || {};\n"
        refs_body += "window.PS.commands = " + json.dumps(refs["commands"], ensure_ascii=False, indent=2) + ";\n"
        refs_body += "window.PS.shortcuts = " + json.dumps(refs["shortcuts"], ensure_ascii=False, indent=2) + ";\n"
        refs_body += "window.PS.glossary = " + json.dumps(refs["glossary"], ensure_ascii=False, indent=2) + ";\n"
        (tmp / "assets" / "js" / "data-refs.js").write_text(refs_body, encoding="utf-8")
        url = (tmp / "index.html").as_uri()
        if lesson_id:
            url += "#/lesson/" + lesson_id
        return url, tmp

    def make_default_lesson(self, track, lesson_id, title):
        return {
            "id": lesson_id,
            "order": self.next_order(),
            "track": track,
            "title": title,
            "subtitle": "一句话说明这一节解决什么问题",
            "minutes": 10,
            "level": "入门",
            "goal": ["目标一", "目标二", "目标三"],
            "sections": [
                {"type": "text", "title": "开场", "html": "<p>这里写正文。</p>"},
                {"type": "tip", "title": "小提示", "html": "<p>这里写提示。</p>"},
                {"type": "table", "title": "对照表", "head": ["列一", "列二"], "rows": [["", ""]]},
                {"type": "compare", "title": "两种做法", "left": {"label": "做法 A", "items": [""]}, "right": {"label": "做法 B", "items": [""]}},
                {"type": "steps", "title": "步骤", "items": [{"title": "第一步", "html": "<p>说明</p>"}]},
                {"type": "terminal", "title": "试一试", "command": "echo hello", "output": "hello"},
                {"type": "code", "title": "代码", "lang": "text", "text": "示例"},
                {"type": "warn", "title": "注意", "html": "<p>这里写风险。</p>"},
            ],
            "exercise": {"title": "动手练一练", "brief": "完成下面的练习。", "items": [{"text": "第一步"}, {"text": "第二步"}], "done": "能说清你做了什么。"},
            "quiz": [
                {"q": "问题一", "options": ["A", "B", "C", "D"], "answer": 0, "explain": "解释。"},
                {"q": "问题二", "options": ["A", "B", "C", "D"], "answer": 0, "explain": "解释。"},
                {"q": "问题三", "options": ["A", "B", "C", "D"], "answer": 0, "explain": "解释。"},
            ],
        }
