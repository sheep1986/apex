# 🛠 VS Code Extensions Setup Guide

## 🚀 Quick Setup (Recommended)

### Option 1: Automatic Installation
1. **Enable VS Code CLI** (one-time setup):
   - Open VS Code
   - Press `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows/Linux)
   - Type: `Shell Command: Install 'code' command in PATH`
   - Press Enter

2. **Run the installation script**:
   ```bash
   cd /Users/seanwentz/Desktop/Apex/apps/frontend
   ./install-extensions.sh
   ```

### Option 2: Manual Installation
Copy and paste each extension ID in VS Code:

1. Press `Cmd + Shift + X` (macOS) or `Ctrl + Shift + X` (Windows/Linux) to open Extensions
2. Paste each ID below in the search box and install:

## 📋 Essential Extensions

### **Code Quality & Formatting**
- `esbenp.prettier-vscode` - **Prettier** (Auto-format code)
- `dbaeumer.vscode-eslint` - **ESLint** (Find and fix problems)
- `usernamehw.errorlens` - **Error Lens** (Inline error highlighting)

### **React & TypeScript**
- `ms-vscode.vscode-typescript-next` - **TypeScript** (Enhanced TS support)
- `formulahendry.auto-rename-tag` - **Auto Rename Tag** (Rename paired tags)

### **Tailwind CSS**
- `bradlc.vscode-tailwindcss` - **Tailwind CSS IntelliSense** (Autocomplete & preview)
- `zignd.html-css-class-completion` - **CSS Class Completion** (HTML class autocomplete)

### **Developer Experience**
- `christian-kohler.path-intellisense` - **Path Intellisense** (File path autocomplete)
- `eamodio.gitlens` - **GitLens** (Enhanced Git capabilities)

## 🎯 Quick Install Commands

If you have VS Code CLI enabled, run these one-by-one:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension usernamehw.errorlens
code --install-extension eamodio.gitlens
code --install-extension zignd.html-css-class-completion
```

## ✅ Verification

After installing, you should see:
- ✅ Code formats automatically on save (Prettier)
- ✅ Tailwind classes show autocomplete with previews
- ✅ Errors appear inline with red squiggly lines
- ✅ TypeScript provides intelligent suggestions
- ✅ File paths autocomplete when typing

## 🔄 Final Step

**Restart VS Code** to activate all extensions and settings!

---

🎉 **You're all set!** Your development environment is now optimized for React + TypeScript + Tailwind development.