# Quickstart: Sidebar Navigation

**Feature**: 002-sidebar | **Date**: 2026-03-03

## Prerequisites

- Node.js 18+
- `002-sidebar` 브랜치 체크아웃
- 환경 변수 설정 완료 (Clerk keys)

## Setup

```bash
# 브랜치 체크아웃
git checkout 002-sidebar

# 의존성 설치
npm install

# shadcn/ui 컴포넌트 설치
npx shadcn@latest add sidebar sheet tooltip separator collapsible

# 개발 서버 실행
npm run dev
```

## 구현 순서

### 1. 네비게이션 설정 정의
- `src/lib/navigation.ts` 생성
- NavigationItem, NavigationGroup 타입 정의
- 역할별 그룹/항목 상수 정의
- `filterGroupsByRole()` 필터링 함수 구현

### 2. 사이드바 컴포넌트 구현
- `src/components/app-sidebar.tsx` — 메인 사이드바 (SidebarHeader + SidebarContent)
- `src/components/nav-group.tsx` — 그룹 네비게이션 (SidebarGroup + SidebarGroupLabel)
- `src/components/nav-item.tsx` — 개별 아이템 (SidebarMenuButton + Link)
- `usePathname()` 기반 활성 상태 감지

### 3. 레이아웃 변경
- `app/(protected)/layout.tsx` 수정:
  - 인라인 사이드바 제거
  - SidebarProvider > AppSidebar + SidebarInset 구조
  - 서버에서 역할 기반 필터링 후 props 전달
- `app/layout.tsx` — 최소 변경 (Header를 protected 영역으로 이동할 수 있음)

### 4. 헤더 통합
- `src/components/header.tsx` 수정:
  - SidebarInset 내부의 header 영역에 통합
  - SidebarTrigger (햄버거 메뉴) 추가
  - 기존 Clerk UserButton 유지

### 5. 검증
- 각 역할(admin, advertiser, agency)로 로그인하여 메뉴 필터링 확인
- 모바일 뷰포트에서 Sheet 드로어 동작 확인
- 데스크톱에서 축소/확장 토글 및 상태 유지 확인
- 활성 상태 표시 (항목 + 그룹 헤더) 확인

## Key Files

| File | Role |
|------|------|
| `src/lib/navigation.ts` | 네비게이션 설정 및 필터링 |
| `src/components/app-sidebar.tsx` | 메인 사이드바 컴포넌트 |
| `src/components/nav-group.tsx` | 그룹 네비게이션 |
| `src/components/nav-item.tsx` | 개별 메뉴 아이템 |
| `app/(protected)/layout.tsx` | 레이아웃 통합 |
| `src/components/header.tsx` | 헤더 수정 |
| `components/ui/sidebar.tsx` | shadcn/ui sidebar (자동 설치) |

## 참고 자료

- shadcn/ui Sidebar: sidebar-07 블록 (아이콘 축소 패턴)
- shadcn/ui Sidebar: sidebar-01 블록 (그룹 네비게이션 패턴)
- specs/002-sidebar/research.md — 기술 결정 사항
- specs/002-sidebar/data-model.md — 데이터 모델
- specs/002-sidebar/contracts/component-interfaces.md — 컴포넌트 인터페이스
