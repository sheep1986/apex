#!/bin/bash

echo "🚀 Setting up your React development environment..."
echo ""

# Check if VS Code is running
if pgrep -x "Visual Studio Code" > /dev/null; then
    echo "📝 VS Code is running. Please close it first, then run this script again."
    exit 1
fi

# Try to find VS Code and set up CLI
vscode_paths=(
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    "/usr/local/bin/code"
    "$HOME/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
)

code_command=""
for path in "${vscode_paths[@]}"; do
    if [ -f "$path" ]; then
        code_command="$path"
        break
    fi
done

# Create symlink for code command if found
if [ -n "$code_command" ] && [ ! -f "/usr/local/bin/code" ]; then
    echo "🔗 Setting up VS Code CLI..."
    sudo ln -sf "$code_command" /usr/local/bin/code 2>/dev/null || {
        echo "⚠️  Could not create symlink. You may need to enable VS Code CLI manually."
    }
fi

# Check if code command is now available
if command -v code &> /dev/null; then
    echo "✅ VS Code CLI found!"
    
    # Install extensions
    echo "📦 Installing VS Code extensions..."
    
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
    
    for extension in "${extensions[@]}"; do
        echo "  📋 Installing $extension..."
        code --install-extension "$extension" --force
    done
    
    echo ""
    echo "🎉 All extensions installed successfully!"
    
else
    echo "❌ VS Code CLI not found."
    echo ""
    echo "🔧 Manual Setup Required:"
    echo "1. Open VS Code"
    echo "2. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)"
    echo "3. Type: Shell Command: Install 'code' command in PATH"
    echo "4. Run this script again"
    echo ""
    echo "📋 Or install extensions manually using the IDs in SETUP_EXTENSIONS.md"
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Open this project in VS Code:"
echo "   code /Users/seanwentz/Desktop/Apex/apps/frontend"
echo "2. Install any missing extensions from the recommendations"
echo "3. Restart VS Code if needed"
echo "4. Start coding with pnpm dev"
echo ""
echo "📚 See DEVELOPMENT.md for the complete development guide!"