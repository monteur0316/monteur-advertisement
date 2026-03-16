# Tasks: 자주묻는 질문 (FAQ) 페이지

**Input**: Design documents from `/specs/005-faq-page/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/server-actions.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and shadcn/ui components

- [x] T001 Install @dnd-kit dependencies: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] T002 Add shadcn/ui Accordion component: `npx shadcn@latest add accordion`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, validation, server actions, navigation — MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create FAQ DB schema with faqs table (id, question, answer, sortOrder, authorId, authorName, createdAt, updatedAt) and idx_faqs_sort_order index in `src/db/schema/faqs.ts`. Follow notices.ts pattern. Export `Faq` and `NewFaq` types.
- [x] T004 Generate and apply DB migration: run `npm run db:generate` then `npm run db:push`
- [x] T005 [P] Create Zod validation schemas (createFaqSchema: question 1-200자 + answer 1-2000자, updateFaqSchema: id + optional question/answer, deleteFaqSchema: id, reorderFaqsSchema: items array of {id, sortOrder}) in `src/schemas/faq.ts`. Use Korean error messages per notices.ts pattern.
- [x] T006 [P] Add FAQ menu item (label: "자주묻는 질문", icon: "HelpCircle", href: `/org/${slug}/faq`) to "일반" group in `getOrgNavigationGroups()` in `src/lib/navigation.ts`
- [x] T007 Implement all FAQ Server Actions in `src/actions/faq.ts`: getFaqs (all auth, sortOrder ASC), getFaq (all auth, by id), createFaq (superAdmin, auto sortOrder = max+1, author from Clerk), updateFaq (superAdmin, partial update), deleteFaq (superAdmin), reorderFaqs (superAdmin, bulk sortOrder update). Follow `ApiResponse<T>` pattern and `requireSuperAdmin()` guard from notices.ts.

**Checkpoint**: Foundation ready — DB, validation, server actions, navigation all in place

---

## Phase 3: User Story 1 — FAQ 목록 조회 (Priority: P1) 🎯 MVP

**Goal**: 인증된 모든 사용자가 FAQ 페이지에서 아코디언으로 질문/답변을 조회할 수 있다

**Independent Test**: `/org/[slug]/faq` 접근 → FAQ 항목이 아코디언으로 표시 → 질문 클릭 시 답변 펼침 → 빈 상태 시 안내 메시지

### Implementation for User Story 1

- [x] T008 [US1] Create FAQ page server component in `app/(protected)/org/[slug]/faq/page.tsx`. Call `getAuthContext()` for auth check, `getFaqs()` for data, pass `isSuperAdmin` and `faqs` to child components. Show empty state "등록된 질문이 없습니다" when no items.
- [x] T009 [P] [US1] Create loading skeleton in `app/(protected)/org/[slug]/faq/loading.tsx` with accordion-style skeleton UI (repeat 3-5 skeleton items)
- [x] T010 [US1] Create read-only FAQ accordion list component in `app/(protected)/org/[slug]/faq/_components/faq-list.tsx`. "use client" component using shadcn/ui Accordion. Display question as trigger, answer as content. Receive `faqs: Faq[]` prop.

**Checkpoint**: US1 complete — FAQ 조회 독립적으로 작동 및 테스트 가능

---

## Phase 4: User Story 2 — FAQ 항목 등록 (Priority: P2)

**Goal**: 슈퍼 어드민이 새 FAQ 항목을 생성할 수 있다

**Independent Test**: 슈퍼 어드민 로그인 → "새 질문 추가" 버튼 클릭 → 질문/답변 입력 → 저장 → 목록에 표시

### Implementation for User Story 2

- [x] T011 [US2] Create FAQ creation dialog in `app/(protected)/org/[slug]/faq/_components/create-faq-dialog.tsx`. "use client" with Dialog, form fields (question textarea max 200자, answer textarea max 2000자), Zod validation, useTransition for pending state, call createFaq server action, show success/error feedback.
- [x] T012 [US2] Add "새 질문 추가" button to FAQ page in `app/(protected)/org/[slug]/faq/page.tsx`. Conditionally render only when `isSuperAdmin === true`. Wire to CreateFaqDialog.

**Checkpoint**: US2 complete — FAQ 생성 독립적으로 작동

---

## Phase 5: User Story 3 — FAQ 항목 수정 (Priority: P3)

**Goal**: 슈퍼 어드민이 기존 FAQ 항목의 질문과 답변을 수정할 수 있다

**Independent Test**: 슈퍼 어드민 로그인 → FAQ 항목 수정 버튼 클릭 → 기존 내용 표시 → 수정 → 저장 → 변경 반영

### Implementation for User Story 3

- [x] T013 [US3] Create FAQ edit dialog in `app/(protected)/org/[slug]/faq/_components/edit-faq-dialog.tsx`. "use client" with Dialog, pre-filled form fields (question, answer), Zod validation, useTransition, call updateFaq server action.
- [x] T014 [US3] Add edit/delete buttons per FAQ item in sortable list component. Conditionally rendered for super admin only via FaqSortableList.

**Checkpoint**: US3 complete — FAQ 수정 독립적으로 작동

---

## Phase 6: User Story 4 — FAQ 항목 삭제 (Priority: P4)

**Goal**: 슈퍼 어드민이 FAQ 항목을 삭제 확인 후 제거할 수 있다

**Independent Test**: 슈퍼 어드민 로그인 → FAQ 항목 삭제 버튼 클릭 → 확인 다이얼로그 → 확인 → 목록에서 제거

### Implementation for User Story 4

- [x] T015 [US4] Create FAQ delete confirmation dialog in `app/(protected)/org/[slug]/faq/_components/delete-faq-dialog.tsx`. "use client" with AlertDialog (Constitution III), display FAQ question in confirmation message, useTransition, call deleteFaq server action.
- [x] T016 [US4] Delete button integrated into FaqSortableList for super admin view.

**Checkpoint**: US4 complete — FAQ 삭제 독립적으로 작동, 전체 CRUD 완성

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 드래그앤드롭 순서 변경 (FR-012) 및 최종 검증

- [x] T017 Create drag-and-drop sortable FAQ list in `app/(protected)/org/[slug]/faq/_components/faq-sortable-list.tsx`. "use client" using @dnd-kit/core DndContext (stable id prop for hydration), @dnd-kit/sortable SortableContext with verticalListSortingStrategy, useSortable per item. Show drag handle, question text, edit/delete buttons. On drag end: call arrayMove, then reorderFaqs server action with new sortOrder values.
- [x] T018 Integrate sortable list into FAQ page in `app/(protected)/org/[slug]/faq/page.tsx`. When `isSuperAdmin`: render FaqSortableList instead of FaqList. Pass faqs, edit/delete dialog triggers.
- [x] T019 [P] Run TypeScript type check (`npx tsc --noEmit`) and ESLint (`npm run lint`), fix any errors
- [x] T020 Run quickstart.md verification checklist in `specs/005-faq-page/quickstart.md` — validate all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — MVP target
- **US2 (Phase 4)**: Depends on US1 (needs page.tsx structure)
- **US3 (Phase 5)**: Depends on US1 (needs faq-list.tsx component)
- **US4 (Phase 6)**: Depends on US1 (needs faq-list.tsx component)
- **Polish (Phase 7)**: Depends on US1-US4 complete (needs all CRUD for sortable list)

### User Story Dependencies

- **US1 (P1)**: Foundation only → MVP, independently testable
- **US2 (P2)**: Foundation + US1 page.tsx → adds create button to existing page
- **US3 (P3)**: Foundation + US1 faq-list.tsx → adds edit button to list items
- **US4 (P4)**: Foundation + US1 faq-list.tsx → adds delete button to list items
- **Note**: US3 and US4 are independent of each other and can run in parallel

### Within Each Phase

```
Phase 2: T003 → T004 → (T005 ∥ T006 ∥ T007)
Phase 3: T008 → T010, T009 can run parallel
Phase 4: T011 → T012
Phase 5: T013 → T014
Phase 6: T015 → T016
Phase 7: T017 → T018 → (T019 ∥ T020)
```

### Parallel Opportunities

- T005, T006 can run in parallel (different files, no dependencies after T004)
- T009 can run in parallel with T008 (loading.tsx independent of page.tsx)
- US3 (Phase 5) and US4 (Phase 6) can run in parallel (both modify faq-list.tsx but different additions)
- T019 and T020 can run in parallel (different validation concerns)

---

## Parallel Example: Foundational Phase

```bash
# After T004 (migration) completes, launch in parallel:
Task T005: "Create Zod schemas in src/schemas/faq.ts"
Task T006: "Add FAQ menu to navigation in src/lib/navigation.ts"
# T007 depends on T005 (uses Zod schemas), so runs after T005
```

## Parallel Example: US3 + US4

```bash
# After US1 completes, can launch both in parallel:
Task T013: "Create edit dialog" + Task T014: "Add edit button"
Task T015: "Create delete dialog" + Task T016: "Add delete button"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps)
2. Complete Phase 2: Foundational (DB, actions, navigation)
3. Complete Phase 3: User Story 1 (read-only FAQ accordion)
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → Deploy (MVP! 읽기 전용 FAQ)
3. Add US2 → Test → Deploy (FAQ 생성 가능)
4. Add US3 + US4 (parallel) → Test → Deploy (전체 CRUD)
5. Add Polish → Test → Deploy (드래그앤드롭 순서 변경)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Follow 004-notice-crud patterns: `ApiResponse<T>`, `requireSuperAdmin()`, Dialog-based CRUD, "use client" for interactive components
- DndContext must have stable `id` prop to prevent SSR hydration mismatch
- FAQ data is system-wide (no orgId), unlike notices
- Korean language for all UI text and error messages (Constitution I)
- Commit after each completed phase
