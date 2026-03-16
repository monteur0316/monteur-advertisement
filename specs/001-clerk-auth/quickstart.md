# Quickstart: Clerk Authentication with RBAC

**Feature**: 001-clerk-auth
**Date**: 2026-02-24

## Prerequisites

1. Node.js 18+
2. Clerk account with application created at [dashboard.clerk.com](https://dashboard.clerk.com)
3. Clerk API keys (Publishable Key + Secret Key)

## Setup Steps

### 1. Install Dependencies

```bash
npm install @clerk/nextjs
```

### 2. Configure Environment Variables

Create `.env.local` (already in `.gitignore`):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 3. Configure Clerk Dashboard — Session Token

1. Go to **Clerk Dashboard** → **Sessions** → **Customize session token**
2. Add the following claim:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This embeds the user's role in the JWT session token.

### 4. Verify Setup

```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- Sign In / Sign Up buttons appear in header
- Clicking Sign Up navigates to `/sign-up`
- After sign-up, user profile button appears in header
- Sign out returns to unauthenticated state

### 5. Test Role-Based Access

1. Sign up a new user → should only access public pages
2. Set user role via Clerk Dashboard (Users → select user → Public metadata → add `{"role": "admin"}`)
3. Refresh → should access `/admin` routes
4. Use the admin user management page at `/admin/users` to assign roles to other users

## Key Files Reference

| File | Purpose |
|------|---------|
| `proxy.ts` | Clerk middleware with route protection |
| `app/layout.tsx` | ClerkProvider wrapper |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Dedicated sign-in page |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Dedicated sign-up page |
| `src/types/globals.d.ts` | Role types + JWT session claims |
| `src/schemas/role.ts` | Zod validation for role operations |
| `src/actions/user.ts` | Server actions for role management |
| `src/lib/auth.ts` | Auth utility helpers (checkRole, getCurrentRole) |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sign-in redirect loop | Check `NEXT_PUBLIC_CLERK_SIGN_IN_URL` matches `/sign-in` route |
| Role not appearing in session | Configure session token customization in Clerk Dashboard |
| 404 on sign-in page | Ensure catch-all route `[[...sign-in]]` directory structure |
| Middleware not running | Verify `proxy.ts` is at project root (not in `app/` or `src/`) |
