#!/usr/bin/env bash
# 把编辑器安装到当前用户的应用菜单与 PATH
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
APPS_DIR="$DATA_DIR/applications"
ICON_DIR="$DATA_DIR/icons/hicolor/scalable/apps"

mkdir -p "$BIN_DIR" "$APPS_DIR" "$ICON_DIR"

# 启动器：固定指向当前仓库位置；仓库移动后重新运行本脚本即可
cat > "$BIN_DIR/tool-school-editor" <<EOF
#!/usr/bin/env bash
exec python3 "$REPO/tools/editor/editor.py" "\$@"
EOF
chmod 755 "$BIN_DIR/tool-school-editor"

install -m 644 "$REPO/tools/editor/icon.svg" "$ICON_DIR/tool-school-editor.svg"

cat > "$APPS_DIR/tool-school-editor.desktop" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=工具学校 · 内容编辑器
Comment=编辑课程、命令、快捷键与术语
Exec="$BIN_DIR/tool-school-editor"
Icon=tool-school-editor
Terminal=false
Categories=Development;
Keywords=prompt;tools;editor;course;
EOF
chmod 644 "$APPS_DIR/tool-school-editor.desktop"

# 刷新桌面数据库与图标缓存（失败不影响安装）
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$DATA_DIR/icons/hicolor" >/dev/null 2>&1 || true

echo "已安装："
echo "  命令    $BIN_DIR/tool-school-editor"
echo "  菜单项  $APPS_DIR/tool-school-editor.desktop"
echo "  图标    $ICON_DIR/tool-school-editor.svg"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "提示：$BIN_DIR 不在 PATH 里，可把它加入 PATH，或直接用应用菜单打开。" ;;
esac
