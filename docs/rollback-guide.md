# Rollback Guide

## Quick Rollback from Migration

If the Clerk migration caused issues, here's how to rollback:

### 1. Restore from Backup (Safest)
```bash
# The migration creates a backup directory
ls .clerk-migration-backup/

# Restore all files
cp -r .clerk-migration-backup/* src/

# Or restore specific files
cp .clerk-migration-backup/SignIn.tsx.backup src/components/auth/SignIn.tsx

# Commit the restoration
git add -A && git commit -m "revert: restore pre-clerk-migration files"
```

### 2. Git-based Rollback
```bash
# Drop all uncommitted changes
git restore --source=HEAD -- .

# Or revert the specific commit
git log --oneline | grep clerk  # Find the commit hash
git revert <commit-hash>

# Or reset to before migration (DESTRUCTIVE - loses all changes after)
git reset --hard HEAD~1  # Go back 1 commit
```

### 3. Selective Rollback
```bash
# Just restore specific files that broke
git checkout HEAD -- src/components/auth/SignIn.tsx
git checkout HEAD -- src/App.tsx

# Test and commit
pnpm dev  # Test locally
git add -A && git commit -m "fix: restore working auth components"
```

## Rollback from Array Utility Changes

### 1. Remove Array Guards (if causing issues)
```bash
# Find all usage
rg -n "asArray|safeFilter|safeReduce" src

# Replace with original patterns (CAREFUL - may reintroduce crashes)
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/asArray(\([^)]*\))/\1/g' \
  -e 's/safeFilter(\([^,]*\),/\1.filter(/g' \
  -e 's/safeReduce(\([^,]*\),/\1.reduce(/g'
```

### 2. Disable ESLint Rules Temporarily
```javascript
// In .eslintrc.js - add to rules
{
  "no-restricted-syntax": "off",
  "no-restricted-properties": "off"
}
```

## Emergency Fixes

### 1. Broken Build
```bash
# Skip prebuild checks temporarily
SKIP_PREFLIGHT_CHECK=true pnpm build

# Or disable specific checks
pnpm build  # Skip prebuild entirely
```

### 2. TypeScript Errors
```bash
# Skip type checking for emergency deploy
export NODE_OPTIONS="--max-old-space-size=4096"
npx vite build --mode production --skip-type-check
```

### 3. Netlify Build Failing
Add environment variable in Netlify:
- `SKIP_PREFLIGHT_CHECK=true`
- Or remove `prebuild` script temporarily

## Test After Rollback

```bash
# Quick smoke test
pnpm smoke-test

# Full verification
pnpm typecheck
pnpm test
pnpm build

# Local dev test
pnpm dev
```

## Prevention

To avoid needing rollbacks:

1. **Test migrations locally first**:
   ```bash
   # Create a test branch
   git checkout -b test-migration
   pnpm migrate:clerk
   pnpm dev  # Test locally
   ```

2. **Use feature flags** for major changes:
   ```typescript
   const USE_NEW_CLERK_PROPS = process.env.NODE_ENV === 'development';
   ```

3. **Gradual rollout**:
   - Deploy to staging first
   - Test critical auth flows
   - Deploy to production only after verification

## Support

If rollback doesn't solve the issue:

1. Check the backup directory: `.clerk-migration-backup/`
2. Review git log: `git log --oneline -10`
3. Check build logs in Netlify/Railway
4. Test auth flows manually:
   - Sign in
   - Sign up
   - Sign out
   - Deep links with redirect URLs