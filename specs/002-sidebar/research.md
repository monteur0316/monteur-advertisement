# Research: Sidebar Navigation

**Feature**: 002-sidebar | **Date**: 2026-03-03

## Decision 1: Sidebar Component Approach

**Decision**: shadcn/ui Sidebar 컴포넌트 사용 (`npx shadcn@latest add sidebar`)

**Rationale**:
- 프로젝트 constitution이 shadcn/ui를 표준 컴포넌트 라이브러리로 지정
- `globals.css`에 sidebar 전용 CSS 변수가 이미 정의됨 (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary` 등)
- 내장 기능: collapsible icon mode, mobile Sheet, tooltip, group, active state, SidebarRail
- sidebar-07 블록이 요구사항과 가장 유사 (아이콘으로 축소되는 사이드바)

**Alternatives considered**:
- 커스텀 구현 (Sheet + 수동 레이아웃): 더 많은 코드, 접근성/모바일 지원 재구현 필요
- Radix Navigation Menu: 사이드바 패턴에 최적화되지 않음

## Decision 2: 레이아웃 아키텍처

**Decision**: `SidebarProvider` > `Sidebar` + `SidebarInset` 패턴으로 full-height 레이아웃 구성

**Rationale**:
- shadcn/ui Sidebar의 `SidebarProvider`가 전체 레이아웃을 관리
- `SidebarInset`이 사이드바 오른쪽 영역 (헤더 + 콘텐츠)을 래핑
- 모바일 자동 감지 (`useSidebar().isMobile`) 내장
- `collapsible="icon"` prop으로 데스크톱 축소/확장 지원

**구조 변경**:
```
Before:
  app/layout.tsx → ClerkProvider > Header > children
  app/(protected)/layout.tsx → aside(inline nav) + main

After:
  app/layout.tsx → ClerkProvider > children (변경 최소화)
  app/(protected)/layout.tsx → SidebarProvider > AppSidebar + SidebarInset > Header + main
```

**Alternatives considered**:
- Root layout에 SidebarProvider 배치: 공개 페이지(sign-in, sign-up)에도 사이드바 렌더링 오버헤드 발생
- 별도 컨텍스트 관리: SidebarProvider가 이미 제공하므로 불필요

## Decision 3: Active State 감지 방식

**Decision**: `usePathname()` (Next.js) + pathname 매칭으로 활성 상태 결정

**Rationale**:
- Next.js App Router에서 `usePathname()`이 현재 경로를 반환
- 정확 매칭 (`pathname === item.href`) + 접두사 매칭 (`pathname.startsWith(group.prefix)`)으로 계층적 활성 표시
- `SidebarMenuButton`의 `isActive` prop으로 shadcn/ui 내장 활성 스타일 적용

**매칭 로직**:
- Navigation Item: `pathname === item.href` (정확 매칭)
- Navigation Group: 그룹 내 항목 중 하나가 활성이면 그룹 헤더도 활성

**Alternatives considered**:
- URL 파라미터 기반: 불필요한 복잡성, 현재 라우트 구조로 충분
- 수동 상태 관리 (useState): pathname 변경 시 동기화 문제 발생 가능

## Decision 4: 상태 지속성 (축소/확장)

**Decision**: `SidebarProvider`의 `defaultOpen` prop + cookie 기반 상태 유지

**Rationale**:
- shadcn/ui Sidebar가 내부적으로 cookie(`sidebar_state`)를 사용하여 상태 유지
- 별도 localStorage 구현 불필요 — SidebarProvider가 자동 처리
- SSR 호환: cookie는 서버에서도 읽을 수 있어 레이아웃 시프트 방지

**Alternatives considered**:
- localStorage: SSR에서 읽을 수 없어 초기 렌더링 시 깜빡임 발생
- Zustand: 과도한 의존성 추가, SidebarProvider 내장 기능으로 충분

## Decision 5: 역할 기반 네비게이션 필터링 위치

**Decision**: 서버 컴포넌트(protected layout)에서 역할 조회 후 클라이언트 사이드바에 props로 전달

**Rationale**:
- `auth()` 호출은 서버에서만 가능 (Clerk 패턴)
- 네비게이션 설정을 서버에서 필터링하여 클라이언트에 전달하면 불필요한 메뉴 데이터가 클라이언트에 노출되지 않음
- AppSidebar는 `"use client"` (인터랙션 필요)이므로, 필터링된 데이터만 받음

**데이터 흐름**:
```
protected/layout.tsx (Server)
  → auth() → role 조회
  → filterNavigationByRole(role) → 필터링된 그룹/항목
  → <AppSidebar groups={filteredGroups} /> (Client)
```

**Alternatives considered**:
- 클라이언트에서 역할 조회: Clerk의 `useUser()` 사용 가능하나, 불필요한 클라이언트 API 호출
- 미들웨어 기반: 과도한 복잡성, 현재 패턴(layout에서 auth())이 이미 효과적

## Decision 6: 설치할 shadcn/ui 컴포넌트

**Decision**: `sidebar`, `sheet`, `tooltip`, `separator`, `collapsible` 설치

**Rationale**:
- `sidebar`: 핵심 사이드바 컴포넌트 (SidebarProvider, Sidebar, SidebarInset 등)
- `sheet`: sidebar가 내부 의존성으로 사용 (모바일 드로어)
- `tooltip`: compact 모드에서 메뉴 라벨 표시
- `separator`: 헤더 내 SidebarTrigger와 콘텐츠 구분
- `collapsible`: sidebar-07 패턴의 그룹 접기/펼치기 (필요시)

**이미 설치됨**: button, dropdown-menu, dialog, table, badge, alert, select, alert-dialog
