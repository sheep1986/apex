# Clerk Migration Guide

## Deprecation Fixes Required

### 1. Sign-in/Sign-up URL Props
**Old (Deprecated):**
```tsx
<SignIn afterSignInUrl="/dashboard" />
<SignUp afterSignUpUrl="/onboarding" />
```

**New:**
```tsx
<SignIn fallbackRedirectUrl="/dashboard" />
<SignUp fallbackRedirectUrl="/onboarding" />

// Or force redirect (ignores any redirect_url params)
<SignIn forceRedirectUrl="/dashboard" />
```

### 2. Clerk Provider Props
**Old:**
```tsx
<ClerkProvider navigate={(to) => navigate(to)}>
```

**New:**
```tsx
<ClerkProvider routerPush={(to) => navigate(to)} routerReplace={(to) => navigate(to, { replace: true })}>
```

### 3. User Button Props
**Old:**
```tsx
<UserButton afterSignOutUrl="/" />
```

**New:**
```tsx
<UserButton>
  <UserButton.MenuItems>
    <UserButton.Action label="Sign out" onClick={() => signOut({ redirectUrl: '/' })} />
  </UserButton.MenuItems>
</UserButton>
```

## Files to Update

Run this search to find all deprecated usages:
```bash
# Find deprecated props
grep -r "afterSignInUrl\|afterSignUpUrl\|afterSignOutUrl" src/

# Files likely needing updates:
# - src/components/auth/SignIn.tsx
# - src/components/auth/SignUp.tsx
# - src/components/Layout.tsx
# - src/App.tsx
```

## Migration Script

```bash
# Automated find & replace (review changes before committing!)
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/afterSignInUrl/fallbackRedirectUrl/g' \
  -e 's/afterSignUpUrl/fallbackRedirectUrl/g' \
  -e 's/afterSignOutUrl/fallbackRedirectUrl/g'
```

## Testing After Migration

1. Test sign-in flow with direct URL
2. Test sign-in with redirect_url parameter
3. Test sign-out redirect
4. Verify deep links still work
5. Check OAuth flows (Google, GitHub, etc.)

## References

- [Clerk Migration Guide](https://clerk.com/docs/upgrade-guides)
- [Redirect URL Behavior](https://clerk.com/docs/components/authentication/sign-in#redirect-url-behavior)