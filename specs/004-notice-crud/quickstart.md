# Quickstart: 공지사항 관리 (Notice CRUD)

**Branch**: `004-notice-crud` | **Date**: 2026-03-03

## Prerequisites

1. Turso CLI 설치 및 계정 생성
2. Turso 데이터베이스 생성
3. 환경변수 설정

## Setup Steps

### 1. Turso 데이터베이스 생성

```bash
# Turso CLI 설치 (미설치 시)
curl -sSfL https://get.tur.so/install.sh | bash

# 로그인
turso auth login

# 데이터베이스 생성
turso db create monteur-advertisement

# URL 확인
turso db show monteur-advertisement --url

# 토큰 생성
turso db tokens create monteur-advertisement
```

### 2. 환경변수 설정

`.env.local` 파일에 추가:

```
TURSO_DATABASE_URL=libsql://monteur-advertisement-<your-org>.turso.io
TURSO_AUTH_TOKEN=<your-token>
```

### 3. 패키지 설치

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit dotenv
```

### 4. 마이그레이션 실행

```bash
npm run db:generate   # SQL 파일 생성
npm run db:migrate    # DB에 적용
```

### 5. 개발 서버 실행

```bash
npm run dev
```

### 6. 확인

- http://localhost:3000 접속
- 조직 선택 후 사이드바에서 "공지사항" 메뉴 확인
- org:admin 계정으로 공지사항 CRUD 테스트

## Key Files

| File | Description |
|------|-------------|
| `src/db/index.ts` | Drizzle + Turso 클라이언트 |
| `src/db/schema/notices.ts` | Notice 테이블 스키마 |
| `src/actions/notices.ts` | Server Actions (CRUD) |
| `src/schemas/notices.ts` | Zod 검증 스키마 |
| `app/(protected)/org/[slug]/notices/page.tsx` | 공지사항 페이지 |
| `src/lib/navigation.ts` | 사이드바 메뉴 (공지사항 추가) |
| `drizzle.config.ts` | Drizzle Kit 설정 |

## Verification Checklist

- [ ] 조직 구성원이 공지사항 목록을 볼 수 있는가?
- [ ] org:admin이 공지사항을 생성할 수 있는가?
- [ ] org:admin이 공지사항을 수정할 수 있는가?
- [ ] org:admin이 공지사항을 삭제할 수 있는가 (확인 다이얼로그 포함)?
- [ ] org:member에게 생성/수정/삭제 버튼이 숨겨지는가?
- [ ] 중요 공지가 목록 상단에 고정되는가?
- [ ] 빈 상태 메시지가 표시되는가?
- [ ] 슈퍼 관리자가 전체 공지를 관리할 수 있는가?
