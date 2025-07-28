#!/bin/bash

echo "🚀 Installing VS Code Extensions for React Development..."

# Check if VS Code CLI is available
if ! command -v code &> /dev/null; then
    echo "❌ VS Code command line tools not found."
    echo "📥 To install VS Code CLI:"
    echo "   1. Open VS Code"
    echo "   2. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)"
    echo "   3. Type 'Shell Command: Install code command in PATH'"
    echo "   4. Run this script again"
    echo ""
    echo "📋 Or install extensions manually:"
    echo "   - esbenp.prettier-vscode"
    echo "   - dbaeumer.vscode-eslint"
    echo "   - bradlc.vscode-tailwindcss"
    echo "   - ms-vscode.vscode-typescript-next"
    echo "   - formulahendry.auto-rename-tag"
    echo "   - christian-kohler.path-intellisense"
    echo "   - usernamehw.errorlens"
    echo "   - eamodio.gitlens"
    echo "   - zignd.html-css-class-completion"
    exit 1
fi

# Essential extensions
extensions=(
    "esbenp.prettier-vscode"
    "dbaeumer.vscode-eslint"
    "bradlc.vscode-tailwindcss"
    "ms-vscode.vscode-typescript-next"
    "formulahendry.auto-rename-tag"
    "christian-kohler.path-intellisense"
    "usernamehw.errorlens"
    "eamodio.gitlens"
    "zignd.html-css-class-completion"
)

echo "Installing ${#extensions[@]} essential extensions..."

for extension in "${extensions[@]}"; do
    echo "📦 Installing $extension..."
    code --install-extension "$extension"
done

echo ""
echo "✅ All extensions installed!"
echo "🔄 Please restart VS Code to activate all extensions."
echo "🎉 Your development environment is ready!"