# Data Model: Clerk Authentication with RBAC

**Feature**: 001-clerk-auth
**Date**: 2026-02-24

## Entities

### User (Managed by Clerk)

Clerk manages user identity. No custom database table required.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| id | string | Clerk | Unique user identifier (`user_...`) |
| firstName | string? | Clerk | User's first name |
| lastName | string? | Clerk | User's last name |
| email | string | Clerk | Primary email address (unique) |
| imageUrl | string | Clerk | Profile avatar URL |
| publicMetadata.role | Role? | Clerk metadata | Assigned application role |
| createdAt | Date | Clerk | Account creation timestamp |
| lastSignInAt | Date? | Clerk | Last sign-in timestamp |

### Role (Enum — stored in publicMetadata)

No database table. Roles are stored as a string in Clerk `publicMetadata`.

| Value | Label (KO) | Description | Access Level |
|-------|------------|-------------|--------------|
| `admin` | 관리자 | Full system access, user management | All routes |
| `advertiser` | 광고주 | Ad creation and campaign management | `/advertiser/*` + shared |
| `agency` | 대행사 | Campaign management for advertisers | `/agency/*` + shared |
| _(unset)_ | 미배정 | No role assigned (new user default) | Public/shared pages only |

### Session (Managed by Clerk)

Clerk manages sessions. Role is embedded via session token customization.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| sessionId | string | Clerk JWT | Active session identifier |
| userId | string | Clerk JWT | Associated user ID |
| metadata.role | Role? | Clerk JWT (custom claim) | User's role from publicMetadata |
| exp | number | Clerk JWT | Token expiration timestamp |

## Relationships

```
User 1 ──── 0..1 Role (via publicMetadata)
User 1 ──── 0..* Session (managed by Clerk)
```

## State Transitions

### User Role Lifecycle

```
[New User] ──sign-up──> [Authenticated, No Role]
    │
    │ (Admin assigns role)
    ▼
[Authenticated, Role Assigned] ──────> [admin | advertiser | agency]
    │
    │ (Admin changes role)
    ▼
[Authenticated, Different Role]
```

### Access Level Matrix

| State | Public Pages | Shared Auth Pages | Admin Pages | Advertiser Pages | Agency Pages |
|-------|-------------|-------------------|-------------|-----------------|--------------|
| Unauthenticated | Yes | No → redirect to `/sign-in` | No → redirect | No → redirect | No → redirect |
| Authenticated (no role) | Yes | Yes | No → access denied | No → access denied | No → access denied |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Advertiser | Yes | Yes | No → access denied | Yes | No → access denied |
| Agency | Yes | Yes | No → access denied | No → access denied | Yes |

## Validation Rules

- Role must be one of: `'admin'`, `'advertiser'`, `'agency'` (or unset)
- Only Admin users can assign/change roles (enforced server-side)
- A user cannot have multiple roles simultaneously
- An Admin cannot remove their own admin role (prevents lockout)
- Role changes take effect on next session token refresh

## TypeScript Types

```typescript
// src/types/globals.d.ts
export type UserRole = 'admin' | 'advertiser' | 'agency'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: UserRole
    }
  }
}
```

```typescript
// src/schemas/role.ts (Zod)
import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'advertiser', 'agency'])
export type UserRole = z.infer<typeof userRoleSchema>

export const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
})
```
