# Phase 1: Foundation Fix — Implementation Plan

**Goal**: App boots cleanly, auth works end-to-end, zero dead code, clean build, deployable.
**Estimated Scope**: ~65 files to clean/fix, ~20 files to delete, ~5 files to create/rewrite.

---

## STEP 1: CLERK REMOVAL (Nuclear Cleanup)

Clerk is referenced in 65+ files. It must be completely eradicated.

### 1A. Remove Package Dependencies
| Action | File |
|--------|------|
| Remove `@clerk/clerk-react` | `package.json` line 29 |
| Remove any `@clerk/backend` | `apps/backend/` package.json if exists |
| Regenerate lockfile | `pnpm install` after removal |

### 1B. Rewrite `src/main.tsx` (CRITICAL)
**Current state**: Wraps app in ClerkProvider, has diagnostic mode, 165 lines of mess.
**Target state**: Clean 30-line entry point using only SupabaseAuthProvider.

```
main.tsx will become:
- React.StrictMode
  - BrowserRouter
    - SupabaseAuthProvider
      - MinimalUserProvider
        - App
```

No ClerkProvider. No DevAuthProvider. No DiagnosticApp. No ErrorBoundary in main (it's already in App.tsx).

### 1C. Delete Dead Auth Files
These are Clerk-era files that serve no purpose:

| File | Action |
|------|--------|
| `src/components/auth/EnhancedLoginPage.tsx` | DELETE — Clerk SignIn component |
| `src/components/auth/EnhancedSignUpPage.tsx` | DELETE — Clerk SignUp component |
| `src/components/auth/AuthenticatedApp.tsx` | DELETE — Clerk useAuth/useUser |
| `src/components/auth/SimpleAuthFlow.tsx` | DELETE — Clerk useAuth/useUser |
| `src/components/auth/OrgProvider.tsx` | DELETE — Clerk useUser (replaced by SupabaseAuthContext) |
| `src/components/auth/QuickAuthRedirect.tsx` | DELETE — Clerk useUser |
| `src/components/auth/LoginPage.tsx` | DELETE — Clerk SignIn (we have src/pages/Login.tsx) |
| `src/components/auth/SignUpPage.tsx` | DELETE — Clerk SignUp (we have src/pages/Signup.tsx) |
| `src/components/auth/DatabaseAuthRedirect.tsx` | DELETE — Legacy redirect |
| `src/components/auth/ProtectedRoute.tsx` | REVIEW — May conflict with src/components/ProtectedRoute.tsx |
| `src/auth-new/` (entire directory) | DELETE — Clerk-based "new auth" attempt |
| `src/components/DebugAuth.tsx` | DELETE — Clerk debug utility |
| `src/AppWithAuth.example.tsx` | DELETE — Clerk example |
| `src/App.backup.tsx` | DELETE — Backup file |
| `src/main.debug.tsx` | DELETE — Debug entry point |
| `src/services/dev-auth.ts` | DELETE — Dev mode Clerk bypass |
| `src/hooks/auth.ts` | DELETE — Clerk auth hooks (replaced by SupabaseAuthContext) |
| `apps/backend/middleware/clerk-auth.ts` | DELETE — Clerk token verification |
| `apps/backend/services/clerk-service.ts` | DELETE — Clerk API client |
| `scripts/clerk-migration.js` | DELETE — Migration script |
| `scripts/codemods/clerk-redirect-props.cjs` | DELETE — Codemod |
| `docs/clerk-migration-guide.md` | DELETE — Outdated guide |
| `.clerk-migration-backup/` (entire dir) | DELETE — Legacy backup |
| `temp-fix/` (entire dir) | DELETE — Temporary fixes |

### 1D. Clean Clerk References from Remaining Files
These files reference `clerk_id` or Clerk patterns but are still needed:

| File | Action |
|------|--------|
| `src/services/supabase-service.ts` | Remove clerk_id references (lines 70, 372, 380, 618) — use Supabase auth.uid() instead |
| `src/services/organization-service.ts` | Remove mock clerk_id data (lines 46, 59, 72) |
| `netlify/functions/bootstrap.ts` | Remove clerk_id references (lines 37, 41, 49, 77, 84) — use Supabase user ID |
| `src/pages/PortalRedirect.tsx` | DELETE or rewrite — Clerk-based redirect |
| `src/pages/AcceptInvitation.tsx` | REVIEW — May import from Clerk hooks |

### 1E. Clean Environment Files
| File | Action |
|------|--------|
| `.env` | Remove VITE_CLERK_PUBLISHABLE_KEY, remove VITE_USE_DEV_AUTH |
| `.env.production` | Remove VITE_CLERK_PUBLISHABLE_KEY |
| `.env.test-new-auth` | DELETE entire file |
| `.env.netlify.example` | Remove VITE_CLERK_PUBLISHABLE_KEY |
| `apps/frontend/.env` | Remove VITE_CLERK_PUBLISHABLE_KEY |
| `apps/frontend/.env.local` | Remove VITE_CLERK_PUBLISHABLE_KEY |
| `apps/frontend/.env.production` | Remove VITE_CLERK_PUBLISHABLE_KEY |
| `apps/frontend/.env.test-new-auth` | DELETE |

---

## STEP 2: FIX AUTH FLOW

### 2A. Verify SupabaseAuthContext.tsx
This is the primary auth provider. Verify it handles:
- [x] signIn (email/password)
- [x] signUp (email/password)
- [x] signOut
- [x] signInWithOAuth (Google, Apple)
- [x] resetPassword
- [x] Session persistence (onAuthStateChange)
- [x] Loading dbUser profile after auth
- [ ] Organization loading after auth
- [ ] Redirect after successful auth

### 2B. Verify Login.tsx and Signup.tsx
- `src/pages/Login.tsx` — Already uses Supabase Auth. Verify it works standalone.
- `src/pages/Signup.tsx` — Verify full registration flow: email → verify → create profile → create or join org.

### 2C. Verify ProtectedRoute.tsx
- `src/components/ProtectedRoute.tsx` — Must check Supabase session, redirect to /login if none.
- Remove any Clerk-era ProtectedRoute from `src/components/auth/`.

### 2D. Verify MinimalUserProvider.tsx
- Provides `userContext` (org_id, user_id, role) to child components.
- Must source data from Supabase, not Clerk metadata.

---

## STEP 3: CLEAN DEAD CODE & LEGACY FILES

### 3A. Remove Vercel Backend Proxy
**File**: `netlify.toml`
- Remove all redirect rules that proxy to `https://apex-backend-vercel-*.vercel.app`
- We're not using Vercel. All API routes should go to Netlify Functions only.

### 3B. Delete Unused Files
| File/Directory | Reason |
|----------------|--------|
| `scripts/verify_phase_3_7.ts` | One-off verification script |
| `scripts/codemods/` | Clerk migration codemods |
| `scripts/clerk-migration.js` | Clerk migration |
| `.DS_Store` files | macOS artifacts (add to .gitignore) |
| `supabase/.DS_Store` | macOS artifact |
| `netlify/.DS_Store` | macOS artifact |

### 3C. Audit netlify.toml Redirects
Keep only routes that map to actual Netlify Functions. Remove dead routes.

### 3D. Clean package.json
- Remove `@clerk/clerk-react`
- Remove `migrate:clerk` script
- Verify all remaining dependencies are actually used
- Run `pnpm install` to regenerate lockfile

---

## STEP 4: DATABASE SCHEMA AUDIT

### 4A. Review RLS Policies
Current RLS policies use subqueries like:
```sql
SELECT organization_id FROM profiles WHERE auth.uid() = profiles.id
```
This can cause recursion if the profiles policy itself queries profiles. Verify no circular dependency.

### 4B. Remove clerk_id Column (Migration)
Create a migration that:
1. Drops `clerk_id` from `profiles` table (if it exists there)
2. Updates any RLS policies that reference `clerk_id`
3. Ensures all user identification uses Supabase `auth.uid()`

### 4C. Verify Core Tables Exist
Cross-reference `db/schema.sql` with what's actually in Supabase. The migrations in `supabase/migrations/` may have added tables not in the base schema. Ensure consistency.

---

## STEP 5: BUILD VERIFICATION

### 5A. TypeScript Compilation
```bash
pnpm run typecheck
```
Must pass with ZERO errors. Every import must resolve. Every type must be correct.

### 5B. Vite Build
```bash
pnpm run build
```
Must produce a clean `dist/` folder with no warnings about missing modules.

### 5C. Local Dev Server
```bash
pnpm run dev
```
Must boot without errors. Navigate to:
- `/login` — Login page renders
- `/signup` — Signup page renders
- `/dashboard` — Redirects to /login if not authenticated
- After login: `/dashboard` shows real data from Supabase

### 5D. Netlify Functions
Verify each function in `netlify/functions/` can be imported without errors. No missing dependencies, no Clerk imports.

---

## STEP 6: GIT CLEANUP

### 6A. Update .gitignore
Add:
```
.DS_Store
*.DS_Store
.env.local
.env.*.local
temp-fix/
.clerk-migration-backup/
```

### 6B. Commit Strategy
Phase 1 will be committed as a series of atomic commits:
1. `chore: remove Clerk dependency and all related files`
2. `fix: rewrite main.tsx for pure Supabase auth`
3. `chore: remove dead Vercel proxy routes and legacy files`
4. `fix: clean clerk_id references from services and functions`
5. `chore: clean environment files`
6. `test: verify build passes with zero errors`

---

## STEP 7: UPDATE BRAIN

### 7A. Update CURRENT_STATE.md
After Phase 1 completion:
```markdown
# Current Project State
**Last Updated**: [date]

## Status: PHASE 1 COMPLETE — Foundation Fixed

## What IS Working
1. Supabase Auth (email/password + Google + Apple OAuth)
2. Login/Signup pages
3. Protected routes with session checking
4. Dashboard with real Supabase data
5. All Netlify Functions compile cleanly
6. Clean build (zero TypeScript errors, zero build warnings)

## What Was Removed
- Clerk dependency (65+ files cleaned)
- Vercel backend proxy
- Dead backup/debug files
- Legacy migration scripts

## Immediate Next Steps
- Begin Phase 2: Core Product (Assistant Management UI)
```

### 7B. Update DECISION_LOG.md
Add entry for Clerk removal and any RLS policy changes.

---

## ACCEPTANCE CRITERIA

Phase 1 is DONE when ALL of the following are true:

- [ ] `@clerk/clerk-react` is NOT in package.json
- [ ] `pnpm run typecheck` passes with 0 errors
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run dev` boots without errors
- [ ] `/login` renders and accepts credentials
- [ ] `/signup` renders and creates account
- [ ] `/dashboard` loads with real data after login
- [ ] No file in `src/` imports from `@clerk/*`
- [ ] No file in `netlify/functions/` imports from `@clerk/*`
- [ ] `git grep -r "clerk" src/` returns 0 results
- [ ] `git grep -r "clerk" netlify/` returns 0 results
- [ ] `.env` has no CLERK references
- [ ] Brain documents are updated

---

## ESTIMATED EFFORT

| Task | Files | Complexity |
|------|-------|-----------|
| Clerk removal | ~65 files | Medium (mostly deletions) |
| main.tsx rewrite | 1 file | Low (simplification) |
| Auth flow verification | 5 files | Medium |
| Dead code cleanup | ~20 files | Low (deletions) |
| netlify.toml cleanup | 1 file | Low |
| Database audit | 2-3 files | Medium |
| Build verification | N/A | Low (testing) |
| Brain updates | 3 files | Low |

**Total**: This is a focused cleanup sprint. The majority of the work is deletion, not creation. The only creative work is the main.tsx rewrite and auth flow verification.
