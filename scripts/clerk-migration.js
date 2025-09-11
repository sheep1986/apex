#!/usr/bin/env node

/**
 * Automated Clerk deprecation migration script
 * Run: node scripts/clerk-migration.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n${'='.repeat(msg.length)}`),
};

// Check if jscodeshift is installed
function ensureJscodeshift() {
  try {
    execSync('npx jscodeshift --version', { stdio: 'ignore' });
    return true;
  } catch {
    log.info('Installing jscodeshift...');
    execSync('pnpm add -D jscodeshift', { stdio: 'inherit' });
    return true;
  }
}

// Find all files with deprecated Clerk props
function findDeprecatedUsages() {
  log.header('Scanning for deprecated Clerk props...');
  
  const deprecatedPatterns = [
    'afterSignInUrl',
    'afterSignUpUrl',
    'afterSignOutUrl',
    'navigate.*ClerkProvider', // ClerkProvider navigate prop
  ];
  
  const files = new Set();
  
  deprecatedPatterns.forEach(pattern => {
    try {
      const result = execSync(
        `grep -r "${pattern}" src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" -l 2>/dev/null || true`,
        { encoding: 'utf8' }
      );
      
      result.split('\n').filter(Boolean).forEach(file => files.add(file));
    } catch {
      // Grep returns non-zero if no matches, that's ok
    }
  });
  
  return Array.from(files);
}

// Backup files before migration
function backupFiles(files) {
  const backupDir = path.join(process.cwd(), '.clerk-migration-backup');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  log.info(`Creating backup in ${backupDir}`);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const backupPath = path.join(backupDir, path.basename(file) + '.backup');
    fs.writeFileSync(backupPath, content);
  });
  
  log.success(`Backed up ${files.length} files`);
  return backupDir;
}

// Run the codemod
function runCodemod(files) {
  if (files.length === 0) {
    log.success('No deprecated Clerk props found! 🎉');
    return { success: true, filesChanged: 0 };
  }
  
  log.header('Running codemod...');
  
  const codemodPath = path.join(__dirname, 'codemods', 'clerk-redirect-props.cjs');
  
  // Check if codemod exists
  if (!fs.existsSync(codemodPath)) {
    log.error(`Codemod not found at ${codemodPath}`);
    return { success: false, filesChanged: 0 };
  }
  
  try {
    const fileList = files.join(' ');
    const cmd = `npx jscodeshift -t ${codemodPath} ${fileList}`;
    
    log.info('Transforming files...');
    const result = execSync(cmd, { encoding: 'utf8' });
    
    // Parse jscodeshift output
    const lines = result.split('\n');
    const statsLine = lines.find(line => line.includes('Stats:'));
    
    if (statsLine) {
      log.info(statsLine);
    }
    
    return { success: true, filesChanged: files.length };
  } catch (error) {
    log.error('Codemod failed: ' + error.message);
    return { success: false, filesChanged: 0 };
  }
}

// Verify the migration
function verifyMigration() {
  log.header('Verifying migration...');
  
  // Check for any remaining deprecated props
  const remaining = findDeprecatedUsages();
  
  if (remaining.length > 0) {
    log.warning(`Found ${remaining.length} files that may still have deprecated props:`);
    remaining.forEach(file => log.warning(`  - ${file}`));
    log.info('These may need manual review');
  } else {
    log.success('All deprecated props have been migrated! ✨');
  }
  
  // Run type check
  log.info('Running type check...');
  try {
    execSync('pnpm tsc --noEmit', { stdio: 'inherit' });
    log.success('Type check passed');
  } catch {
    log.warning('Type check failed - please review and fix any type errors');
  }
}

// Main migration flow
async function migrate() {
  console.log(`
${colors.bright}🔄 Clerk Migration Tool${colors.reset}
${'='.repeat(23)}
This tool will automatically migrate deprecated Clerk props to the new API.
  `);
  
  // Ensure dependencies
  if (!ensureJscodeshift()) {
    log.error('Failed to setup jscodeshift');
    process.exit(1);
  }
  
  // Find files with deprecated usage
  const files = findDeprecatedUsages();
  
  if (files.length === 0) {
    log.success('No deprecated Clerk props found! Your code is up to date. 🎉');
    return;
  }
  
  log.info(`Found ${files.length} files with deprecated Clerk props:`);
  files.forEach(file => log.info(`  - ${file}`));
  
  // Create backup
  const backupDir = backupFiles(files);
  
  // Run codemod
  const result = runCodemod(files);
  
  if (!result.success) {
    log.error('Migration failed. Your files have been backed up in: ' + backupDir);
    log.info('To restore: cp ' + backupDir + '/*.backup src/');
    process.exit(1);
  }
  
  // Verify
  verifyMigration();
  
  // Summary
  log.header('Migration Complete!');
  log.success(`✅ Migrated ${result.filesChanged} files`);
  log.info(`📁 Backup saved in: ${backupDir}`);
  log.info('📝 Please review the changes and test your authentication flows');
  log.info('💡 Run "git diff" to see all changes');
  
  // Cleanup tip
  console.log(`
${colors.yellow}Next steps:${colors.reset}
1. Review changes: git diff
2. Test auth flows locally
3. Commit: git add -A && git commit -m "chore: migrate Clerk deprecated props"
4. Remove backup: rm -rf ${backupDir}
  `);
}

// Run migration
migrate().catch(error => {
  log.error('Unexpected error: ' + error.message);
  process.exit(1);
});