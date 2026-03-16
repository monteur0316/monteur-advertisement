# Tasks: Clerk Authentication with RBAC

**Input**: Design documents from `/specs/001-clerk-auth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — test tasks excluded.

**Organization**: Tasks grouped by user story. US1+US2+US3 (all P1) combined as MVP phase since they form the core authentication experience.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure environment, create shared types and schemas

- [X] T001 Install @clerk/nextjs dependency via `npm install @clerk/nextjs`
- [X] T002 [P] Initialize shadcn/ui and install required components (button, dropdown-menu, dialog, table, badge, alert) via `npx shadcn@latest init` and `npx shadcn@latest add`
- [X] T003 [P] Create `.env.local` with placeholder Clerk keys and URL configurations (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`)
- [X] T004 [P] Create role types and JWT session claims declaration in `src/types/globals.d.ts` — define `UserRole` type (`'admin' | 'advertiser' | 'agency'`) and `CustomJwtSessionClaims` interface with `metadata.role`
- [X] T005 [P] Create Zod schema for role validation in `src/schemas/role.ts` — `userRoleSchema`, `setRoleSchema` with `userId` and `role` fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Wrap application with `<ClerkProvider>`, update metadata (title, description), and integrate header component in `app/layout.tsx`
- [X] T007 [P] Create shared header component with `<SignedIn>/<SignedOut>` auth state toggle — show `<SignInButton>/<SignUpButton>` when signed out, `<UserButton>` when signed in — in `src/components/header.tsx`
- [X] T008 [P] Create auth utility helpers (`checkRole`, `getCurrentRole`, `isAdmin`) using `auth()` from `@clerk/nextjs/server` in `src/lib/auth.ts`
- [X] T009 Create Clerk middleware with `createRouteMatcher` — define public routes (`/`, `/sign-in(.*)`, `/sign-up(.*)`), auth-protected routes, and role-specific route matchers (`/admin(.*)` → admin, `/advertiser(.*)` → advertiser or admin, `/agency(.*)` → agency or admin) in `proxy.ts`

**Checkpoint**: Foundation ready — auth infrastructure is configured, header renders auth state, middleware protects routes

---

## Phase 3: US1 + US2 + US3 — Core Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, sign in, see their session state in the header, and sign out

**Independent Test**: Visit the app → see Sign In/Sign Up buttons → click Sign Up → complete registration → see user profile button in header → navigate between pages (session persists) → refresh page (still signed in) → click profile button → sign out → see Sign In/Sign Up buttons again

### Implementation

- [X] T010 [US1] Create `(auth)` route group centered layout (flex min-h-screen items-center justify-center) in `app/(auth)/layout.tsx`
- [X] T011 [P] [US1] Create dedicated sign-up page with Clerk `<SignUp />` component in `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- [X] T012 [P] [US2] Create dedicated sign-in page with Clerk `<SignIn />` component in `app/(auth)/sign-in/[[...sign-in]]/page.tsx`

> **Note**: US3 (Session Management) requires no additional implementation — covered by `<ClerkProvider>` (T006) and header component (T007). Session persistence, profile button, account management, and sign-out are all handled by Clerk's built-in components.

**Checkpoint**: Core authentication is fully functional — sign up, sign in, session management, and sign out all work. This is a deployable MVP.

---

## Phase 4: US4 — Route Protection (Priority: P2)

**Goal**: Unauthenticated users are redirected to sign-in when accessing protected pages; authenticated users see protected content normally

**Independent Test**: Sign out → navigate to a protected URL (e.g., `/admin`) → redirected to `/sign-in` → sign in → redirected back to the originally requested page → see content

### Implementation

- [X] T013 [US4] Create `(protected)` route group layout with header and sidebar navigation structure in `app/(protected)/layout.tsx`
- [X] T014 [P] [US4] Create access-denied component for unauthorized role access (shown when authenticated but wrong role) in `src/components/access-denied.tsx`

**Checkpoint**: Protected routes block unauthenticated users and redirect to sign-in

---

## Phase 5: US5 — Role-Based Access Control (Priority: P2)

**Goal**: Each role (Admin, Advertiser, Agency) can only access their designated pages; navigation shows only role-appropriate menu items; users without a role see limited content

**Independent Test**: Sign in as Admin → see admin nav items → access `/admin` (allowed) → Sign in as Advertiser → no admin nav items → access `/admin` via URL → see access-denied → Sign in as user with no role → see only public/shared pages

**Depends on**: US4 (route protection infrastructure)

### Implementation

- [X] T015 [US5] Enhance `(protected)` layout sidebar with role-aware navigation — read role from `auth()` session claims, render only menu items matching user's role in `app/(protected)/layout.tsx`
- [X] T016 [P] [US5] Create admin section placeholder page (dashboard for user/system management) in `app/(protected)/admin/page.tsx`
- [X] T017 [P] [US5] Create advertiser section placeholder page (dashboard for ad management) in `app/(protected)/advertiser/page.tsx`
- [X] T018 [P] [US5] Create agency section placeholder page (dashboard for campaign management) in `app/(protected)/agency/page.tsx`

**Checkpoint**: Role-based access works — each role sees appropriate navigation and can only access their pages

---

## Phase 6: US6 — Role Assignment (Priority: P2)

**Goal**: Admin users can view all registered users and assign/change roles via a user management interface

**Independent Test**: Sign in as Admin → navigate to `/admin/users` → see user list in DataTable → select a user → assign Advertiser role → user can now access advertiser pages → change role to Agency → user access updates accordingly

**Depends on**: US5 (admin routes and role infrastructure)

### Implementation

- [X] T019 [US6] Create server actions (`setUserRole`, `getUserList`) with admin-only auth check, Zod validation, and Clerk `updateUserMetadata` in `src/actions/user.ts`
- [X] T020 [P] [US6] Create user table component with DataTable (columns: name, email, role, actions), search, and role filter in `app/(protected)/admin/users/_components/user-table.tsx`
- [X] T021 [P] [US6] Create role assignment dialog with role dropdown and confirmation in `app/(protected)/admin/users/_components/role-assignment.tsx`
- [X] T022 [US6] Create admin user management page composing user table and role assignment in `app/(protected)/admin/users/page.tsx`

**Checkpoint**: Full RBAC system functional — Admin can manage user roles, role changes take effect on next session refresh

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, validation, and cleanup

- [X] T023 [P] Create `.env.example` with placeholder values and comments for team onboarding
- [X] T024 Update `app/page.tsx` home page with auth-aware content (welcome message, role-appropriate quick links)
- [X] T025 Run `npm run lint` and TypeScript type check (`npx tsc --noEmit`) to verify no errors
- [X] T026 Validate all routes and flows per `specs/001-clerk-auth/quickstart.md` verification steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 for Clerk SDK, T004 for types)
- **US1+US2+US3 (Phase 3)**: Depends on Phase 2 (ClerkProvider, header, middleware)
- **US4 (Phase 4)**: Depends on Phase 2 (middleware route matchers)
- **US5 (Phase 5)**: Depends on US4 (protected layout)
- **US6 (Phase 6)**: Depends on US5 (admin routes) + Phase 1 (shadcn/ui components)
- **Polish (Phase 7)**: Depends on all desired phases being complete

### User Story Dependencies

- **US1 + US2 + US3 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **US4 (P2)**: Can start after Phase 2 — Independent of US1-US3
- **US5 (P2)**: Depends on US4 (protected route layout)
- **US6 (P2)**: Depends on US5 (admin route access)

### Within Each Phase

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel (T007 + T008 in parallel, then T009)
- Phase 3: T010 first (layout), then T011 + T012 in parallel
- Phase 5: T015 first (layout update), then T016 + T017 + T018 in parallel
- Phase 6: T019 first (server actions), then T020 + T021 in parallel, then T022

### Parallel Opportunities

```text
Phase 1 parallel group:  T002 | T003 | T004 | T005  (4 parallel tasks)
Phase 2 parallel group:  T007 | T008                 (2 parallel tasks)
Phase 3 parallel group:  T011 | T012                 (2 parallel tasks)
Phase 5 parallel group:  T016 | T017 | T018          (3 parallel tasks)
Phase 6 parallel group:  T020 | T021                 (2 parallel tasks)
```

---

## Parallel Example: Phase 3 (MVP)

```bash
# After T010 (auth layout) is complete:
Task: "Create sign-up page in app/(auth)/sign-up/[[...sign-up]]/page.tsx"
Task: "Create sign-in page in app/(auth)/sign-in/[[...sign-in]]/page.tsx"
```

## Parallel Example: Phase 5 (RBAC)

```bash
# After T015 (role-aware nav) is complete:
Task: "Create admin placeholder page in app/(protected)/admin/page.tsx"
Task: "Create advertiser placeholder page in app/(protected)/advertiser/page.tsx"
Task: "Create agency placeholder page in app/(protected)/agency/page.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 + US2 + US3
4. **STOP and VALIDATE**: Sign up → Sign in → Session persists → Sign out
5. Deploy if ready — basic auth is functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1+US2+US3 → **MVP! Basic auth works** → Deploy
3. US4 → Route protection active → Deploy
4. US5 → Role-based access enforced → Deploy
5. US6 → Admin can manage roles → Deploy
6. Polish → Production-ready

### Manual Step Required

> **⚠️ Clerk Dashboard Configuration**: After Phase 1, configure session token customization in Clerk Dashboard → Sessions → Customize session token → Add `{"metadata": "{{user.public_metadata}}"}`. This is required for role-based features (Phase 5+) to read roles from JWT session claims.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- US3 has no dedicated tasks — fully covered by foundational components
- Clerk Dashboard session token customization is a manual step (not a code task)
- First admin user must be assigned role manually via Clerk Dashboard (bootstrap)
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
