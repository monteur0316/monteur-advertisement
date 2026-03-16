# Research: 공지사항 관리 (Notice CRUD)

**Date**: 2026-03-03 | **Branch**: `004-notice-crud`

## Decision 1: Database — Turso (libSQL)

**Decision**: Turso를 데이터베이스로 사용한다.

**Rationale**:
- SQLite 호환으로 가볍고 서버리스 환경에 최적화
- HTTP 기반 프로토콜로 Vercel 서버리스에서 커넥션 풀 관리 불필요
- 글로벌 읽기 복제본으로 낮은 지연시간
- Vercel Marketplace 통합으로 환경변수 자동 설정 가능

**Alternatives considered**:
- Supabase (PostgreSQL): 강력하지만 이 프로젝트 규모에 과도함
- Vercel Postgres: Vercel 종속성이 높음
- Firebase Firestore: NoSQL로 관계형 데이터에 부적합

## Decision 2: ORM — Drizzle ORM

**Decision**: Drizzle ORM을 사용한다.

**Rationale**:
- Turso/libSQL과 네이티브 통합 (dialect: 'turso')
- 타입 세이프 쿼리 빌더로 TypeScript strict mode와 호환
- 경량 (번들 사이즈 작음), 서버리스 콜드스타트에 유리
- Constitution에서 Drizzle 권장 (VII. ORM 선택)

**Alternatives considered**:
- Prisma: 더 성숙하지만 번들 크고 SQLite/Turso 지원이 Drizzle 대비 약함
- 직접 SQL: 타입 안전성 부족, 유지보수 비용 높음

## Decision 3: 패키지 의존성

**Decision**: 최소한의 패키지만 추가한다.

**필수 패키지**:
- `drizzle-orm` — ORM
- `@libsql/client` — Turso 클라이언트
- `drizzle-kit` (dev) — 마이그레이션 CLI

**불필요 패키지**:
- `dotenv` — Next.js 내장 환경변수 로딩으로 불필요 (drizzle.config.ts에서만 필요)
- `react-hook-form` — 기존 패턴(useState) 유지, 폼 필드 3개로 단순
- `@tanstack/react-query` — Server Actions + router.refresh()로 충분

## Decision 4: DB 연결 패턴

**Decision**: 글로벌 싱글톤 패턴으로 DB 클라이언트를 관리한다.

**Rationale**:
- Next.js dev 모드 핫 리로딩 시 중복 연결 방지
- Production에서는 단일 인스턴스로 충분 (HTTP 기반, 커넥션 풀 불필요)

**구현 패턴**:
```
src/db/index.ts:
  - production: 단순 인스턴스 생성
  - development: globalThis에 캐싱
```

## Decision 5: 타임스탬프 전략

**Decision**: `integer` + `mode: 'timestamp'`를 사용한다.

**Rationale**:
- Drizzle가 JavaScript Date 객체로 자동 변환
- 타입 안전성 보장
- `unixepoch()` SQLite 함수로 기본값 설정 (Turso/libSQL 지원)

**주의사항**:
- `$onUpdate()`는 ORM 레벨에서만 동작 (DB 트리거 아님)
- 직접 SQL로 수정 시 updatedAt 갱신 안됨 → 모든 수정은 Drizzle을 통해 수행

## Decision 6: 마이그레이션 전략

**Decision**: `drizzle-kit generate` + `drizzle-kit migrate`를 사용한다.

**Rationale**:
- SQL 마이그레이션 파일 생성으로 변경 이력 관리 가능
- `push`는 프로토타이핑에만 적합, production에는 `migrate` 사용

**package.json scripts**:
```
db:generate — drizzle-kit generate
db:migrate — drizzle-kit migrate
db:push — drizzle-kit push (개발용)
db:studio — drizzle-kit studio
```

## Decision 7: 환경변수

**Decision**: 2개의 환경변수를 추가한다.

| Variable | Purpose |
|----------|---------|
| `TURSO_DATABASE_URL` | Turso DB 연결 URL |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 |

**설정 위치**: `.env.local` (로컬), Vercel Dashboard (배포)

## Decision 8: UI 패턴 — 다이얼로그 기반 CRUD

**Decision**: 모든 상세 조회, 작성, 수정을 다이얼로그(Dialog)로 처리한다.

**Rationale**:
- Clarification 세션에서 사용자가 다이얼로그 방식 선택
- 별도 페이지 라우팅 불필요 → 단순한 구조
- 기존 프로젝트의 Dialog 패턴 (invite-member, create-organization)과 일관

**구현**:
- 상세 보기: Dialog
- 생성: Dialog (DialogTrigger → Button)
- 수정: Dialog (상세 보기에서 전환)
- 삭제: AlertDialog (확인 절차)

## Gotchas & 주의사항

1. **SQLite ALTER TABLE 제한**: 컬럼 변경 시 Drizzle Kit이 테이블 재생성. 초기 스키마 설계를 신중히
2. **`$onUpdate()` ORM 전용**: DB 트리거가 아님. 모든 수정은 반드시 Drizzle ORM을 통해 수행
3. **Embedded Replicas 불가**: Vercel 서버리스에는 영구 파일시스템이 없어 embedded replica 사용 불가
4. **Auth 토큰 만료**: Production 환경에서 장기 토큰 사용 또는 Vercel Marketplace 통합으로 자동 관리
5. **drizzle.config.ts**: Next.js 환경 밖에서 실행되므로 `dotenv` 필요 (이 파일에서만)
