# Clean Authentication Implementation Plan

## Overview
A simplified authentication system that avoids all the pitfalls we encountered.

## Core Principles
1. **Clerk handles authentication only** - No complex syncing
2. **Simple role storage** - Use Clerk metadata, not Supabase
3. **Direct routing** - No intermediate redirects
4. **Organization context** - Stored in Clerk user metadata

## Phase 1: Fix Database Issues (Prerequisite)
### 1.1 Fix RLS Policies
```sql
-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "users_read_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "users_read_by_org" ON users  
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE clerk_id = auth.uid()::text
  ));
```

### 1.2 Add Clerk Metadata Fields
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_metadata JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
```

## Phase 2: Clerk Configuration
### 2.1 User Metadata Structure
```typescript
interface ClerkUserMetadata {
  role: 'platform_owner' | 'agency_owner' | 'client_admin' | 'client_user';
  organizationId: string;
  organizationName: string;
  permissions: string[];
}
```

### 2.2 Set Metadata on User Creation
- Use Clerk Dashboard or API to set publicMetadata
- Store role and org info directly in Clerk

## Phase 3: Simple Auth Components

### 3.1 AuthenticatedApp.tsx
```typescript
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export function AuthenticatedApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" />;
  
  // Get role from Clerk metadata
  const role = user?.publicMetadata?.role as string;
  const orgId = user?.publicMetadata?.organizationId as string;
  
  // Store in session storage for quick access
  sessionStorage.setItem('userRole', role);
  sessionStorage.setItem('orgId', orgId);
  
  // Direct routing based on role
  switch (role) {
    case 'platform_owner':
      return <Navigate to="/platform" />;
    case 'agency_owner':
    case 'agency_admin':
      return <Navigate to="/agency" />;
    default:
      return <Navigate to={`/org/${orgId}/dashboard`} />;
  }
}
```

### 3.2 Simple Login Page
```typescript
export function LoginPage() {
  return (
    <SignIn
      afterSignInUrl="/auth/redirect"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-none",
        }
      }}
    />
  );
}
```

### 3.3 Organization Context Provider
```typescript
export function OrgProvider({ children }) {
  const { user } = useUser();
  const orgId = user?.publicMetadata?.organizationId;
  
  const orgContext = {
    orgId,
    orgName: user?.publicMetadata?.organizationName,
    userRole: user?.publicMetadata?.role,
  };
  
  return (
    <OrgContext.Provider value={orgContext}>
      {children}
    </OrgContext.Provider>
  );
}
```

## Phase 4: Routing Structure

### 4.1 App Routes
```typescript
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />
  
  {/* Auth Required */}
  <Route path="/auth/redirect" element={<AuthenticatedApp />} />
  
  {/* Platform Owner */}
  <Route path="/platform/*" element={
    <RequireRole role="platform_owner">
      <PlatformLayout />
    </RequireRole>
  } />
  
  {/* Organization Routes */}
  <Route path="/org/:orgId/*" element={
    <OrgProvider>
      <OrgLayout />
    </OrgProvider>
  } />
</Routes>
```

### 4.2 Organization-Scoped Routes
```typescript
// Inside OrgLayout
<Routes>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="campaigns" element={<Campaigns />} />
  <Route path="analytics" element={<Analytics />} />
  <Route path="settings" element={<OrgSettings />} />
</Routes>
```

## Phase 5: Data Access Pattern

### 5.1 API Calls with Org Context
```typescript
// All API calls automatically scoped to organization
const fetchOrgData = async () => {
  const orgId = sessionStorage.getItem('orgId');
  const response = await fetch(`/api/organizations/${orgId}/data`, {
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
    }
  });
  return response.json();
};
```

### 5.2 Backend Middleware
```typescript
// Verify org access
app.use('/api/organizations/:orgId', async (req, res, next) => {
  const userOrgId = req.auth.publicMetadata.organizationId;
  if (req.params.orgId !== userOrgId && req.auth.publicMetadata.role !== 'platform_owner') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});
```

## Phase 6: Migration Strategy

### 6.1 Gradual Rollout
1. Implement behind feature flag: `VITE_USE_SIMPLE_AUTH=true`
2. Test with single organization first
3. Migrate organizations one by one
4. Remove old auth system once stable

### 6.2 Data Migration Script
```javascript
// Migrate existing users to Clerk metadata
const migrateUsers = async () => {
  const users = await supabase.from('users').select('*');
  
  for (const user of users.data) {
    await clerk.users.updateUser(user.clerk_id, {
      publicMetadata: {
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
      }
    });
  }
};
```

## Benefits of This Approach

1. **No Infinite Loops**: Clerk metadata doesn't trigger re-renders
2. **No RLS Issues**: Simple policies, no recursion
3. **Fast**: Role/org data cached in session storage
4. **Clean URLs**: `/org/[orgId]/dashboard` clearly shows context
5. **Easy Testing**: Just change Clerk metadata to test different scenarios
6. **Scalable**: Each org is isolated by URL structure

## Implementation Timeline

1. **Day 1**: Fix RLS policies, test database access
2. **Day 2**: Implement Clerk metadata structure
3. **Day 3**: Build simple auth components
4. **Day 4**: Implement org-scoped routing
5. **Day 5**: Test and migrate first organization

## Success Metrics

- ✅ Login takes < 2 seconds
- ✅ No infinite loops or re-renders
- ✅ Users see only their org's data
- ✅ Platform owner can access everything
- ✅ Clean, predictable URLs
- ✅ Works with browser back/forward