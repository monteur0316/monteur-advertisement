# Tasks: Sidebar Navigation

**Input**: Design documents from `/specs/002-sidebar/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shadcn/ui components required for sidebar implementation

- [x] T001 Install shadcn/ui components via CLI: `npx shadcn@latest add sidebar sheet tooltip separator collapsible` — this installs SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, Sheet, Tooltip, Separator, Collapsible primitives into components/ui/

**Checkpoint**: All required shadcn/ui components available in components/ui/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Navigation config and shared components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Define NavigationItem and NavigationGroup TypeScript interfaces, declare navigation constants for 3 groups ("관리": Admin Dashboard + User Management, "광고주": Advertiser Dashboard, "대행사": Agency Dashboard), and implement getNavigationGroups() and filterGroupsByRole() functions in src/lib/navigation.ts
- [x] T003 [P] Create SidebarLogo component — render Monteur branding icon in SidebarHeader area, show icon-only in compact mode and icon + "Monteur" text in expanded mode using group-data-[collapsible=icon] selector in src/components/sidebar-logo.tsx

**Checkpoint**: Foundation ready — navigation types, constants, filtering logic, and logo component available

---

## Phase 3: User Story 1 — Role-Based Sidebar Navigation (Priority: P1) 🎯 MVP

**Goal**: 인증된 사용자가 역할에 맞는 메뉴를 사이드바에서 확인하고, 활성 페이지가 강조 표시된다

**Independent Test**: 각 역할(admin, advertiser, agency)로 로그인하여 역할에 맞는 메뉴만 표시되는지 확인하고, 메뉴 클릭 시 활성 상태가 올바르게 업데이트되는지 검증

### Implementation for User Story 1

- [x] T004 [P] [US1] Create NavItem component — SidebarMenuItem + SidebarMenuButton wrapping Next.js Link, accept NavigationItem and isActive props, use usePathname() for active state detection (pathname === item.href), render icon + label in src/components/nav-item.tsx
- [x] T005 [US1] Create AppSidebar component — "use client" component accepting groups: NavigationGroup[] prop, render SidebarHeader (SidebarLogo), SidebarContent (flat list of NavItem for each group's items), use Sidebar component from shadcn/ui in src/components/app-sidebar.tsx
- [x] T006 [US1] Rewrite protected layout — replace inline aside+nav with SidebarProvider wrapping AppSidebar + SidebarInset, server-side auth() to get role, call filterGroupsByRole() and pass filtered groups to AppSidebar, conditionally render sidebar only when groups.length > 0 in app/(protected)/layout.tsx
- [x] T007 [US1] Update header component — restructure as SidebarInset header content, add SidebarTrigger button + Separator at left side, keep Clerk UserButton at right side, remove max-w-7xl constraint to fit SidebarInset width in src/components/header.tsx
- [x] T008 [US1] Update root layout — remove global Header component import and rendering from root layout body, ensure ClerkProvider and font setup remain unchanged in app/layout.tsx

**Checkpoint**: US1 complete — role-based navigation works with active state, header integrated in SidebarInset

---

## Phase 4: User Story 2 — Mobile Responsive Sidebar (Priority: P1)

**Goal**: 모바일에서 사이드바가 기본 숨김이며 햄버거 메뉴로 Sheet 드로어를 열고, 메뉴 클릭 시 자동 닫힘

**Independent Test**: 브라우저를 768px 미만으로 줄여 사이드바 숨김 확인, SidebarTrigger로 Sheet 열기, 메뉴 클릭 시 자동 닫힘 확인

### Implementation for User Story 2

- [x] T009 [US2] Add mobile auto-close behavior — import useSidebar() hook in NavItem, on Link click check isMobile and call setOpenMobile(false) to auto-close Sheet drawer after navigation in src/components/nav-item.tsx
- [x] T010 [US2] Verify mobile responsive behavior — confirm SidebarTrigger renders hamburger icon on mobile viewport (<768px), Sheet overlay appears with sidebar content, clicking overlay or outside dismisses sidebar, test by resizing browser in app/(protected)/layout.tsx

**Checkpoint**: US2 complete — mobile Sheet drawer works with auto-close on navigation

---

## Phase 5: User Story 3 — Desktop Collapsible Sidebar (Priority: P2)

**Goal**: 데스크톱에서 사이드바를 아이콘만 표시되는 compact 모드로 축소/확장 가능, 상태 유지

**Independent Test**: 축소 버튼 클릭하여 아이콘 모드 전환, 확장 버튼으로 복원, 아이콘 호버 시 툴팁, 새로고침 후 상태 유지 확인

### Implementation for User Story 3

- [x] T011 [US3] Enable collapsible icon mode — add collapsible="icon" prop to Sidebar component and add SidebarRail component for hover re-expansion in src/components/app-sidebar.tsx
- [x] T012 [US3] Add tooltip for compact mode — pass tooltip={item.label} prop to SidebarMenuButton so menu labels show as tooltips when sidebar is collapsed to icon-only mode in src/components/nav-item.tsx
- [x] T013 [US3] Verify state persistence — confirm SidebarProvider automatically saves sidebar_state cookie, test that page refresh restores previous collapsed/expanded state without layout shift in app/(protected)/layout.tsx

**Checkpoint**: US3 complete — desktop collapsible with tooltip and cookie-based state persistence

---

## Phase 6: User Story 4 — Grouped Navigation Items (Priority: P2)

**Goal**: 메뉴 항목이 역할 도메인별 그룹("관리", "광고주", "대행사")으로 구분되어 그룹 헤더와 함께 표시

**Independent Test**: admin으로 로그인하여 3개 그룹이 각각 헤더와 함께 표시되는지 확인, advertiser로 로그인하여 "광고주" 그룹만 표시되는지 확인

### Implementation for User Story 4

- [x] T014 [P] [US4] Create NavGroup component — render SidebarGroup with SidebarGroupLabel for group header, iterate group.items to render NavItem components, apply active highlighting style to group label when any child item is active (check via usePathname) in src/components/nav-group.tsx
- [x] T015 [US4] Refactor AppSidebar to use NavGroup — replace flat NavItem list in SidebarContent with groups.map() rendering NavGroup components, each group renders its own header and items in src/components/app-sidebar.tsx

**Checkpoint**: US4 complete — navigation items visually grouped by domain with active group highlighting

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, public page headers, and final validation

- [x] T016 Handle edge cases — verify null role user sees no sidebar (groups.length === 0 renders children only), empty groups are excluded by filterGroupsByRole, browser resize from desktop to mobile transitions sidebar mode correctly in app/(protected)/layout.tsx
- [x] T017 [P] Restore header for public pages — add Header component to auth layout and/or home page so sign-in, sign-up, and landing pages still show Monteur branding and Clerk auth buttons in app/(auth)/layout.tsx and app/page.tsx
- [x] T018 Run quickstart.md validation — walk through all acceptance scenarios for US1-US4, verify all 12 functional requirements (FR-001 through FR-012), confirm 5 success criteria (SC-001 through SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (shadcn/ui components installed)
- **US1 (Phase 3)**: Depends on Phase 2 — BLOCKS US2, US3, US4
- **US2 (Phase 4)**: Depends on US1 (modifies NavItem and layout created in US1)
- **US3 (Phase 5)**: Depends on US1 (modifies AppSidebar and NavItem created in US1)
- **US4 (Phase 6)**: Depends on US1 (refactors AppSidebar structure created in US1)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Core sidebar — all other stories depend on this
- **US2 (P1)**: Modifies NavItem (T009) from US1 — requires US1 complete
- **US3 (P2)**: Modifies AppSidebar (T011) and NavItem (T012) from US1 — requires US1 complete
- **US4 (P2)**: Refactors AppSidebar (T015) from US1 — requires US1 complete
- **US2, US3, US4**: Independent of each other — can run in parallel after US1

### Within Each User Story

- T004 (NavItem) and T003 (SidebarLogo) can run in parallel (different files)
- T005 (AppSidebar) depends on T004 (NavItem) and T003 (SidebarLogo)
- T006 (Layout) depends on T005 (AppSidebar)
- T007 (Header) and T008 (Root Layout) depend on T006 (Layout restructure)

### Parallel Opportunities

**Phase 2**: T002 and T003 can run in parallel (different files)
**Phase 3 start**: T004 can start in parallel with T003 (different files)
**Phase 6**: T014 can start while T015 is pending (different file)
**After US1**: US2, US3, US4 can all start in parallel (modify different aspects)
**Phase 7**: T016 and T017 can run in parallel (different files)

---

## Parallel Example: After US1 Completion

```bash
# US2, US3, US4 can run in parallel after US1:
# Agent 1 (US2): Mobile auto-close in nav-item.tsx
# Agent 2 (US3): collapsible="icon" in app-sidebar.tsx + tooltip in nav-item.tsx
# Agent 3 (US4): NavGroup component + AppSidebar refactor

# ⚠️ Note: US2 and US3 both modify nav-item.tsx — if running in parallel,
# coordinate to avoid merge conflicts. Recommended: US2 → US3 sequentially,
# or US4 in parallel with (US2 → US3).
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: User Story 1 (T004-T008)
4. **STOP and VALIDATE**: Test role-based navigation and active state independently
5. Deploy/demo if ready — functional sidebar with role filtering

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → Deploy (MVP! — role-based sidebar with active state)
3. Add US2 → Test → Deploy (mobile responsive)
4. Add US3 → Test → Deploy (desktop collapsible)
5. Add US4 → Test → Deploy (grouped navigation)
6. Polish → Final validation → Deploy (production ready)

### Recommended Sequential Order

Since US2 and US3 both touch nav-item.tsx, the safest execution order is:

1. Phase 1 → Phase 2 → Phase 3 (US1)
2. Phase 4 (US2) → Phase 5 (US3)
3. Phase 6 (US4) — can run parallel with US2/US3 as it touches different files
4. Phase 7 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 is the MVP — all other stories enhance it incrementally
- shadcn/ui Sidebar handles much of US2 (Sheet) and US3 (collapsible) internally
- T010 and T013 are verification tasks — confirm built-in shadcn/ui behavior works correctly
- Commit after each completed user story phase for clean git history
