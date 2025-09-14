#!/usr/bin/env bash
set -euo pipefail
if grep -R -n -E '^\s*(TSX?|EOF)(\s*<\s*/dev/null)?\s*$' src --include='*.ts' --include='*.tsx' >/dev/null; then
  echo "❌ Heredoc markers detected in source files. Please remove them."
  exit 1
fi
echo "✅ No heredoc markers detected."