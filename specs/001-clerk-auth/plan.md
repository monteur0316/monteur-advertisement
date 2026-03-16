# Implementation Plan: Clerk Authentication with RBAC

**Branch**: `001-clerk-auth` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-clerk-auth/spec.md`

## Summary

Implement Clerk authentication with role-based access control (Admin, Advertiser, Agency) for the monteur-advertisement Next.js 16 App Router application. Uses `@clerk/nextjs` with `publicMetadata` for role storage, `clerkMiddleware()` for route protection, and dedicated sign-in/sign-up pages. Admin users manage role assignments via a user management page.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, @clerk/nextjs ^6.38.0, Tailwind CSS v4
**Storage**: Clerk publicMetadata (no custom database for auth/roles)
**Testing**: ESLint + TypeScript type check (existing), manual E2E verification
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: <3s initial load (3G), <200ms API, LCP <2.5s, CLS <0.1
**Constraints**: WCAG 2.1 AA, OWASP Top 10 compliance, no `any` types
**Scale/Scope**: 3 roles, ~10 new files, ~6 route groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UI/UX 우선 | PASS | shadcn/ui components for admin UI, responsive layout, header auth UI |
| II. API 문서화 | PASS | Server actions (not REST endpoints) for role mgmt; no new API routes requiring Swagger |
| III. CRUD 패턴 | PASS | Admin user list uses DataTable pattern, role change uses confirmation dialog |
| IV. 인증 및 보안 | PASS | Clerk auth, clerkMiddleware, Zod server validation, env vars for secrets |
| V. 코드 구조 | PASS | Types in `src/types/`, schemas in `src/schemas/`, actions in `src/actions/`, lib in `src/lib/` |
| VI. 상태 관리 | PASS | React Server Components default, `"use client"` only for interactive header/admin UI |
| VII. 에러 처리 | PASS | Unified error response `{ data, error, message }`, meaningful error messages |
| VIII. 성능 기준 | PASS | Role from JWT session claims (no extra API calls), minimal client bundle |

**Post-Phase 1 Re-check**: All gates still PASS. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/001-clerk-auth/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Clerk patterns research
├── data-model.md        # Phase 1: Entity model
├── quickstart.md        # Phase 1: Setup guide
├── contracts/
│   └── api-contracts.md # Phase 1: API & route contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── layout.tsx                              # ClerkProvider wrapper + header
├── page.tsx                                # Home (public)
├── (auth)/
│   ├── layout.tsx                          # Centered layout for auth pages
│   ├── sign-in/[[...sign-in]]/page.tsx     # Dedicated sign-in
│   └── sign-up/[[...sign-up]]/page.tsx     # Dedicated sign-up
├── (protected)/
│   ├── layout.tsx                          # Authenticated layout (sidebar + header)
│   ├── admin/
│   │   └── users/
│   │       ├── page.tsx                    # Admin user management (DataTable)
│   │       └── _components/
│   │           ├── user-table.tsx          # User DataTable component
│   │           └── role-assignment.tsx     # Role change dialog
│   ├── advertiser/                         # Advertiser routes (placeholder)
│   │   └── page.tsx
│   └── agency/                             # Agency routes (placeholder)
│       └── page.tsx
└── globals.css

proxy.ts                                    # Clerk middleware (route protection + RBAC)

src/
├── components/
│   └── header.tsx                          # Shared header (auth buttons / user button)
├── lib/
│   └── auth.ts                             # Auth utility helpers (checkRole, getCurrentRole)
├── types/
│   └── globals.d.ts                        # Role types + JWT session claims
├── schemas/
│   └── role.ts                             # Zod schema for role validation
└── actions/
    └── user.ts                             # Server actions (setUserRole, getUserList)
```

**Structure Decision**: Follows constitution V (code structure). Uses route groups: `(auth)` for sign-in/up pages with centered layout, `(protected)` for authenticated routes with sidebar layout. Shared components and logic in `src/`. Admin page follows CRUD pattern (constitution III) with DataTable.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
