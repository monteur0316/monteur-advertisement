# Research: Clerk Authentication with RBAC

**Feature**: 001-clerk-auth
**Date**: 2026-02-24

## 1. Role Storage Strategy

**Decision**: Use Clerk `publicMetadata` for role storage

**Rationale**:
- `publicMetadata` is readable on the frontend (for conditional UI rendering) but only writable from server-side code
- Simple flat role model (admin/advertiser/agency) does not require Clerk Organizations
- Session token customization allows embedding role in JWT, avoiding per-request API calls
- 8KB metadata limit is more than sufficient for a single role field

**Alternatives considered**:
- Clerk Organizations: Over-engineered for flat role model; designed for multi-tenant B2B
- `privateMetadata`: Cannot be read on the client; would require extra API calls for UI role checks
- Custom database table: Unnecessary overhead when Clerk metadata handles storage and sync

**Implementation pattern**:
```typescript
// publicMetadata shape
{ role: 'admin' | 'advertiser' | 'agency' }
```

## 2. Session Token Customization

**Decision**: Add `publicMetadata` to session token via Clerk Dashboard

**Rationale**:
- Avoids network requests to check role on every server component render
- `auth()` returns `sessionClaims.metadata.role` directly from the JWT
- Must keep metadata under 1.2KB to avoid cookie size issues (single role string is negligible)

**Configuration** (Clerk Dashboard → Sessions → Customize session token):
```json
{
  "metadata": "{{user.public_metadata}}"
}
```

## 3. Middleware Architecture

**Decision**: Use `clerkMiddleware()` with `createRouteMatcher` for auth + role protection in `proxy.ts`

**Rationale**:
- Next.js 16 renamed middleware file from `middleware.ts` to `proxy.ts`
- `createRouteMatcher` provides clean route matching patterns
- Role checks in middleware prevent unauthorized page rendering
- Public-by-default approach aligns with spec assumptions

**Pattern**:
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`
- Auth-only routes: Protected by `auth.protect()`
- Role-specific routes: `/admin(.*)` → admin, `/advertiser(.*)` → advertiser, `/agency(.*)` → agency
- Admin can access all role-protected routes

## 4. Dedicated Auth Pages

**Decision**: Catch-all route pages with `<SignIn />` and `<SignUp />` components

**Rationale**:
- Clerk requires `[[...sign-in]]` catch-all route for multi-step flows (MFA, email verification)
- Environment variables `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` inform Clerk components
- Auth pages grouped under `(auth)` route group for separate layout (centered, no sidebar)

**File structure**:
```
app/(auth)/sign-in/[[...sign-in]]/page.tsx
app/(auth)/sign-up/[[...sign-up]]/page.tsx
app/(auth)/layout.tsx  # Centered layout for auth pages
```

## 5. Role Management API

**Decision**: Server Actions using `clerkClient().users.updateUserMetadata()` for admin role assignment

**Rationale**:
- `clerkClient()` is async in current SDK (must be awaited)
- `updateUserMetadata` performs deep merge (set key to null to remove)
- Server Actions provide type-safe, server-only execution
- Admin-only validation in the server action via `auth()` session claims check

**Pattern**:
```typescript
const client = await clerkClient()
await client.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'advertiser' }
})
```

## 6. Next.js 16 Compatibility

**Decision**: Use `@clerk/nextjs@^6.38.0` with `proxy.ts` (not `middleware.ts`)

**Rationale**:
- @clerk/nextjs 6.38.0+ supports Next.js 16 via peer dependency `^16.x`
- Next.js 16 renames `middleware.ts` to `proxy.ts`; default exports still work
- `auth()` is async-only (synchronous access removed in Next.js 16)
- Turbopack is default in Next.js 16; Clerk is compatible

## 7. Admin User Management

**Decision**: Admin page at `/admin/users` with user list and role assignment

**Rationale**:
- FR-014 requires Admin to assign/change roles
- Uses `clerkClient().users.getUserList()` for fetching users
- DataTable pattern per constitution (Principle III)
- Role assignment via server action with Zod validation per constitution (Principle IV)

**Components needed**:
- User list with DataTable (search, filter by role)
- Role assignment dropdown/dialog per user
- Confirmation dialog for role changes
