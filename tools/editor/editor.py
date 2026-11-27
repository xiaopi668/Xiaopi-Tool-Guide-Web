#!/usr/bin/env python3
"""工具学校 · 内容编辑器（GTK3 + WebKit2）

用法：python3 tools/editor/editor.py
"""

import json
import os
import re
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, WebKit2, Gdk, GLib  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_store import (  # noqa: E402
    Store, TRACKS, TRACK_NAMES, LEVELS, SECTION_TYPES,
)

APP_TITLE = "工具学校 · 内容编辑器"


# ---------------------------------------------------------------- 控件助手
def label(text, dim=False):
    w = Gtk.Label(label=text, xalign=0)
    if dim:
        w.get_style_context().add_class("dim-label")
    return w


def bind_entry(obj, key, placeholder=""):
    e = Gtk.Entry()
    e.set_text(str(obj.get(key, "") or ""))
    e.set_placeholder_text(placeholder)
    e.connect("changed", lambda w: obj.__setitem__(key, w.get_text()))
    return e


def bind_text(obj, key, height=90):
    tv = Gtk.TextView()
    tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
    buf = tv.get_buffer()
    buf.set_text(str(obj.get(key, "") or ""))
    buf.connect("changed", lambda b: obj.__setitem__(
        key, b.get_text(b.get_start_iter(), b.get_end_iter(), False)))
    sw = Gtk.ScrolledWindow()
    sw.set_shadow_type(Gtk.ShadowType.IN)
    sw.set_size_request(-1, height)
    sw.add(tv)
    return sw


def bind_spin(obj, key, lo, hi):
    adj = Gtk.Adjustment(value=float(obj.get(key, lo) or lo), lower=lo, upper=hi, step_increment=1)
    s = Gtk.SpinButton(adjustment=adj, climb_rate=1, digits=0)
    s.connect("value-changed", lambda w: obj.__setitem__(key, int(w.get_value())))
    return s


def bind_combo(obj, key, options):
    c = Gtk.ComboBoxText()
    for o in options:
        c.append_text(str(o))
    cur = str(obj.get(key, options[0]) or options[0])
    if cur in [str(o) for o in options]:
        c.set_active([str(o) for o in options].index(cur))
    else:
        c.set_active(0)
        obj[key] = options[0]
    c.connect("changed", lambda w: obj.__setitem__(key, w.get_active_text()))
    return c


def field(title, widget, hint=None):
    box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
    head = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
    head.pack_start(label(title), False, False, 0)
    if hint:
        head.pack_start(label(hint, dim=True), False, False, 0)
    box.pack_start(head, False, False, 0)
    box.pack_start(widget, False, False, 0)
    box.set_margin_bottom(10)
    return box


def section(title, child):
    frame = Gtk.Frame(label=title)
    frame.set_margin_bottom(14)
    inner = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
    inner.set_border_width(12)
    inner.pack_start(child, False, False, 0)
    frame.add(inner)
    return frame


def focus_first(container):
    def walk(w):
        if isinstance(w, (Gtk.Entry, Gtk.TextView)) and w.get_visible() and w.get_sensitive():
            w.grab_focus()
            return True
        if isinstance(w, Gtk.Container):
            for c in w.get_children():
                if walk(c):
                    return True
        return False
    return walk(container)


def split_list(text):
    parts = re.split(r"[,，、\n]", text or "")
    return [p.strip() for p in parts if p.strip()]


def join_list(items):
    return "，".join(items or [])


# ---------------------------------------------------------------- 课程编辑器
class LessonEditor(Gtk.Box):
    def __init__(self, store, track, lesson, on_change):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        self.store = store
        self.track = track
        self.lesson = lesson
        self.on_change = on_change
        self.section_index = 0
        self.section_area = None

        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        inner = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        inner.set_border_width(18)

        inner.pack_start(self.build_meta(), False, False, 0)
        inner.pack_start(self.build_sections(), False, False, 0)
        inner.pack_start(self.build_exercise(), False, False, 0)
        inner.pack_start(self.build_quiz(), False, False, 0)

        scroll.add(inner)
        self.pack_start(scroll, True, True, 0)
        self.rebuild_sections()

    # ---------------- 基本信息
    def build_meta(self):
        grid = Gtk.Grid(column_spacing=12, row_spacing=8)
        grid.attach(label("课程 ID"), 0, 0, 1, 1)
        id_entry = Gtk.Entry()
        id_entry.set_text(self.lesson.get("id", ""))
        id_entry.set_editable(False)
        grid.attach(id_entry, 1, 0, 1, 1)
        grid.attach(label("轨道"), 2, 0, 1, 1)
        track_combo = self.bind_track()
        grid.attach(track_combo, 3, 0, 1, 1)
        grid.attach(label("顺序"), 0, 1, 1, 1)
        grid.attach(bind_spin(self.lesson, "order", 1, 999), 1, 1, 1, 1)
        grid.attach(label("时长（分钟）"), 2, 1, 1, 1)
        grid.attach(bind_spin(self.lesson, "minutes", 1, 60), 3, 1, 1, 1)
        grid.attach(label("难度"), 0, 2, 1, 1)
        grid.attach(bind_combo(self.lesson, "level", LEVELS), 1, 2, 1, 1)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        box.pack_start(grid, False, False, 0)
        box.pack_start(field("标题", bind_entry(self.lesson, "title")), False, False, 0)
        box.pack_start(field("副标题", bind_entry(self.lesson, "subtitle")), False, False, 0)

        goals = Gtk.TextView()
        goals.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        buf = goals.get_buffer()
        buf.set_text("\n".join(self.lesson.get("goal") or []))
        buf.connect("changed", lambda b: self.lesson.__setitem__(
            "goal", [x.strip() for x in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n") if x.strip()]))
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 70)
        sw.add(goals)
        box.pack_start(field("学习目标", sw, "每行一条"), False, False, 0)
        return section("基本信息", box)

    def bind_track(self):
        c = Gtk.ComboBoxText()
        for t in TRACKS:
            c.append_text(TRACK_NAMES[t])
        c.set_active(TRACKS.index(self.track))
        c.connect("changed", self.on_track_changed)
        return c

    def on_track_changed(self, combo):
        new_track = TRACKS[combo.get_active()]
        if new_track == self.track:
            return
        self.store.lessons[self.track].remove(self.lesson)
        self.lesson["track"] = new_track
        self.store.lessons[new_track].append(self.lesson)
        self.track = new_track
        self.on_change(rebuild=True)

    # ---------------- 章节
    def build_sections(self):
        self.listbox = Gtk.ListBox()
        self.listbox.set_selection_mode(Gtk.SelectionMode.SINGLE)
        self.listbox.connect("row-selected", self.on_section_selected)

        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 150)
        sw.add(self.listbox)
        self.sections_scroll = sw

        bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        self.type_combo = Gtk.ComboBoxText()
        for t in SECTION_TYPES:
            self.type_combo.append_text(t)
        self.type_combo.set_active(0)
        bar.pack_start(self.type_combo, False, False, 0)
        add = Gtk.Button(label="新增")
        add.connect("clicked", self.on_add_section)
        bar.pack_start(add, False, False, 0)
        up = Gtk.Button(label="上移")
        up.connect("clicked", lambda w: self.move_section(-1))
        bar.pack_start(up, False, False, 0)
        down = Gtk.Button(label="下移")
        down.connect("clicked", lambda w: self.move_section(1))
        bar.pack_start(down, False, False, 0)
        dup = Gtk.Button(label="复制")
        dup.connect("clicked", self.duplicate_section)
        bar.pack_start(dup, False, False, 0)
        dele = Gtk.Button(label="删除")
        dele.connect("clicked", self.delete_section)
        bar.pack_start(dele, False, False, 0)

        self.section_area = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        self.section_area.set_margin_top(8)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        box.pack_start(sw, False, False, 0)
        box.pack_start(bar, False, False, 0)
        box.pack_start(Gtk.Separator(), False, False, 6)
        box.pack_start(self.section_area, False, False, 0)
        return section("章节（7-12 个）", box)

    def rebuild_sections(self):
        for row in self.listbox.get_children():
            self.listbox.remove(row)
        for i, s in enumerate(self.lesson.get("sections") or []):
            row = Gtk.ListBoxRow()
            h = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            h.set_border_width(6)
            h.pack_start(label("%02d" % (i + 1), dim=True), False, False, 0)
            h.pack_start(label(s.get("type", "?")), False, False, 0)
            h.pack_start(label(s.get("title") or "（无标题）"), False, False, 0)
            row.add(h)
            self.listbox.add(row)
        if self.listbox.get_children():
            idx = min(self.section_index, len(self.listbox.get_children()) - 1)
            self.listbox.show_all()
            row = self.listbox.get_children()[idx]
            self.listbox.select_row(row)

            tries = {"n": 0}

            def do_scroll():
                tries["n"] += 1
                alloc = row.get_allocation()
                if alloc.y < 0 and tries["n"] < 20:
                    return True
                adj = self.sections_scroll.get_vadjustment()
                if alloc.y >= 0:
                    top = adj.get_value()
                    bottom = top + adj.get_page_size()
                    if alloc.y < top or alloc.y + alloc.height > bottom:
                        adj.set_value(max(0, min(alloc.y - 12, adj.get_upper() - adj.get_page_size())))
                return False
            GLib.idle_add(do_scroll)
        else:
            self.clear_section_area()

    def current_section(self):
        secs = self.lesson.get("sections") or []
        if 0 <= self.section_index < len(secs):
            return secs[self.section_index]
        return None

    def on_section_selected(self, box, row):
        if row is None:
            return
        self.section_index = row.get_index()
        self.build_section_form()

    def clear_section_area(self):
        for c in self.section_area.get_children():
            self.section_area.remove(c)

    def build_section_form(self):
        self.clear_section_area()
        s = self.current_section()
        if s is None:
            return
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        t = s.get("type")
        box.pack_start(label("类型： " + str(t), dim=True), False, False, 0)
        if t in ("text", "tip", "warn"):
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("正文 HTML", bind_text(s, "html", 150)), False, False, 0)
        elif t == "code":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("语言", bind_entry(s, "lang")), False, False, 0)
            box.pack_start(field("代码", bind_text(s, "text", 150)), False, False, 0)
            box.pack_start(field("备注", bind_entry(s, "note")), False, False, 0)
        elif t == "terminal":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("命令", bind_text(s, "command", 80)), False, False, 0)
            box.pack_start(field("输出", bind_text(s, "output", 100)), False, False, 0)
            box.pack_start(field("备注", bind_entry(s, "note")), False, False, 0)
        elif t == "table":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("表头", self.head_entry(s), "用逗号分隔"), False, False, 0)
            box.pack_start(field("行", self.rows_text(s), "每行一列，用 | 分隔"), False, False, 0)
        elif t == "steps":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("步骤", self.steps_text(s), "每行：标题 :: HTML"), False, False, 0)
        elif t == "compare":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            left = s.setdefault("left", {"label": "做法 A", "items": []})
            right = s.setdefault("right", {"label": "做法 B", "items": []})
            box.pack_start(field("左侧标题", bind_entry(left, "label")), False, False, 0)
            box.pack_start(field("左侧条目", self.items_text(left), "每行一条"), False, False, 0)
            box.pack_start(field("右侧标题", bind_entry(right, "label")), False, False, 0)
            box.pack_start(field("右侧条目", self.items_text(right), "每行一条"), False, False, 0)
            box.pack_start(field("备注", bind_entry(s, "note")), False, False, 0)
        elif t == "shortcuts":
            box.pack_start(field("标题", bind_entry(s, "title")), False, False, 0)
            box.pack_start(field("快捷键", self.shortcuts_text(s), "每行：操作 | mac 按键 | win 按键"), False, False, 0)
        self.section_area.pack_start(box, False, False, 0)
        self.section_area.show_all()
        if getattr(self, "focus_next_section", False):
            self.focus_next_section = False
            focus_first(box)

    def head_entry(self, s):
        e = Gtk.Entry()
        e.set_text("，".join(s.get("head") or []))
        e.connect("changed", lambda w: s.__setitem__("head", split_list(w.get_text())))
        return e

    def rows_text(self, s):
        tv = Gtk.TextView()
        tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        text = "\n".join(" | ".join(row) for row in (s.get("rows") or []))
        tv.get_buffer().set_text(text)

        def changed(b):
            rows = []
            for line in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n"):
                if line.strip() == "":
                    continue
                rows.append([c.strip() for c in line.split("|")])
            s["rows"] = rows
        tv.get_buffer().connect("changed", changed)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 100)
        sw.add(tv)
        return sw

    def steps_text(self, s):
        tv = Gtk.TextView()
        tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        tv.get_buffer().set_text("\n".join(
            (it.get("title") or "") + " :: " + (it.get("html") or "") for it in (s.get("items") or [])))

        def changed(b):
            items = []
            for line in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n"):
                if not line.strip():
                    continue
                if "::" in line:
                    title, html = line.split("::", 1)
                else:
                    title, html = line, ""
                items.append({"title": title.strip(), "html": html.strip()})
            s["items"] = items
        tv.get_buffer().connect("changed", changed)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 100)
        sw.add(tv)
        return sw

    def items_text(self, obj):
        tv = Gtk.TextView()
        tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        tv.get_buffer().set_text("\n".join(obj.get("items") or []))
        tv.get_buffer().connect("changed", lambda b: obj.__setitem__(
            "items", [x for x in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n") if x.strip()]))
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 90)
        sw.add(tv)
        return sw

    def shortcuts_text(self, s):
        tv = Gtk.TextView()
        tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        tv.get_buffer().set_text("\n".join(
            " | ".join([it.get("action", ""), "，".join(it.get("mac") or []), "，".join(it.get("win") or [])])
            for it in (s.get("items") or [])))

        def changed(b):
            items = []
            for line in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n"):
                if not line.strip():
                    continue
                parts = [p.strip() for p in line.split("|")]
                while len(parts) < 3:
                    parts.append("")
                items.append({
                    "action": parts[0],
                    "mac": split_list(parts[1]),
                    "win": split_list(parts[2]),
                })
            s["items"] = items
        tv.get_buffer().connect("changed", changed)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 120)
        sw.add(tv)
        return sw

    def on_add_section(self, button):
        t = self.type_combo.get_active_text() or "text"
        templates = {
            "text": {"type": "text", "title": "新章节", "html": "<p>内容</p>"},
            "tip": {"type": "tip", "title": "提示", "html": "<p>提示内容</p>"},
            "warn": {"type": "warn", "title": "注意", "html": "<p>风险说明</p>"},
            "steps": {"type": "steps", "title": "步骤", "items": [{"title": "第一步", "html": "<p>说明</p>"}]},
            "table": {"type": "table", "title": "表格", "head": ["列一", "列二"], "rows": [["", ""]]},
            "code": {"type": "code", "title": "代码", "lang": "text", "text": ""},
            "terminal": {"type": "terminal", "title": "终端", "command": "", "output": ""},
            "shortcuts": {"type": "shortcuts", "title": "快捷键", "items": [{"action": "", "mac": [], "win": []}]},
            "compare": {"type": "compare", "title": "对比", "left": {"label": "做法 A", "items": [""]},
                        "right": {"label": "做法 B", "items": [""]}},
        }
        self.lesson.setdefault("sections", []).append(templates.get(t, templates["text"]))
        self.section_index = len(self.lesson["sections"]) - 1
        self.focus_next_section = True
        self.rebuild_sections()

    def move_section(self, delta):
        secs = self.lesson.get("sections") or []
        i = self.section_index
        j = i + delta
        if 0 <= i < len(secs) and 0 <= j < len(secs):
            secs[i], secs[j] = secs[j], secs[i]
            self.section_index = j
            self.rebuild_sections()

    def duplicate_section(self):
        secs = self.lesson.get("sections") or []
        if 0 <= self.section_index < len(secs):
            import copy
            secs.insert(self.section_index + 1, copy.deepcopy(secs[self.section_index]))
            self.section_index += 1
            self.rebuild_sections()

    def delete_section(self):
        secs = self.lesson.get("sections") or []
        if 0 <= self.section_index < len(secs) and len(secs) > 1:
            secs.pop(self.section_index)
            self.section_index = max(0, self.section_index - 1)
            self.rebuild_sections()

    # ---------------- 练习
    def build_exercise(self):
        ex = self.lesson.setdefault("exercise", {"title": "动手练一练", "brief": "", "items": [], "done": ""})
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        box.pack_start(field("标题", bind_entry(ex, "title")), False, False, 0)
        box.pack_start(field("说明", bind_entry(ex, "brief")), False, False, 0)

        tv = Gtk.TextView()
        tv.set_wrap_mode(Gtk.WrapMode.WORD_CHAR)
        tv.get_buffer().set_text("\n".join(
            (it.get("text") or "") + (" :: " + it.get("cmd") if it.get("cmd") else "") for it in (ex.get("items") or [])))
        def changed(b):
            items = []
            for line in b.get_text(b.get_start_iter(), b.get_end_iter(), False).split("\n"):
                if not line.strip():
                    continue
                if "::" in line:
                    text, cmd = line.split("::", 1)
                else:
                    text, cmd = line, ""
                items.append({"text": text.strip(), "cmd": cmd.strip()})
            ex["items"] = items
        tv.get_buffer().connect("changed", changed)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.set_size_request(-1, 90)
        sw.add(tv)
        box.pack_start(field("练习步骤", sw, "每行：文本 :: 命令（命令可省略）"), False, False, 0)
        box.pack_start(field("完成标准", bind_entry(ex, "done")), False, False, 0)
        return section("动手练一练", box)

    # ---------------- 测验
    def build_quiz(self):
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        quiz = self.lesson.setdefault("quiz", [])
        while len(quiz) < 3:
            quiz.append({"q": "问题", "options": ["A", "B", "C", "D"], "answer": 0, "explain": ""})
        for i, q in enumerate(quiz[:3]):
            sub = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
            sub.set_border_width(8)
            sub.pack_start(field("第 %d 题" % (i + 1), bind_entry(q, "q")), False, False, 0)
            opts = q.setdefault("options", ["", "", "", ""])
            for oi in range(4):
                e = Gtk.Entry()
                e.set_text(opts[oi] if oi < len(opts) else "")
                e.connect("changed", lambda w, idx=oi, arr=opts, qq=q: self.set_option(qq, idx, w.get_text()))
                sub.pack_start(field("选项 " + "ABCD"[oi], e), False, False, 0)
            ans = Gtk.ComboBoxText()
            for k in range(4):
                ans.append_text("ABCD"[k])
            ans.set_active(int(q.get("answer", 0)))
            ans.connect("changed", lambda w, qq=q: qq.__setitem__("answer", w.get_active()))
            sub.pack_start(field("正确答案", ans), False, False, 0)
            sub.pack_start(field("解析", bind_text(q, "explain", 70)), False, False, 0)
            box.pack_start(sub, False, False, 0)
        return section("小测验（3 题）", box)

    def set_option(self, q, idx, value):
        opts = q.setdefault("options", ["", "", "", ""])
        while len(opts) < 4:
            opts.append("")
        opts[idx] = value


# ---------------------------------------------------------------- 速查数据
REF_FIELDS = {
    "commands": [
        ("tool", "工具", "combo", ["terminal", "git", "vscode", "node", "python", "docker", "ssh"]),
        ("cmd", "命令", "entry", None),
        ("win", "Windows 写法", "entry", None),
        ("mac", "macOS 写法", "entry", None),
        ("desc", "说明", "text", 70),
        ("tags", "标签", "list", None),
        ("os", "可用系统", "os", None),
    ],
    "shortcuts": [
        ("app", "应用", "entry", None),
        ("cat", "分类", "entry", None),
        ("action", "操作", "entry", None),
        ("mac", "macOS 按键", "list", None),
        ("win", "Windows 按键", "list", None),
        ("linux", "Linux 按键", "list", None),
    ],
    "glossary": [
        ("term", "术语", "entry", None),
        ("en", "英文", "entry", None),
        ("desc", "说明", "text", 80),
    ],
}


class RefsEditor(Gtk.Box):
    def __init__(self, store, on_change, kind="commands"):
        super().__init__(orientation=Gtk.Orientation.HORIZONTAL, spacing=0)
        self.store = store
        self.on_change = on_change
        self.kind = kind
        self.index = 0

        side = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        side.set_size_request(320, -1)
        side.set_border_width(10)
        self.kind_combo = Gtk.ComboBoxText()
        for k, name in (("commands", "命令"), ("shortcuts", "快捷键"), ("glossary", "术语")):
            self.kind_combo.append_text(name)
        self.kind_combo.set_active(["commands", "shortcuts", "glossary"].index(kind))
        self.kind_combo.connect("changed", self.on_kind_changed)
        side.pack_start(self.kind_combo, False, False, 0)

        self.search = Gtk.SearchEntry()
        self.search.connect("search-changed", lambda w: self.rebuild_list())
        side.pack_start(self.search, False, False, 0)

        self.listbox = Gtk.ListBox()
        self.listbox.connect("row-selected", self.on_row_selected)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.add(self.listbox)
        self.scroll = sw
        side.pack_start(sw, True, True, 0)

        bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        add = Gtk.Button(label="新增")
        add.connect("clicked", self.add_item)
        bar.pack_start(add, False, False, 0)
        dele = Gtk.Button(label="删除")
        dele.connect("clicked", self.delete_item)
        bar.pack_start(dele, False, False, 0)
        side.pack_start(bar, False, False, 0)

        self.form = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        self.form.set_border_width(16)
        fsw = Gtk.ScrolledWindow()
        fsw.add(self.form)

        self.pack_start(side, False, False, 0)
        self.pack_start(Gtk.Separator(orientation=Gtk.Orientation.VERTICAL), False, False, 0)
        self.pack_start(fsw, True, True, 0)
        self.rebuild_list()

    def items(self):
        return self.store.refs[self.kind]

    def on_kind_changed(self, combo):
        self.kind = ["commands", "shortcuts", "glossary"][combo.get_active()]
        self.index = 0
        self.search.set_text("")
        self.rebuild_list()

    def label_for(self, item):
        if self.kind == "commands":
            return item.get("cmd", "")
        if self.kind == "shortcuts":
            return item.get("action", "")
        return item.get("term", "")

    def rebuild_list(self):
        for row in self.listbox.get_children():
            self.listbox.remove(row)
        q = self.search.get_text().strip().lower()
        for i, item in enumerate(self.items()):
            text = self.label_for(item) + " " + json.dumps(item, ensure_ascii=False)
            if q and q not in text.lower():
                continue
            row = Gtk.ListBoxRow()
            row.set_name(str(i))
            row.add(label(self.label_for(item) or "（空）"))
            self.listbox.add(row)
        rows = self.listbox.get_children()
        if rows:
            idx = min(self.index, len(rows) - 1)
            self.listbox.show_all()
            row = rows[idx]
            self.listbox.select_row(row)
            self.scroll_to(row)
        else:
            self.build_form(None)

    def scroll_to(self, row):
        tries = {"n": 0}

        def do_scroll():
            tries["n"] += 1
            alloc = row.get_allocation()
            if alloc.y < 0 and tries["n"] < 20:
                return True
            adj = self.scroll.get_vadjustment()
            if alloc.y >= 0:
                top = adj.get_value()
                bottom = top + adj.get_page_size()
                if alloc.y < top or alloc.y + alloc.height > bottom:
                    adj.set_value(max(0, min(alloc.y - 12, adj.get_upper() - adj.get_page_size())))
            return False
        GLib.idle_add(do_scroll)

    def on_row_selected(self, box, row):
        if row is None:
            return
        self.index = int(row.get_name())
        self.build_form(self.items()[self.index])

    def build_form(self, item):
        for c in self.form.get_children():
            self.form.remove(c)
        if item is None:
            self.form.pack_start(label("没有数据"), False, False, 0)
            self.form.show_all()
            return
        for key, title, kind, extra in REF_FIELDS[self.kind]:
            if kind == "entry":
                self.form.pack_start(field(title, bind_entry(item, key)), False, False, 0)
            elif kind == "text":
                self.form.pack_start(field(title, bind_text(item, key, extra or 80)), False, False, 0)
            elif kind == "combo":
                self.form.pack_start(field(title, bind_combo(item, key, extra)), False, False, 0)
            elif kind == "list":
                e = Gtk.Entry()
                e.set_text(join_list(item.get(key) or []))
                e.connect("changed", lambda w, k=key, obj=item: obj.__setitem__(k, split_list(w.get_text())))
                self.form.pack_start(field(title, e, "用逗号分隔"), False, False, 0)
            elif kind == "os":
                box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
                current = set(item.get("os") or [])
                self.os_checks = []
                for value, name in (("mac", "macOS"), ("linux", "Linux"), ("win", "Windows")):
                    cb = Gtk.CheckButton(label=name)
                    cb.set_active(value in current)
                    cb.connect("toggled", lambda w, obj=item: self.sync_os(obj))
                    box.pack_start(cb, False, False, 0)
                    self.os_checks.append((value, cb))
                self.form.pack_start(field("可用系统", box, "不勾选表示全部"), False, False, 0)
        self.form.show_all()
        if getattr(self, "focus_next", False):
            self.focus_next = False
            focus_first(self.form)

    def sync_os(self, item):
        chosen = [v for v, cb in self.os_checks if cb.get_active()]
        if len(chosen) == 3:
            item.pop("os", None)
        elif chosen:
            item["os"] = chosen
        else:
            item.pop("os", None)

    def add_item(self):
        if self.kind == "commands":
            item = {"tool": "terminal", "cmd": "", "desc": "", "tags": []}
        elif self.kind == "shortcuts":
            item = {"app": "", "cat": "", "action": "", "mac": [], "win": []}
        else:
            item = {"term": "", "en": "", "desc": ""}
        self.items().append(item)
        self.index = len(self.items()) - 1
        self.focus_next = True
        if self.search.get_text():
            self.search.set_text("")
        self.rebuild_list()

    def delete_item(self):
        if 0 <= self.index < len(self.items()):
            self.items().pop(self.index)
            self.index = max(0, self.index - 1)
            self.rebuild_list()


# ---------------------------------------------------------------- 主窗口
class App(Gtk.Window):
    def __init__(self, store):
        super().__init__(title=APP_TITLE)
        self.store = store
        self.set_default_size(1280, 860)
        self.preview_tmp = None
        self.current = None

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_title(APP_TITLE)
        header.set_subtitle("保存时自动备份，可撤销")
        self.set_titlebar(header)

        save = Gtk.Button(label="保存")
        save.get_style_context().add_class("suggested-action")
        save.connect("clicked", lambda w: self.save())
        header.pack_start(save)

        undo = Gtk.Button(label="撤销上次保存")
        undo.connect("clicked", lambda w: self.undo())
        header.pack_start(undo)

        new = Gtk.Button(label="新建课程")
        new.connect("clicked", lambda w: self.new_lesson())
        header.pack_start(new)

        delete = Gtk.Button(label="删除课程")
        delete.connect("clicked", lambda w: self.delete_lesson())
        header.pack_start(delete)

        preview = Gtk.Button(label="刷新预览")
        preview.connect("clicked", lambda w: self.refresh_preview())
        header.pack_end(preview)

        root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        paned = Gtk.Paned(orientation=Gtk.Orientation.HORIZONTAL)
        paned.set_position(300)

        side = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        side.set_border_width(8)
        self.search = Gtk.SearchEntry()
        self.search.set_placeholder_text("搜索课程")
        self.search.connect("search-changed", lambda w: self.rebuild_tree())
        side.pack_start(self.search, False, False, 0)
        self.tree = Gtk.TreeView()
        self.tree.set_headers_visible(False)
        renderer = Gtk.CellRendererText()
        column = Gtk.TreeViewColumn("内容", renderer, text=1)
        self.tree.append_column(column)
        self.tree.get_selection().connect("changed", self.on_tree_select)
        sw = Gtk.ScrolledWindow()
        sw.set_shadow_type(Gtk.ShadowType.IN)
        sw.add(self.tree)
        side.pack_start(sw, True, True, 0)
        paned.pack1(side, False, False)

        self.notebook = Gtk.Notebook()
        self.editor_scroll = Gtk.ScrolledWindow()
        self.editor_holder = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        self.editor_scroll.add(self.editor_holder)
        self.notebook.append_page(self.editor_scroll, Gtk.Label(label="编辑"))
        self.web = WebKit2.WebView()
        self.notebook.append_page(self.web, Gtk.Label(label="预览"))
        self.notebook.connect("switch-page", self.on_page_switch)
        paned.pack2(self.notebook, True, False)

        root.pack_start(paned, True, True, 0)
        self.status = Gtk.Statusbar()
        self.ctx = self.status.get_context_id("main")
        root.pack_start(self.status, False, False, 0)
        self.add(root)

        self.rebuild_tree()
        self.connect("key-press-event", self.on_key)
        self.show_all()
        self.select_first_lesson()

    def select_first_lesson(self):
        model = self.tree.get_model()
        it = model.get_iter_first()
        while it:
            child = model.iter_children(it)
            while child:
                if str(model[child][0]).startswith("lesson:"):
                    self.tree.get_selection().select_iter(child)
                    return
                child = model.iter_next(child)
            it = model.iter_next(it)

    # ---------------- 侧栏
    def rebuild_tree(self):
        model = Gtk.TreeStore(str, str)
        q = self.search.get_text().strip().lower()
        for t in TRACKS:
            lessons = [l for l in self.store.lessons[t] if not q or q in (l.get("title", "") + l.get("id", "")).lower()]
            if q and not lessons:
                continue
            parent = model.append(None, ["track:" + t, TRACK_NAMES[t] + "（%d）" % len(self.store.lessons[t])])
            for l in lessons:
                model.append(parent, ["lesson:" + l.get("id", ""), "  " + l.get("title", "")])
        parent = model.append(None, ["refs", "速查数据"])
        for kind, name in (("commands", "命令"), ("shortcuts", "快捷键"), ("glossary", "术语")):
            model.append(parent, ["refs:" + kind, "  " + name])
        self.tree.set_model(model)
        self.tree.expand_all()
        self.status.push(self.ctx, "共 %d 节课 · %d 条命令 · %d 个快捷键 · %d 条术语" % (
            len(self.store.all_lessons()), len(self.store.refs["commands"]),
            len(self.store.refs["shortcuts"]), len(self.store.refs["glossary"])))

    def on_tree_select(self, selection):
        model, it = selection.get_selected()
        if it is None:
            return
        key = model[it][0]
        if key.startswith("lesson:"):
            lid = key.split(":", 1)[1]
            track, lesson = self.store.find(lid)
            if lesson is not None:
                self.current = lesson
                self.show_editor(LessonEditor(self.store, track, lesson, self.on_lesson_change))
        elif key.startswith("refs:"):
            self.current = key
            kind = key.split(":", 1)[1]
            self.show_editor(RefsEditor(self.store, None, kind))
        elif key.startswith("track:"):
            pass

    def show_editor(self, widget):
        for c in self.editor_holder.get_children():
            self.editor_holder.remove(c)
        self.editor_holder.pack_start(widget, True, True, 0)
        self.editor_holder.show_all()

    def on_lesson_change(self, rebuild=False):
        if rebuild:
            self.rebuild_tree()
            if isinstance(self.current, dict):
                self.select_lesson(self.current.get("id", ""))
        self.status.push(self.ctx, "有未保存的修改")

    # ---------------- 操作
    def save(self):
        try:
            problems = self.store.save()
        except Exception as exc:  # noqa: BLE001
            self.error("保存失败", str(exc))
            return
        self.rebuild_tree()
        if problems:
            self.error("已保存，但有 %d 个问题" % len(problems), "\n".join(problems[:12]))
        else:
            self.status.push(self.ctx, "已保存并重新生成数据文件（已备份）")
        self.refresh_preview(quiet=True)

    def undo(self):
        try:
            name = self.store.undo()
        except Exception as exc:  # noqa: BLE001
            self.error("撤销失败", str(exc))
            return
        self.rebuild_tree()
        self.status.push(self.ctx, "已回滚到备份 " + name)
        self.refresh_preview(quiet=True)

    def new_lesson(self):
        dialog = Gtk.Dialog(title="新建课程", transient_for=self, flags=0)
        dialog.add_buttons("取消", Gtk.ResponseType.CANCEL, "创建", Gtk.ResponseType.OK)
        box = dialog.get_content_area()
        box.set_border_width(16)
        track_combo = Gtk.ComboBoxText()
        for t in TRACKS:
            track_combo.append_text(TRACK_NAMES[t])
        track_combo.set_active(TRACKS.index("agents"))
        box.add(field("轨道", track_combo))
        id_entry = Gtk.Entry()
        id_entry.set_placeholder_text("小写英文与连字符，例如 my-lesson")
        box.add(field("课程 ID", id_entry))
        title_entry = Gtk.Entry()
        box.add(field("标题", title_entry))
        dialog.show_all()
        if dialog.run() != Gtk.ResponseType.OK:
            dialog.destroy()
            return
        track = TRACKS[track_combo.get_active()]
        lid = id_entry.get_text().strip()
        title = title_entry.get_text().strip()
        dialog.destroy()
        if not re.match(r"^[a-z0-9][a-z0-9-]*$", lid):
            self.error("课程 ID 不合法", "只能用小写字母、数字和连字符")
            return
        if self.store.find(lid)[1] is not None:
            self.error("课程 ID 已存在", lid)
            return
        if not title:
            self.error("缺少标题", "请填写课程标题")
            return
        lesson = self.store.make_default_lesson(track, lid, title)
        self.store.lessons[track].append(lesson)
        self.rebuild_tree()
        self.status.push(self.ctx, "已创建课程，记得保存")
        self.select_lesson(lid)

    def delete_lesson(self):
        if not isinstance(self.current, dict):
            return
        lid = self.current.get("id")
        dialog = Gtk.MessageDialog(
            transient_for=self, flags=0, message_type=Gtk.MessageType.QUESTION,
            buttons=Gtk.ButtonsType.OK_CANCEL, text="删除课程 " + str(lid) + "？")
        dialog.format_secondary_text("删除后可以点「撤销上次保存」恢复。")
        if dialog.run() != Gtk.ResponseType.OK:
            dialog.destroy()
            return
        dialog.destroy()
        track, lesson = self.store.find(lid)
        if lesson is not None:
            self.store.lessons[track].remove(lesson)
        self.current = None
        self.rebuild_tree()
        self.show_editor(Gtk.Label(label="选择左侧的课程开始编辑"))
        self.status.push(self.ctx, "已删除，记得保存")

    def select_lesson(self, lid):
        model = self.tree.get_model()
        if model is None:
            return
        it = model.get_iter_first()
        while it:
            child = model.iter_children(it)
            while child:
                if model[child][0] == "lesson:" + lid:
                    self.tree.get_selection().select_iter(child)
                    return
                child = model.iter_next(child)
            it = model.iter_next(it)

    def refresh_preview(self, quiet=False):
        lid = self.current.get("id") if isinstance(self.current, dict) else None
        try:
            url, tmp = self.store.make_preview(lid)
        except Exception as exc:  # noqa: BLE001
            if not quiet:
                self.error("预览失败", str(exc))
            return
        if self.preview_tmp is not None:
            import shutil
            shutil.rmtree(self.preview_tmp, ignore_errors=True)
        self.preview_tmp = tmp
        self.web.load_uri(url)
        if not quiet:
            self.notebook.set_current_page(1)

    def on_page_switch(self, notebook, page, page_num):
        if page_num == 1:
            self.refresh_preview()

    def on_key(self, widget, event):
        ctrl = bool(event.state & Gdk.ModifierType.CONTROL_MASK)
        if ctrl and event.keyval in (Gdk.KEY_s, Gdk.KEY_S):
            self.save()
            return True
        if event.keyval == Gdk.KEY_F5:
            self.refresh_preview()
            return True
        if ctrl and event.keyval in (Gdk.KEY_n, Gdk.KEY_N):
            self.new_lesson()
            return True
        return False

    def error(self, title, message):
        dialog = Gtk.MessageDialog(
            transient_for=self, flags=0, message_type=Gtk.MessageType.WARNING,
            buttons=Gtk.ButtonsType.OK, text=title)
        dialog.format_secondary_text(message)
        dialog.run()
        dialog.destroy()


def selftest():
    store = Store()
    app = App(store)
    lessons = store.all_lessons()
    for lesson in lessons:
        track, found = store.find(lesson["id"])
        app.show_editor(LessonEditor(store, track, found, app.on_lesson_change))
    app.show_editor(RefsEditor(store, None))
    print("selftest ok:", len(lessons), "lessons")
    app.destroy()
    return 0


def main():
    if "--selftest" in sys.argv:
        return selftest()
    store = Store()
    app = App(store)
    app.connect("destroy", Gtk.main_quit)
    Gtk.main()
    return 0


if __name__ == "__main__":
    sys.exit(main())
