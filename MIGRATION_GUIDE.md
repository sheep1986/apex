# Step-by-Step Migration Guide

## Quick Start (What to do RIGHT NOW)

### Step 1: Fix the Database (With Manus)
```sql
-- Run this in Supabase SQL editor
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test that queries work
SELECT * FROM users WHERE email = 'sean@artificialmedia.co.uk';
```

### Step 2: Update Clerk User Metadata
Go to Clerk Dashboard → Users → Find sean@artificialmedia.co.uk → Edit → Public Metadata:
```json
{
  "role": "platform_owner",
  "organizationId": "artificial-media",
  "organizationName": "Artificial Media",
  "permissions": ["all"]
}
```

### Step 3: Implement Simple Login Flow
Replace current auth with:

```typescript
// App.tsx
import { SimpleAuthFlow } from './components/auth/SimpleAuthFlow';

// Replace complex auth routes with:
<Route path="/login" element={<ClerkSignIn />} />
<Route path="/auth/redirect" element={<SimpleAuthFlow />} />
```

## Why This Works

### 1. No More Infinite Loops
- ❌ OLD: useUser → fetch from Supabase → update context → re-render → useUser (LOOP!)
- ✅ NEW: Clerk metadata → sessionStorage → done (NO LOOP!)

### 2. No More RLS Issues  
- ❌ OLD: Complex RLS policies checking users table
- ✅ NEW: Simple auth.uid() checks or disabled RLS

### 3. Clean URL Structure
- ❌ OLD: /dashboard (which org???)
- ✅ NEW: /org/artificial-media/dashboard (clear!)

### 4. Fast Role Detection
- ❌ OLD: Clerk → Supabase → Context → Component (slow!)
- ✅ NEW: Clerk metadata → sessionStorage (instant!)

## Testing Plan

### Phase 1: Test with Your Account (sean@artificialmedia.co.uk)
1. Update your Clerk metadata
2. Login and verify redirect to /platform
3. Test navigation between platform sections

### Phase 2: Create Test Client User
1. Create new user in Clerk
2. Set metadata:
   ```json
   {
     "role": "client_user",
     "organizationId": "test-org-123",
     "organizationName": "Test Organization"
   }
   ```
3. Login and verify redirect to /org/test-org-123/dashboard

### Phase 3: Test Organization Isolation
1. Verify client user can't access /platform
2. Verify client user can't access other org URLs
3. Verify platform owner can access any org

## Common Issues & Solutions

### Issue: "No Organization Found"
**Solution**: Check Clerk user metadata has organizationId

### Issue: Still getting redirected to login
**Solution**: Clear localStorage and sessionStorage, then login again

### Issue: Can't access platform features
**Solution**: Verify role in sessionStorage matches 'platform_owner'

## Rollback Plan
If something goes wrong:
1. Git checkout to previous commit
2. Re-enable all auth bypasses
3. Use dev role switcher

## Next Steps After Migration

1. **Re-enable RLS with simple policies**
   ```sql
   CREATE POLICY "org_isolation" ON campaigns
   USING (organization_id = current_setting('app.current_org_id'));
   ```

2. **Add organization switcher for platform owner**
   ```typescript
   // Let platform owner impersonate orgs for testing
   <OrgSwitcher orgs={allOrgs} />
   ```

3. **Implement proper org onboarding**
   ```typescript
   // New org creation flow
   /platform/organizations/new → Create org → Add users → Set permissions
   ```

## Success Checklist

- [ ] Database queries work without errors
- [ ] Login redirects to correct dashboard
- [ ] URLs show organization context
- [ ] No infinite loops in console
- [ ] Platform owner can access everything
- [ ] Client users see only their org
- [ ] Page loads in < 2 seconds

## Emergency Contacts

- **Database Issues**: Ask Manus about RLS policies
- **Clerk Issues**: Check Clerk dashboard logs
- **Frontend Issues**: Check browser console for errors

Remember: Keep it simple! The more complex the auth, the more ways it can break.