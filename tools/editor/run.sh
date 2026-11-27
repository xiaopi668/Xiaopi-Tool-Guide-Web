#!/usr/bin/env bash
# 启动工具学校内容编辑器
set -e
cd "$(dirname "$0")/../.."
exec python3 tools/editor/editor.py "$@"
