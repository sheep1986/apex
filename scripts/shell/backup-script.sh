#!/bin/bash

# Apex AI Backup Script
# Usage: ./backup-script.sh [description]

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get optional description from command line
DESCRIPTION=${1:-"manual_backup"}

# Create backup directory name
BACKUP_DIR="backup_${TIMESTAMP}_${DESCRIPTION}"

# Full path for backup
BACKUP_PATH="/Users/seanwentz/Desktop/${BACKUP_DIR}"

echo "🚀 Starting Apex AI backup..."
echo "📁 Backup location: ${BACKUP_PATH}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Copy source files (excluding node_modules and other large files)
echo "📋 Copying source files..."

# Copy frontend source
cp -r "apps/frontend/src" "${BACKUP_PATH}/frontend_src"

# Copy important config files
cp package.json "${BACKUP_PATH}/" 2>/dev/null || true
cp pnpm-lock.yaml "${BACKUP_PATH}/" 2>/dev/null || true
cp .gitignore "${BACKUP_PATH}/" 2>/dev/null || true
cp README.md "${BACKUP_PATH}/" 2>/dev/null || true

# Copy any backend files if they exist
if [ -d "apps/backend" ]; then
    cp -r "apps/backend" "${BACKUP_PATH}/"
fi

# Create backup info file
cat > "${BACKUP_PATH}/BACKUP_INFO.txt" << EOF
APEX AI PROJECT BACKUP
=====================

Backup Created: $(date)
Description: ${DESCRIPTION}
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "No git repository")
Git Branch: $(git branch --show-current 2>/dev/null || echo "No git repository")

Files Included:
- Frontend source code (apps/frontend/src/)
- Package configuration files
- Backend files (if present)
- Git configuration

To Restore:
1. Copy frontend_src/ back to apps/frontend/src/
2. Copy config files back to project root
3. Run: npm install or pnpm install
4. Start development server

Notes:
- This backup excludes node_modules (run npm/pnpm install after restore)
- This backup excludes build artifacts
- Environment files (.env) are excluded for security
EOF

# Create git bundle if git repository exists
if [ -d ".git" ]; then
    echo "📦 Creating git bundle..."
    git bundle create "${BACKUP_PATH}/apex-ai-git-backup.bundle" --all
fi

# Create a zip archive of the backup
echo "🗜️ Creating compressed archive..."
cd "/Users/seanwentz/Desktop"
zip -r "${BACKUP_DIR}.zip" "${BACKUP_DIR}" > /dev/null

# Calculate sizes
BACKUP_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
ZIP_SIZE=$(du -sh "${BACKUP_DIR}.zip" | cut -f1)

echo "✅ Backup completed successfully!"
echo ""
echo "📊 Backup Summary:"
echo "   • Backup folder: ${BACKUP_SIZE}"
echo "   • Compressed archive: ${ZIP_SIZE}"
echo "   • Location: ${BACKUP_PATH}"
echo "   • Archive: ${BACKUP_PATH}.zip"
echo ""
echo "💡 Quick restore command:"
echo "   cp -r \"${BACKUP_PATH}/frontend_src\" \"apps/frontend/src\""
echo ""
echo "🎯 To create a new backup with description:"
echo "   ./backup-script.sh \"your_description_here\""