# Research: 005-faq-page

**Date**: 2026-03-03

## Decision 1: 데이터 저장소

- **Decision**: Turso (libSQL) + Drizzle ORM (기존 인프라 활용)
- **Rationale**: 004-notice-crud에서 이미 Turso + Drizzle 인프라가 구축됨. DB 클라이언트, 마이그레이션 파이프라인, 스키마 패턴이 모두 확립되어 있어 재사용이 최적.
- **Alternatives considered**: 없음 (기존 인프라 활용이 명백한 최선)

## Decision 2: 드래그앤드롭 라이브러리

- **Decision**: `@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0 + `@dnd-kit/utilities` 3.2.2 (legacy stable)
- **Rationale**:
  - React 19에서 클라이언트 컴포넌트로 정상 동작 (peer dep `>=16.8.0`)
  - 번들 크기 최소: ~6-7KB gzipped (전체 패키지 합계)
  - 외부 의존성 없음 (React만 필요)
  - Next.js App Router 호환: `DndContext`에 stable `id` prop 전달로 SSR hydration 이슈 해결
  - 가장 널리 사용되고 문서화가 잘 되어 있음
- **Alternatives considered**:
  - `@dnd-kit/react` 0.3.x (신세대): React 19 전용 설계이나 beta 상태, 1.0 미출시, "use client" 관련 미해결 이슈
  - `react-beautiful-dnd`: 2025년 8월 deprecated/archived
  - `@hello-pangea/dnd`: React 19 미지원
  - `@formkit/drag-and-drop`: 경량이지만 React 생태계 통합 부족
- **주의사항**: `DndContext`에 반드시 stable `id` prop 전달 (hydration mismatch 방지)

## Decision 3: 데이터 접근 패턴 (Server Actions vs API Routes)

- **Decision**: Server Actions
- **Rationale**: 004-notice-crud와 동일한 패턴. FAQ는 내부 기능으로 외부 API 소비자가 없음. Server Actions가 Next.js App Router에서 권장되는 뮤테이션 패턴.
- **Alternatives considered**: REST API Routes (Constitution II에서 권장하지만, 외부 소비자 없는 내부 기능에는 Server Actions가 적합 - 004 선례)

## Decision 4: FAQ 데이터 범위 (시스템 전역 vs 조직 범위)

- **Decision**: 시스템 전역 (orgId 없음)
- **Rationale**: 스펙에서 명시 - "FAQ 페이지는 조직(Organization) 범위가 아닌 시스템 전역으로 운영". 모든 조직의 사용자가 동일한 FAQ를 본다. notices 테이블과 달리 orgId 컬럼 불필요.
- **Alternatives considered**: 조직별 FAQ (스펙에서 명시적으로 거부됨)

## Decision 5: UI 컴포넌트 패턴

- **Decision**: shadcn/ui Accordion (목록 표시) + Dialog (생성/수정) + AlertDialog (삭제 확인)
- **Rationale**:
  - FAQ 질문-답변 펼치기 UX에 Accordion이 가장 적합
  - 생성/수정은 Dialog 패턴 (notice-crud와 일관)
  - 삭제 확인은 AlertDialog (Constitution III 준수)
  - shadcn/ui Accordion 컴포넌트 신규 설치 필요
- **Alternatives considered**: DataTable (Constitution III 기본이나, 짧은 Q&A에 과도)

## Decision 6: 순서 관리 방식

- **Decision**: integer `sortOrder` 컬럼 + 드래그앤드롭 후 bulk update
- **Rationale**:
  - FAQ 항목이 50개 미만이므로 간단한 integer 순서로 충분
  - 드래그앤드롭 후 변경된 항목들의 sortOrder를 일괄 업데이트
  - ORDER BY sortOrder ASC로 조회
- **Alternatives considered**:
  - fractional indexing (과도한 복잡도)
  - linked list (쿼리 복잡도 증가)
