const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to keep (important scripts)
const KEEP_FILES = [
  'scripts/cleanup/backup-and-clean-data.cjs',
  'scripts/cleanup/fix-openai-lead-qualification.cjs',
  'scripts/cleanup/remove-unused-files.cjs',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  '.env',
  '.env.example',
  '.gitignore',
  'README.md'
];

// Patterns for test files to remove
const TEST_FILE_PATTERNS = [
  /^check-.*\.cjs$/,
  /^test-.*\.cjs$/,
  /^debug-.*\.cjs$/,
  /^fix-.*\.cjs$/,
  /^create-.*\.cjs$/,
  /^update-.*\.cjs$/,
  /^process-.*\.cjs$/,
  /^diagnose-.*\.cjs$/,
  /^fetch-.*\.cjs$/,
  /^sync-.*\.cjs$/,
  /^run-.*\.cjs$/,
  /^setup-.*\.cjs$/,
  /^backup-.*\.cjs$/,
  /^migrate-.*\.cjs$/,
  /^apply-.*\.cjs$/,
  /^cleanup-.*\.cjs$/,
  /^restore-.*\.cjs$/,
  /^analyze-.*\.cjs$/,
  /^verify-.*\.cjs$/,
  /^monitor-.*\.cjs$/,
  /^simple-.*\.cjs$/,
  /^minimal-.*\.cjs$/,
  /^direct-.*\.cjs$/,
  /^quick-.*\.cjs$/
];

// Unused React components to check
const UNUSED_COMPONENTS = [
  'TestPage',
  'TestPlatform', 
  'TestAuthSimple',
  'TestNewAuth',
  'DebugPortal',
  'DebugSupabaseSession',
  'SimpleRedirect',
  'QuickRedirect',
  'DirectRedirect',
  'DirectToPlatform'
];

async function findFilesToDelete() {
  const rootDir = path.join(__dirname, '../../');
  const files = fs.readdirSync(rootDir);
  
  const toDelete = [];
  const toKeep = [];
  const toReview = [];
  
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    
    // Skip directories
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }
    
    // Check if it's in keep list
    if (KEEP_FILES.some(keep => filePath.endsWith(keep))) {
      toKeep.push(file);
      continue;
    }
    
    // Check if it matches test patterns
    const isTestFile = TEST_FILE_PATTERNS.some(pattern => pattern.test(file));
    
    if (isTestFile) {
      toDelete.push(file);
    } else if (file.endsWith('.cjs')) {
      // Other .cjs files need review
      toReview.push(file);
    }
  }
  
  return { toDelete, toKeep, toReview };
}

function findUnusedComponents() {
  const componentsDir = path.join(__dirname, '../../src/components');
  const pagesDir = path.join(__dirname, '../../src/pages');
  
  const unusedFiles = [];
  
  // Check pages directory
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir);
    
    for (const page of pages) {
      const pageName = path.basename(page, '.tsx');
      if (UNUSED_COMPONENTS.includes(pageName)) {
        unusedFiles.push(path.join(pagesDir, page));
      }
    }
  }
  
  // Check components for test components
  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir);
    
    for (const component of components) {
      if (component.includes('Test') || component.includes('Debug') || component.includes('Demo')) {
        const componentPath = path.join(componentsDir, component);
        
        // Check if it's imported anywhere
        try {
          const searchResult = execSync(
            `grep -r "${component.replace('.tsx', '')}" src/ --exclude-dir=node_modules 2>/dev/null | wc -l`,
            { encoding: 'utf8' }
          ).trim();
          
          if (searchResult === '1') {
            // Only found in its own file
            unusedFiles.push(componentPath);
          }
        } catch (e) {
          // Grep failed, skip
        }
      }
    }
  }
  
  return unusedFiles;
}

async function cleanupFiles(dryRun = true) {
  console.log(`🧹 File Cleanup Analysis (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);
  
  // Find test scripts to delete
  const { toDelete, toKeep, toReview } = await findFilesToDelete();
  
  console.log('📁 Root Directory .cjs Files:\n');
  
  console.log(`✅ Will KEEP (${toKeep.length} files):`);
  toKeep.forEach(file => console.log(`   - ${file}`));
  
  console.log(`\n❌ Will DELETE (${toDelete.length} test scripts):`);
  toDelete.slice(0, 10).forEach(file => console.log(`   - ${file}`));
  if (toDelete.length > 10) {
    console.log(`   ... and ${toDelete.length - 10} more`);
  }
  
  if (toReview.length > 0) {
    console.log(`\n⚠️  Need Review (${toReview.length} files):`);
    toReview.forEach(file => console.log(`   - ${file}`));
  }
  
  // Find unused components
  const unusedComponents = findUnusedComponents();
  
  console.log(`\n🧩 Unused Components (${unusedComponents.length}):`);
  unusedComponents.forEach(file => {
    console.log(`   - ${path.basename(file)}`);
  });
  
  // Calculate space saved
  let totalSize = 0;
  const rootDir = path.join(__dirname, '../../');
  
  for (const file of toDelete) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
  }
  
  console.log(`\n💾 Space to be freed: ${(totalSize / 1024).toFixed(2)} KB`);
  
  if (!dryRun) {
    console.log('\n🗑️  Performing deletion...\n');
    
    // Create trash directory for safety
    const trashDir = path.join(rootDir, '.trash', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }
    
    // Move files to trash instead of deleting
    let deleted = 0;
    
    for (const file of toDelete) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        const trashPath = path.join(trashDir, file);
        fs.renameSync(filePath, trashPath);
        deleted++;
      }
    }
    
    console.log(`✅ Moved ${deleted} test scripts to .trash/`);
    
    // Remove unused components
    let componentsDeleted = 0;
    for (const componentPath of unusedComponents) {
      if (fs.existsSync(componentPath)) {
        const trashPath = path.join(trashDir, 'components', path.basename(componentPath));
        if (!fs.existsSync(path.dirname(trashPath))) {
          fs.mkdirSync(path.dirname(trashPath), { recursive: true });
        }
        fs.renameSync(componentPath, trashPath);
        componentsDeleted++;
      }
    }
    
    console.log(`✅ Moved ${componentsDeleted} unused components to .trash/`);
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`   Files are in ${trashDir}`);
    console.log('   You can permanently delete .trash/ after verification');
  } else {
    console.log('\n⚠️  This was a DRY RUN. No files were deleted.');
    console.log('   Run with --live flag to perform actual cleanup.');
  }
}

// Remove unused routes from App.tsx
async function cleanupRoutes() {
  const appFile = path.join(__dirname, '../../src/App.tsx');
  
  if (!fs.existsSync(appFile)) {
    console.log('App.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(appFile, 'utf8');
  
  console.log('\n🛣️  Checking Routes in App.tsx...\n');
  
  const unusedRoutes = [
    '/test',
    '/test-platform',
    '/test-auth',
    '/test-new-auth',
    '/debug',
    '/debug-portal',
    '/debug-supabase',
    '/simple-redirect',
    '/quick-redirect',
    '/direct-redirect',
    '/direct-platform'
  ];
  
  let foundUnused = false;
  for (const route of unusedRoutes) {
    if (content.includes(route)) {
      console.log(`   ❌ Found unused route: ${route}`);
      foundUnused = true;
    }
  }
  
  if (!foundUnused) {
    console.log('   ✅ No unused routes found');
  } else {
    console.log('\n   ⚠️  Remove these routes manually from App.tsx');
  }
}

// Main execution
async function main() {
  const isLive = process.argv.includes('--live');
  
  await cleanupFiles(!isLive);
  await cleanupRoutes();
  
  if (!isLive) {
    console.log('\n📝 Next Steps:');
    console.log('1. Review the files marked for deletion');
    console.log('2. Run "node scripts/cleanup/remove-unused-files.cjs --live" to perform cleanup');
    console.log('3. Manually remove unused routes from App.tsx');
    console.log('4. Test the application to ensure nothing broke');
  }
}

main().catch(console.error);