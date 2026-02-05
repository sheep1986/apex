# Trinity Labs AI Platform Cleanup Guide

## 🚀 Quick Start

Run the master cleanup wizard:
```bash
node scripts/cleanup/master-cleanup.cjs
```

This interactive wizard will guide you through the entire cleanup process.

## 📋 Manual Cleanup Steps

### 1. Database Cleanup

**Preview what will be deleted:**
```bash
node scripts/cleanup/backup-and-clean-data.cjs
```

**Perform actual cleanup:**
```bash
node scripts/cleanup/backup-and-clean-data.cjs --live
```

This will:
- Backup all data to `/backups/` directory
- Delete 35 test campaigns
- Delete associated test leads and calls
- Keep only "Emerald Green Energy Demo" campaign

### 2. Fix OpenAI Lead Qualification

**Test the OpenAI connection:**
```bash
node scripts/cleanup/fix-openai-lead-qualification.cjs --test
```

**Process all calls with AI:**
```bash
node scripts/cleanup/fix-openai-lead-qualification.cjs
```

**Force reprocess already analyzed calls:**
```bash
node scripts/cleanup/fix-openai-lead-qualification.cjs --force
```

### 3. Remove Unused Files

**Preview files to be deleted:**
```bash
node scripts/cleanup/remove-unused-files.cjs
```

**Perform file cleanup:**
```bash
node scripts/cleanup/remove-unused-files.cjs --live
```

This will:
- Move 33+ test scripts to `.trash/` directory
- Remove 11 unused React components
- Clean up test routes from the application

## ✅ Already Completed

- [x] Removed test routes from App.tsx
- [x] Created cleanup scripts
- [x] Created backup system
- [x] Documented cleanup process

## 📊 Current Status

### Database (Before Cleanup)
- **36 campaigns** (35 are test data)
- **7 leads** (6 are test)
- **26 calls** (25 are test)

### Database (After Cleanup)
- **1 campaign** (Emerald Green Energy Demo)
- **1 lead** (real data)
- **1 call** (real data)

### Files
- **33 test scripts** to be removed
- **11 unused components** to be removed
- **112 KB** of space to be freed

## 🔍 Verification

After cleanup, verify:

1. **Dashboard loads correctly**
   ```bash
   npm run dev
   ```
   Visit http://localhost:5173/dashboard

2. **Emerald Green campaign works**
   - Check campaign details page
   - Verify system prompt displays
   - Test Voice Engine sync buttons

3. **No broken imports**
   ```bash
   npm run build
   ```

## ⚠️ Safety Features

All cleanup scripts include:
- **Dry run mode by default** (preview changes)
- **Automatic backups** before deletion
- **Files moved to .trash/** instead of permanent deletion
- **Interactive confirmation** for each step

## 🔄 Restore Backups

If something goes wrong:

1. **Database backups** are in `/backups/backup_YYYY-MM-DD/`
2. **Deleted files** are in `.trash/YYYY-MM-DD/`
3. **Git history** has all code changes

To restore database from backup:
```bash
# Create a restore script using the backup JSON files
node scripts/restore-from-backup.cjs backups/backup_2025-09-09
```

## 📝 Next Steps After Cleanup

1. **Deploy to Netlify**
   ```bash
   git add -A
   git commit -m "Clean up test data and unused components"
   git push origin main
   ```

2. **Fix Backend**
   - Option A: Fix Railway deployment
   - Option B: Deploy to Render.com
   - Option C: Use Vercel Functions

3. **Production Setup**
   - Purchase 12 UK phone numbers
   - Upgrade Supabase to Pro plan
   - Upgrade Voice Engine to Growth plan
   - Set up monitoring

## 💰 Cost Projections

For 2000 calls/day operation:
- **Infrastructure:** £472/month
- **Call costs:** £4,100/month
- **Total:** £4,572/month
- **Recommended client price:** £10,000/month
- **Profit margin:** £5,428/month (54%)

## 📞 Support

If you encounter issues:
1. Check the backup files
2. Review the `.trash/` directory
3. Use git to revert changes if needed
4. Contact support with error messages