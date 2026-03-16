# Quickstart: 005-faq-page

**Date**: 2026-03-03

## Prerequisites

- 기존 Turso DB 환경 설정 완료 (004-notice-crud에서 구성)
- `.env.local`에 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정 완료

## Setup Steps

### 1. 의존성 설치

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add accordion
```

### 3. DB 스키마 생성 & 마이그레이션

```bash
# src/db/schema/faqs.ts 작성 후
npm run db:generate
npm run db:push     # 개발 환경
# 또는
npm run db:migrate  # 프로덕션
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 검증

- [ ] `/org/[slug]/faq` 페이지 접근 가능
- [ ] FAQ 빈 상태 메시지 표시
- [ ] 슈퍼 어드민: "새 질문 추가" 버튼 표시
- [ ] 일반 사용자: 관리 버튼 미표시
- [ ] FAQ 생성 → 목록에 표시
- [ ] FAQ 수정 → 변경사항 반영
- [ ] FAQ 삭제 → 확인 후 제거
- [ ] 드래그앤드롭 순서 변경 동작
- [ ] 사이드바에 FAQ 메뉴 표시

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @dnd-kit/core | ^6.3.1 | 드래그앤드롭 코어 |
| @dnd-kit/sortable | ^10.0.0 | 정렬 가능 목록 |
| @dnd-kit/utilities | ^3.2.2 | CSS 변환 유틸리티 |

## New shadcn/ui Components

| Component | Purpose |
|-----------|---------|
| Accordion | FAQ 질문-답변 아코디언 UI |
