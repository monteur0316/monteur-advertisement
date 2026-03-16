# Implementation Plan: Sidebar Navigation

**Branch**: `002-sidebar` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-sidebar/spec.md`

## Summary

현재 `app/(protected)/layout.tsx`에 인라인으로 구현된 기본 사이드바를 shadcn/ui Sidebar 컴포넌트 기반의 프로덕션 수준 사이드바로 재구축한다. Full-height 레이아웃 (사이드바 좌측 전체 높이 + 헤더 우측 배치), 역할 기반 그룹 네비게이션, 데스크톱 축소/확장, 모바일 Sheet 드로어를 구현한다.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, shadcn/ui (new-york style), Tailwind CSS v4, @clerk/nextjs ^6.38.3, Lucide React
**Storage**: localStorage (사이드바 상태 유지)
**Testing**: Manual testing (E2E 프레임워크 미설정)
**Target Platform**: Web (Desktop + Mobile, breakpoint 768px)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 3초 이내 렌더링 (3G), 300ms 이내 인터랙션
**Constraints**: 기존 Clerk 인증 체계 유지, shadcn/ui 컴포넌트 우선 사용
**Scale/Scope**: 3개 역할, 4개 네비게이션 항목 (확장 가능 구조)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UI/UX 우선 | PASS | shadcn/ui 표준 사용, 반응형 디자인, 일관된 레이아웃 패턴 (사이드바+헤더+콘텐츠) |
| II. API 문서화 | N/A | API 엔드포인트 없음 (순수 UI 컴포넌트) |
| III. CRUD 패턴 | N/A | CRUD 기능 없음 |
| IV. 인증 및 보안 | PASS | 기존 Clerk 미들웨어 및 auth() 활용, 역할 기반 메뉴 필터링 |
| V. 코드 구조 | PASS | SRP 준수 (사이드바 컴포넌트 분리), src/components/ 배치 |
| VI. 상태 관리 | PASS | RSC 기본, "use client" 최소 사용 (사이드바 인터랙션만), localStorage 상태 유지 |
| VII. 에러 처리 | PASS | 역할 없음/메뉴 없음 엣지 케이스 처리 |
| VIII. 성능 기준 | PASS | 3초 이내 로드, CLS 최소화 (고정 레이아웃) |

**Gate Result**: ALL PASS — Phase 0 진행 가능

### Post-Phase 1 Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UI/UX 우선 | PASS | shadcn/ui sidebar 컴포넌트 사용, sidebar-07 패턴 (아이콘 축소), 반응형 Sheet 드로어 |
| V. 코드 구조 | PASS | AppSidebar, NavGroup, NavItem으로 SRP 분리, navigation.ts에 설정 중앙화 |
| VI. 상태 관리 | PASS | SidebarProvider 내장 cookie 기반 상태 유지 (localStorage 대신), SSR 호환 |

**Post-Design Gate Result**: ALL PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-sidebar/
├── plan.md              # This file
├── research.md          # Phase 0: shadcn/ui sidebar 분석, 상태 관리 전략
├── data-model.md        # Phase 1: 네비게이션 타입 정의
├── quickstart.md        # Phase 1: 개발 시작 가이드
├── contracts/           # Phase 1: 컴포넌트 인터페이스
└── tasks.md             # Phase 2: 태스크 분해 (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── header.tsx                    # 수정: full-width → 사이드바 우측 배치
│   ├── app-sidebar.tsx               # 신규: 메인 사이드바 컴포넌트
│   ├── nav-group.tsx                 # 신규: 그룹 네비게이션 컴포넌트
│   └── nav-item.tsx                  # 신규: 개별 네비게이션 아이템
├── lib/
│   ├── auth.ts                       # 기존 유지
│   └── navigation.ts                 # 신규: 네비게이션 설정 (항목, 그룹, 역할 매핑)
└── types/
    └── globals.d.ts                  # 기존 유지 (UserRole 재사용)

app/
├── layout.tsx                        # 수정: full-height 사이드바 레이아웃 적용
└── (protected)/
    └── layout.tsx                    # 수정: 인라인 사이드바 제거 → AppSidebar 사용

components/ui/
├── sidebar.tsx                       # 신규: shadcn/ui sidebar 설치
├── sheet.tsx                         # 신규: shadcn/ui sheet 설치 (모바일)
└── tooltip.tsx                       # 신규: shadcn/ui tooltip 설치 (compact 모드)
```

**Structure Decision**: Next.js App Router 단일 프로젝트 구조. 사이드바 관련 컴포넌트는 `src/components/`에 배치하고, 네비게이션 설정은 `src/lib/navigation.ts`에 중앙화한다. shadcn/ui 프리미티브는 `components/ui/`에 설치한다.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
