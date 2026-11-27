#!/usr/bin/env bash
# 卸载编辑器
set -euo pipefail

BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"

rm -f "$BIN_DIR/tool-school-editor"
rm -f "$DATA_DIR/applications/tool-school-editor.desktop"
rm -f "$DATA_DIR/icons/hicolor/scalable/apps/tool-school-editor.svg"

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DATA_DIR/applications" >/dev/null 2>&1 || true
echo "已卸载。仓库里的 tools/editor 保持不变。"
