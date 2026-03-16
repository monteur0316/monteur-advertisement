# API Contracts: Clerk Authentication with RBAC

**Feature**: 001-clerk-auth
**Date**: 2026-02-24

## Server Actions

### `setUserRole`

**Location**: `src/actions/user.ts`
**Auth**: Admin only
**Purpose**: Assign or change a user's role

**Input**:
```typescript
{
  userId: string   // Clerk user ID (e.g., "user_2abc...")
  role: 'admin' | 'advertiser' | 'agency'
}
```

**Output (success)**:
```typescript
{ data: { userId: string, role: string }, error: null, message: 'Role updated successfully' }
```

**Output (error)**:
```typescript
{ data: null, error: string, message: string }
```

**Error cases**:
| Code | Condition |
|------|-----------|
| `UNAUTHORIZED` | Caller is not authenticated |
| `FORBIDDEN` | Caller does not have admin role |
| `VALIDATION_ERROR` | Invalid userId or role value |
| `SELF_MODIFY` | Admin attempting to remove own admin role |
| `USER_NOT_FOUND` | Target userId does not exist in Clerk |

---

### `getUserList`

**Location**: `src/actions/user.ts`
**Auth**: Admin only
**Purpose**: Fetch list of users with role information

**Input**:
```typescript
{
  query?: string    // Search by name/email
  role?: 'admin' | 'advertiser' | 'agency' | 'unassigned'
  limit?: number    // Default: 10
  offset?: number   // Default: 0
}
```

**Output (success)**:
```typescript
{
  data: {
    users: Array<{
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string
      role: 'admin' | 'advertiser' | 'agency' | null
      createdAt: string
      lastSignInAt: string | null
    }>
    totalCount: number
  },
  error: null,
  message: null
}
```

## Route Protection Contract

### Public Routes (no auth required)

| Route Pattern | Description |
|---------------|-------------|
| `/` | Home page |
| `/sign-in(.*)` | Sign-in page and sub-flows |
| `/sign-up(.*)` | Sign-up page and sub-flows |

### Auth-Protected Routes (any authenticated user)

| Route Pattern | Description |
|---------------|-------------|
| `/dashboard` | Shared dashboard (role-aware content) |

### Role-Protected Routes

| Route Pattern | Required Role | Fallback |
|---------------|--------------|----------|
| `/admin(.*)` | `admin` | Redirect to `/` with access denied |
| `/advertiser(.*)` | `advertiser` or `admin` | Redirect to `/` with access denied |
| `/agency(.*)` | `agency` or `admin` | Redirect to `/` with access denied |

## Environment Variables Contract

| Variable | Required | Public | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | No | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Yes | Value: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Yes | Value: `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Yes | Value: `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Yes | Value: `/` |

## Unified Response Format

Per constitution Principle III, all API responses use:

```typescript
type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}
```
