# Implementation Plan: 자주묻는 질문 (FAQ) 페이지

**Branch**: `005-faq-page` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-faq-page/spec.md`

## Summary

FAQ(자주묻는 질문) 페이지 구현. 인증된 모든 사용자가 `/org/[slug]/faq` 경로에서 아코디언 형태로 FAQ를 조회하고, 슈퍼 어드민은 같은 페이지에서 CRUD 및 드래그앤드롭 순서 변경을 수행한다. 데이터는 시스템 전역(org 범위 아님)으로 관리되며, 기존 Turso + Drizzle ORM 인프라와 Server Actions 패턴을 활용한다.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, @clerk/nextjs ^6.38.3, shadcn/ui, Zod ^4.3.6, @dnd-kit/core + @dnd-kit/sortable (신규 설치)
**Storage**: Turso (libSQL) + Drizzle ORM ^0.45.1 (기존 인프라 활용)
**Testing**: TypeScript 타입 체크 + ESLint (기존 프로젝트 패턴)
**Target Platform**: 웹 브라우저 (Vercel 배포)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 페이지 로드 3초 이내, API 응답 200ms 이내 (Constitution VIII 기준)
**Constraints**: FAQ 50개 미만, 단순 텍스트만, 페이지네이션 불필요
**Scale/Scope**: 시스템 전역 FAQ (조직 범위 아님), 슈퍼 어드민만 관리

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| I. UI/UX 우선 | ✅ PASS | shadcn/ui Accordion 사용, 반응형, 한국어 기본 |
| II. API 문서화 | ⚠️ N/A | Server Actions 사용 (004-notice-crud 선례). 외부 API 소비자 없음 |
| III. CRUD 패턴 일관성 | ✅ PASS | FAQ는 아코디언 표시 (DataTable 대신), AlertDialog 삭제 확인, Form+Zod 검증, 응답 형식 `{ data, error, message }` |
| IV. 인증 및 보안 | ✅ PASS | Clerk auth, `requireSuperAdmin()` 가드, Zod 서버 검증 |
| V. 코드 구조 및 품질 | ✅ PASS | TypeScript strict, SRP, 기존 디렉토리 구조 준수 |
| VI. 상태 관리 및 데이터 | ✅ PASS | RSC 기본, 필요시 "use client", Server Actions |
| VII. 에러 처리 및 로딩 | ✅ PASS | loading.tsx, 에러 메시지, 폼 검증 피드백 |
| VIII. 성능 기준 | ✅ PASS | 50개 미만 항목, 단순 쿼리, 3초 이내 로드 |

**III번 참고**: FAQ는 목록형 데이터이지만 DataTable 대신 Accordion UI가 더 적합하다 (질문-답변 펼치기 UX). 이는 스펙의 명시적 요구사항이며, 데이터 복잡도가 낮아 테이블이 과도하다.

## Project Structure

### Documentation (this feature)

```text
specs/005-faq-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── db/
│   └── schema/
│       └── faqs.ts              # FAQ 테이블 스키마 (신규)
├── actions/
│   └── faq.ts                   # FAQ Server Actions (신규)
├── schemas/
│   └── faq.ts                   # FAQ Zod 검증 스키마 (신규)
├── components/
│   └── app-sidebar.tsx          # 네비게이션 항목 추가 (수정)
├── lib/
│   └── navigation.ts            # FAQ 메뉴 항목 추가 (수정)
└── types/
    └── globals.d.ts             # (변경 불필요)

app/(protected)/
└── org/[slug]/faq/
    ├── page.tsx                 # FAQ 페이지 (서버 컴포넌트)
    ├── loading.tsx              # 로딩 스켈레톤
    └── _components/
        ├── faq-list.tsx         # FAQ 아코디언 목록 (클라이언트)
        ├── faq-sortable-list.tsx # 드래그앤드롭 순서 변경 (클라이언트, 어드민 전용)
        ├── create-faq-dialog.tsx # FAQ 생성 다이얼로그 (클라이언트)
        ├── edit-faq-dialog.tsx   # FAQ 수정 다이얼로그 (클라이언트)
        └── delete-faq-dialog.tsx # FAQ 삭제 확인 (클라이언트)

components/ui/
└── accordion.tsx                # shadcn/ui Accordion (신규 설치)

migrations/
└── XXXX_faq_table.sql           # FAQ 테이블 마이그레이션 (자동 생성)
```

**Structure Decision**: 004-notice-crud 패턴을 따르되, FAQ 특성에 맞게 조정:
- org-scoped 대신 시스템 전역 데이터 (orgId 없음)
- DataTable 대신 Accordion UI
- 드래그앤드롭 순서 변경을 위한 별도 sortable 컴포넌트

## Complexity Tracking

| 차이점 | 이유 | 대안을 거부한 이유 |
|--------|------|-------------------|
| @dnd-kit 신규 의존성 | 스펙에서 드래그앤드롭 순서 변경 명시 | 숫자 입력은 사용자가 거부함 |
| Accordion (DataTable 대신) | FAQ 질문-답변 UX에 Accordion이 적합 | DataTable은 짧은 Q&A 표시에 과도 |
