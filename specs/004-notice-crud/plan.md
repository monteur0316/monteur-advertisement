# Implementation Plan: 공지사항 관리 (Notice CRUD)

**Branch**: `004-notice-crud` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-notice-crud/spec.md`

## Summary

조직 범위의 공지사항 CRUD 기능을 구현한다. org:admin은 생성/수정/삭제 가능, 전체 구성원은 조회 가능하다. Turso(libSQL) + Drizzle ORM으로 데이터 영속화하며, 상세/작성/수정은 다이얼로그 패턴을 사용한다. 기존 server action 패턴 및 shadcn/ui 컴포넌트를 활용한다.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode), Next.js 16.1.6, React 19.2.3
**Primary Dependencies**: @clerk/nextjs ^6.38.3, shadcn/ui (new-york), Zod ^4.3.6, Tailwind CSS v4, Lucide React
**Storage**: Turso (libSQL) + Drizzle ORM (신규 도입)
**Testing**: NEEDS CLARIFICATION → 현재 프로젝트에 테스트 프레임워크 미설정
**Target Platform**: Web (Vercel 배포)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 페이지 로드 3초 이내, API 응답 200ms 이내 (Constitution VIII 기준)
**Constraints**: LCP <2.5s, CLS <0.1, API <200ms p95
**Scale/Scope**: 조직당 공지사항 수십~수백 건 예상, 페이지네이션 포함

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UI/UX 우선 | ✅ Pass | shadcn/ui 사용, 한국어 UI, 반응형 설계, 즉각적 피드백 (Toast) |
| II. API 문서화 | ⚠️ Deviation | Server Actions 사용 (기존 패턴). RESTful API Route 미사용 → 내부 전용 기능이므로 Swagger 불필요 |
| III. CRUD 패턴 일관성 | ✅ Pass | DataTable, Dialog, AlertDialog, Form+Zod 사용. `{ data, error, message }` 응답 형식 |
| IV. 인증 및 보안 | ✅ Pass | Clerk auth, getAuthContext(), Zod 서버 측 검증, org 격리 |
| V. 코드 구조 및 품질 | ✅ Pass | TypeScript strict, SRP, 기존 디렉토리 구조 준수 |
| VI. 상태 관리 및 데이터 | ⚠️ Partial | RSC 기본, server actions 사용. TanStack Query/React Hook Form 미도입 (기존 패턴 따름) |
| VII. 에러 처리 및 로딩 | ✅ Pass | useTransition 로딩, Alert 에러 표시, router.refresh() |
| VIII. 성능 기준 | ✅ Pass | 페이지 로드 <3s, API <200ms 목표 |

### Constitution Deviations (Justified)

1. **API 문서화 (II)**: 공지사항은 내부 전용 기능으로 Server Actions를 사용한다. 외부 API 소비자가 없으므로 REST API Route + Swagger 추가는 불필요한 복잡성이다. 향후 외부 접근 필요 시 API Route 추가 가능.
2. **React Hook Form (III)**: 기존 코드가 useState + useTransition 패턴을 사용하므로 일관성을 위해 동일 패턴 유지. 공지사항 폼은 필드 3개(제목, 내용, 중요 여부)로 단순하여 React Hook Form의 이점이 크지 않다.
3. **TanStack Query (VI)**: 기존 패턴이 Server Actions + router.refresh()로 충분히 동작한다. 단순 CRUD에 TanStack Query 도입은 과도하다.

## Project Structure

### Documentation (this feature)

```text
specs/004-notice-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (server action contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Database layer (신규)
src/
├── db/
│   ├── index.ts              # Drizzle client + Turso connection
│   └── schema/
│       └── notices.ts        # Notice table schema

# Feature code
src/
├── actions/
│   └── notices.ts            # Server actions (CRUD)
├── schemas/
│   └── notices.ts            # Zod validation schemas
├── types/
│   └── (globals.d.ts 업데이트)

app/(protected)/
├── org/[slug]/notices/
│   ├── page.tsx              # 메인 페이지 (Server Component)
│   └── _components/
│       ├── notice-table.tsx   # 목록 테이블 (Client)
│       ├── notice-detail-dialog.tsx  # 상세 보기 다이얼로그 (Client)
│       ├── create-notice-dialog.tsx  # 생성 다이얼로그 (Client)
│       └── edit-notice-dialog.tsx    # 수정 다이얼로그 (Client)

# Navigation 업데이트
src/lib/navigation.ts          # 공지사항 메뉴 추가

# Admin (P3, 슈퍼 관리자)
app/(protected)/admin/notices/
├── page.tsx
└── _components/
    └── all-notices-table.tsx
```

**Structure Decision**: 기존 Next.js App Router 구조를 따르며, 조직 범위 라우트(`/org/[slug]/notices`)에 기능을 배치한다. 신규 DB 레이어(`src/db/`)를 추가한다.

## Complexity Tracking

| Deviation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Turso + Drizzle 도입 | 프로젝트 첫 데이터 영속화 레이어 필요 | Clerk API만으로는 커스텀 데이터 저장 불가 |
| Server Actions (REST API 대신) | 내부 전용 기능, 기존 패턴 일관성 | REST + Swagger 추가 시 불필요한 복잡성 |
