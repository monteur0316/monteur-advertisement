<!--
Sync Impact Report
==================
- Version change: 1.0.0 → 1.1.0 (MINOR — 기존 원칙에 새 규칙 추가)
- Modified principles:
  - I. UI/UX 우선: 한국어 기본 언어 규칙 추가
    (html lang="ko", UI 텍스트 한국어 작성, 다국어 시 한국어 fallback)
- Added sections: 없음
- Removed sections: 없음
- Templates requiring updates:
  - plan-template.md — ✅ 변경 불필요
  - spec-template.md — ✅ 변경 불필요
  - tasks-template.md — ✅ 변경 불필요
- Deferred items:
  - TODO(DATABASE): 데이터베이스 선택 추후 결정
  - TODO(ORM): ORM 선택 추후 결정
-->

# Monteur Advertisement Constitution

## Core Principles

### I. UI/UX 우선 (User Experience First)

- shadcn/ui를 표준 컴포넌트 라이브러리로 사용한다
- 모든 페이지는 반응형(Responsive) 디자인을 적용한다
- 일관된 레이아웃 패턴을 유지한다:
  사이드바 네비게이션 + 헤더 + 콘텐츠 영역
- 사용자 액션에 대한 즉각적인 피드백을 제공해야 한다
  (Toast 알림, 로딩 상태, 성공/실패 표시)
- 접근성(Accessibility) WCAG 2.1 AA 기준을 준수한다
- 다크 모드는 초기 버전에서 제외하며, 라이트 모드를
  기본으로 한다
- 웹페이지의 기본 언어는 한국어(ko)로 설정한다:
  - `<html lang="ko">` 속성을 반드시 명시해야 한다
  - UI 텍스트, 레이블, 안내 메시지는 한국어로 작성한다
  - 다국어 지원이 필요한 경우 한국어를 기본(fallback)으로
    유지한다

### II. API 문서화 (Swagger/OpenAPI)

- 모든 API 엔드포인트는 OpenAPI 3.0 명세로 문서화해야 한다
- Next.js API Route 생성 시 반드시 해당 엔드포인트의
  Swagger 문서를 함께 작성해야 한다
- 요청/응답 스키마, 상태 코드, 에러 응답을 명세에 포함해야 한다
- Swagger UI를 `/api-docs` 경로에서 접근 가능하도록 제공한다
- API 변경 시 문서를 동시에 업데이트해야 하며,
  문서와 실제 구현의 불일치를 허용하지 않는다
- Zod 스키마로부터 OpenAPI 스키마를 자동 생성하는 방식을
  권장한다 (zod-to-openapi 등 활용)

### III. CRUD 패턴 일관성 (CRUD Pattern Consistency)

- 데이터 목록: DataTable 컴포넌트(정렬, 필터, 페이지네이션 포함)를
  표준으로 사용한다
- 생성/수정: shadcn/ui Form + React Hook Form + Zod 조합을
  표준 폼 패턴으로 사용한다
- 삭제: 확인 다이얼로그(AlertDialog)를 반드시 포함해야 한다
- 상세 보기: Sheet 또는 별도 페이지 중 데이터 복잡도에 따라
  선택한다
- API 엔드포인트는 RESTful 규칙을 따른다:
  - `GET /api/{resource}` — 목록 조회
  - `POST /api/{resource}` — 생성
  - `GET /api/{resource}/[id]` — 상세 조회
  - `PUT /api/{resource}/[id]` — 수정
  - `DELETE /api/{resource}/[id]` — 삭제
- 모든 API 응답은 통일된 형식을 사용한다:
  `{ data, error, message }`

### IV. 인증 및 보안 (Authentication & Security)

- 인증은 Clerk Authentication을 사용한다
- 모든 보호된 페이지는 Clerk 미들웨어로 인증을 검증한다
- API Route는 `auth()` 또는 Clerk 미들웨어를 통해
  인증된 요청만 허용한다
- 사용자 입력은 반드시 Zod 스키마로 서버 측 검증을 수행한다
- 환경 변수에 민감한 정보를 저장하며, 클라이언트에
  노출하지 않는다 (`NEXT_PUBLIC_` 접두사 최소화)
- SQL Injection, XSS 등 OWASP Top 10 취약점을
  방지하는 코드를 작성한다

### V. 코드 구조 및 품질 (Code Structure & Quality)

- 한 파일에 코드가 2,000줄을 초과하지 않는다
- TypeScript strict 모드를 사용하며, `any` 타입 사용을
  금지한다
- 컴포넌트는 단일 책임 원칙(SRP)을 따른다:
  UI 컴포넌트, 비즈니스 로직, 데이터 페칭을 분리한다
- 재사용 가능한 컴포넌트는 `src/components/` 에 배치한다
- 페이지별 컴포넌트는 해당 라우트 디렉토리 내
  `_components/` 에 배치한다
- 유틸리티 함수는 `src/lib/` 에 배치한다
- 타입 정의는 `src/types/` 에 배치한다
- 서버 액션은 `src/actions/` 에 배치한다
- Zod 스키마는 `src/schemas/` 에 배치한다

### VI. 상태 관리 및 데이터 패턴 (State & Data Patterns)

- React Server Components를 기본으로 사용한다
- 클라이언트 상태가 필요한 경우에만 `"use client"`를
  명시적으로 선언한다
- 서버 데이터 페칭은 Server Actions 또는
  Route Handlers를 사용한다
- 클라이언트 측 데이터 캐싱 및 뮤테이션은
  TanStack Query(React Query)를 사용한다
- 전역 상태는 최소화하며, 필요시 Zustand를 사용한다
- URL 상태(필터, 정렬, 페이지네이션)는 URL Search Params로
  관리한다

### VII. 에러 처리 및 로딩 (Error Handling & Loading States)

- 모든 비동기 작업에 로딩 상태를 표시한다
  (Skeleton, Spinner 등)
- API 에러는 통일된 에러 응답 형식으로 반환한다:
  `{ error: string, code: string, details?: unknown }`
- 페이지 수준 에러는 Next.js error.tsx를 사용한다
- 컴포넌트 수준 에러는 Error Boundary를 사용한다
- 사용자에게 의미 있는 에러 메시지를 표시하며,
  기술적 상세는 콘솔에만 기록한다
- 낙관적 업데이트(Optimistic Update)를 적극 활용하여
  사용자 체감 속도를 향상한다

### VIII. 성능 기준 (Performance Standards)

- 초기 페이지 로드: 3초 이내 (3G 네트워크 기준)
- API 응답 시간: 200ms 이내 (일반 CRUD 작업)
- Largest Contentful Paint(LCP): 2.5초 이내
- Cumulative Layout Shift(CLS): 0.1 미만
- Next.js Image 컴포넌트를 사용하여 이미지를 최적화한다
- 불필요한 클라이언트 번들 크기를 최소화한다
  (동적 import, tree shaking 활용)

## Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+ (strict mode)
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **Authentication**: Clerk
- **Form Management**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (React Query)
- **API Documentation**: OpenAPI 3.0 + Swagger UI
- **Database**: TODO(DATABASE) — 추후 결정
- **ORM**: TODO(ORM) — 추후 결정 (Prisma 또는 Drizzle 권장)
- **Deployment**: Vercel

## Development Workflow

- 기능 개발은 feature 브랜치에서 진행한다
- 커밋 메시지는 Conventional Commits 형식을 따른다
  (feat:, fix:, docs:, refactor:, test:, chore:)
- 코드 변경 시 ESLint와 TypeScript 타입 체크를
  반드시 통과해야 한다
- 새로운 API 엔드포인트 추가 시 Swagger 문서를
  동시에 작성한다
- 새로운 CRUD 기능 추가 시 위 III번 패턴을 준수한다
- 컴포넌트 추가 시 shadcn/ui 컴포넌트를 우선 활용하고,
  커스텀 컴포넌트는 최소화한다

## Governance

- 본 Constitution은 프로젝트의 모든 개발 활동에 우선한다
- 원칙 변경 시 변경 사유, 영향 범위, 마이그레이션 계획을
  문서화해야 한다
- 모든 코드 리뷰에서 Constitution 준수 여부를 확인한다
- 원칙과 충돌하는 구현이 필요한 경우 해당 사유를
  코드 주석 또는 PR 설명에 명시한다
- Constitution 버전은 시맨틱 버저닝을 따른다:
  - MAJOR: 원칙 삭제 또는 근본적 변경
  - MINOR: 새로운 원칙 또는 섹션 추가
  - PATCH: 문구 수정, 오탈자, 비의미적 개선

**Version**: 1.1.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-03-03
