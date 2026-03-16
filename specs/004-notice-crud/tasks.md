# Tasks: 공지사항 관리 (Notice CRUD)

**Input**: Design documents from `/specs/004-notice-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Tests**: Not requested — test tasks excluded.

**Organization**: Tasks grouped by user story. US1+US2 are both P1 but separated for incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure Turso + Drizzle ORM

- [x] T001 Install production dependencies: `npm install drizzle-orm @libsql/client`
- [x] T002 Install dev dependencies: `npm install -D drizzle-kit dotenv`
- [x] T003 [P] Create Drizzle configuration file at `drizzle.config.ts` with dialect 'turso', schema path `./src/db/schema/*`, and migrations output `./migrations`
- [x] T004 [P] Add database scripts to `package.json`: `db:generate`, `db:migrate`, `db:push`, `db:studio`
- [x] T005 [P] Add Turso environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) to `.env.local` and `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database layer, schemas, and navigation that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create Drizzle client with Turso connection and dev-mode singleton pattern in `src/db/index.ts`
- [x] T007 [P] Define Notice table schema with indexes (idx_notices_org_id, idx_notices_org_pinned_created) in `src/db/schema/notices.ts` per data-model.md
- [x] T008 Generate and run initial database migration using `npm run db:generate && npm run db:migrate`
- [x] T009 [P] Create Zod validation schemas (createNoticeSchema, updateNoticeSchema, deleteNoticeSchema) in `src/schemas/notices.ts` per data-model.md validation rules
- [x] T010 [P] Add shadcn/ui Textarea component: `npx shadcn@latest add textarea`
- [x] T011 Add 공지사항 navigation item to organization sidebar menu (all org types, all members visible) in `src/lib/navigation.ts`

**Checkpoint**: Foundation ready — database connected, schema migrated, navigation visible. User story implementation can begin.

---

## Phase 3: User Story 1 — 공지사항 목록 조회 + 상세 보기 (Priority: P1) 🎯 MVP

**Goal**: 조직 구성원이 공지사항 목록을 확인하고 개별 공지의 상세 내용을 다이얼로그로 볼 수 있다

**Independent Test**: 공지사항 페이지에 접근하여 목록이 표시되고, 항목 클릭 시 상세 다이얼로그가 열리는지 확인. 빈 상태 메시지도 확인.

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement `getNotices` server action (org-scoped list with pagination, isPinned DESC + createdAt DESC sorting) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T013 [P] [US1] Implement `getNotice` server action (single notice by id with org scope validation) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T014 [US1] Create notice-table client component (Table with title, authorName, createdAt, isPinned badge columns; empty state message; row click handler) in `app/(protected)/org/[slug]/notices/_components/notice-table.tsx`
- [x] T015 [US1] Create notice-detail-dialog client component (Dialog showing full notice content with title, author, date, pinned status) in `app/(protected)/org/[slug]/notices/_components/notice-detail-dialog.tsx`
- [x] T016 [US1] Create notices page server component (auth check via getAuthContext, fetch notices, render table with page header) in `app/(protected)/org/[slug]/notices/page.tsx`

**Checkpoint**: 조직 구성원이 공지사항 목록을 조회하고 상세 내용을 다이얼로그로 확인할 수 있다. 빈 상태 안내가 표시된다.

---

## Phase 4: User Story 2 — 공지사항 작성 (Priority: P1)

**Goal**: 조직 관리자(org:admin)가 새 공지사항을 작성하여 즉시 게시할 수 있다

**Independent Test**: org:admin으로 새 공지 작성 → 저장 → 목록에 반영되는지 확인. org:member에게는 작성 버튼이 표시되지 않는지 확인.

### Implementation for User Story 2

- [x] T017 [US2] Implement `createNotice` server action (org:admin auth, Zod validation, authorId/authorName auto-set from Clerk user) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T018 [US2] Create create-notice-dialog client component (Dialog with title Input, content Textarea, isPinned checkbox; validation error display; useTransition for pending state) in `app/(protected)/org/[slug]/notices/_components/create-notice-dialog.tsx`
- [x] T019 [US2] Integrate create notice button into notices page header (visible only to org:admin; pass isOrgAdmin prop from page) in `app/(protected)/org/[slug]/notices/page.tsx`

**Checkpoint**: org:admin이 공지를 작성할 수 있고, org:member에게는 버튼이 숨겨진다. 유효성 검증이 동작한다.

---

## Phase 5: User Story 3 — 공지사항 수정 (Priority: P2)

**Goal**: 조직 관리자가 기존 공지의 제목, 내용, 중요 여부를 수정할 수 있다

**Independent Test**: org:admin으로 기존 공지 수정 → 저장 → 변경 내용 반영 확인. org:member에게 수정 버튼이 표시되지 않는지 확인.

### Implementation for User Story 3

- [x] T020 [US3] Implement `updateNotice` server action (org:admin auth, partial update, org scope validation for notice ownership) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T021 [US3] Create edit-notice-dialog client component (Dialog with pre-filled title, content, isPinned; useTransition; validation) in `app/(protected)/org/[slug]/notices/_components/edit-notice-dialog.tsx`
- [x] T022 [US3] Add edit button to notice-detail-dialog (visible only to org:admin; opens edit-notice-dialog with current notice data) in `app/(protected)/org/[slug]/notices/_components/notice-detail-dialog.tsx`

**Checkpoint**: org:admin이 기존 공지를 수정할 수 있고, 변경 사항이 즉시 반영된다.

---

## Phase 6: User Story 4 — 공지사항 삭제 (Priority: P2)

**Goal**: 조직 관리자가 공지를 삭제할 수 있으며, 삭제 전 확인 절차를 거친다

**Independent Test**: org:admin으로 공지 삭제 시도 → AlertDialog 확인 → 삭제 완료 → 목록에서 제거 확인. 취소 시 삭제되지 않는지 확인.

### Implementation for User Story 4

- [x] T023 [US4] Implement `deleteNotice` server action (org:admin auth, org scope validation for notice ownership) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T024 [US4] Add delete button and AlertDialog confirmation to notice-detail-dialog (visible only to org:admin; useTransition; success/cancel handling) in `app/(protected)/org/[slug]/notices/_components/notice-detail-dialog.tsx`

**Checkpoint**: org:admin이 공지를 삭제할 수 있으며, 확인 다이얼로그가 정상 동작한다.

---

## Phase 7: User Story 5 — 슈퍼 관리자 공지 관리 (Priority: P3)

**Goal**: 슈퍼 관리자가 모든 조직의 공지를 조회하고 관리할 수 있다

**Independent Test**: superAdmin으로 관리자 공지 관리 페이지 접근 → 전체 조직 공지 목록 확인. 특정 조직 공지 페이지에서 관리 기능 동작 확인.

### Implementation for User Story 5

- [x] T025 [US5] Implement `getAllNotices` server action (superAdmin-only, cross-org listing with pagination) in `src/actions/notices.ts` per contracts/server-actions.md
- [x] T026 [P] [US5] Create all-notices-table client component (Table with orgId column added, all notice columns; empty state) in `app/(protected)/admin/notices/_components/all-notices-table.tsx`
- [x] T027 [US5] Create admin notices page server component (requireSuperAdmin auth, fetch all notices, render table) in `app/(protected)/admin/notices/page.tsx`
- [x] T028 [US5] Add 공지 관리 menu item to super admin navigation section in `src/lib/navigation.ts`

**Checkpoint**: 슈퍼 관리자가 전체 공지를 조회하고, 개별 조직의 공지를 관리할 수 있다.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: UX 개선 및 전체 품질 검증

- [x] T029 [P] Add loading skeleton states to notices page and admin notices page in `app/(protected)/org/[slug]/notices/loading.tsx` and `app/(protected)/admin/notices/loading.tsx`
- [ ] T030 [P] Add pagination UI component to notice-table (page controls, total count display) in `app/(protected)/org/[slug]/notices/_components/notice-table.tsx` (**DEFERRED**: 기본 동작 확인 후 추가)
- [x] T031 Verify TypeScript compilation (`npx tsc --noEmit`) and lint check (`npm run lint`)
- [ ] T032 Run quickstart.md verification checklist end-to-end (**DEFERRED**: Turso 환경변수 설정 후 실행 필요)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — first story to implement
- **US2 (Phase 4)**: Depends on US1 (page structure exists) — adds creation capability
- **US3 (Phase 5)**: Depends on US1 (detail dialog exists) — adds edit button to detail dialog
- **US4 (Phase 6)**: Depends on US1 (detail dialog exists) — adds delete button to detail dialog
- **US5 (Phase 7)**: Depends on Phase 2 only — independent admin feature, can run parallel to US3/US4
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → US1 (P1) → US2 (P1)
                                          ↓              ↓
                                          → US5 (P3)    → US3 (P2) → US4 (P2)
```

- **US1**: Depends on Phase 2 only — creates page structure, table, detail dialog
- **US2**: Depends on US1 — uses page layout, adds create dialog
- **US3**: Depends on US1 — modifies detail dialog to add edit button
- **US4**: Depends on US3 completion recommended (both modify notice-detail-dialog.tsx)
- **US5**: Depends on Phase 2 only — independent admin page, no overlap with org pages

### Parallel Opportunities

Within Phase 1:
```
T001, T002 (sequential: npm install)
T003, T004, T005 (parallel: different files)
```

Within Phase 2:
```
T006, T007 (parallel: src/db/index.ts vs src/db/schema/notices.ts)
T009, T010, T011 (parallel: schemas, UI component, navigation)
```

Within US1:
```
T012, T013 (parallel: different action functions, same file but independent logic)
T014, T015 (parallel: different component files)
```

Cross-story parallelism:
```
After US1 complete: US2 and US5 can run in parallel
After US2 complete: US3 can begin
After US3 complete: US4 can begin
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (5 tasks)
2. Complete Phase 2: Foundational (6 tasks)
3. Complete Phase 3: US1 — 목록 조회 + 상세 (5 tasks)
4. Complete Phase 4: US2 — 공지사항 작성 (3 tasks)
5. **STOP and VALIDATE**: 기본 CRUD의 C+R이 동작하는지 확인
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → 목록 조회 가능 (읽기 전용 MVP)
3. US2 → 작성 가능 (핵심 CRUD)
4. US3 → 수정 가능 (완전한 CRUD)
5. US4 → 삭제 가능 (완전한 CRUD)
6. US5 → 슈퍼 관리자 관리 (관리 기능)
7. Polish → 품질 마무리

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story (US1–US5)
- US3과 US4는 notice-detail-dialog.tsx를 수정하므로 순차 실행 권장
- Server actions는 모두 `src/actions/notices.ts` 한 파일에 작성 — 논리적으로 독립적이나 동시 편집 주의
- 모든 UI 텍스트는 한국어로 작성 (Constitution I)
- 모든 server action은 ApiResponse<T> 패턴 준수 (기존 organization.ts 참조)
- Commit after each task or logical group
