# Data Model: Sidebar Navigation

**Feature**: 002-sidebar | **Date**: 2026-03-03

## Entities

### NavigationItem

개별 메뉴 항목. 사이드바에서 클릭 가능한 하나의 링크를 나타낸다.

| Field | Type | Description |
|-------|------|-------------|
| href | string | 라우트 경로 (예: "/admin", "/admin/users") |
| label | string | 표시 라벨 (예: "Admin Dashboard") |
| icon | LucideIcon | Lucide 아이콘 컴포넌트 |
| roles | UserRole[] | 접근 가능한 역할 목록 |

**Validation Rules**:
- `href`는 "/" 로 시작하는 유효한 경로여야 한다
- `label`은 빈 문자열이 아니어야 한다
- `roles`는 최소 1개 이상의 역할을 포함해야 한다
- `icon`은 유효한 Lucide 아이콘 컴포넌트여야 한다

### NavigationGroup

관련 NavigationItem들의 논리적 그룹. 그룹 헤더와 하위 항목을 포함한다.

| Field | Type | Description |
|-------|------|-------------|
| label | string | 그룹 헤더 라벨 (예: "관리", "광고주", "대행사") |
| items | NavigationItem[] | 그룹에 속한 메뉴 항목 목록 |

**Validation Rules**:
- `label`은 빈 문자열이 아니어야 한다
- `items`는 최소 1개 이상의 항목을 포함해야 한다

### SidebarState (shadcn/ui 내장)

사이드바의 현재 UI 상태. shadcn/ui SidebarProvider가 자동 관리한다.

| Field | Type | Description |
|-------|------|-------------|
| open | boolean | 사이드바 열림/닫힘 (모바일) 또는 확장/축소 (데스크톱) |
| isMobile | boolean | 현재 뷰포트가 모바일인지 여부 (768px 기준) |

**State Persistence**: cookie (`sidebar_state`) — SidebarProvider 내장

## Relationships

```
NavigationGroup 1 ──→ N NavigationItem
UserRole 1 ──→ N NavigationItem (역할이 항목 접근 가능 여부 결정)
```

## Static Configuration

네비게이션 설정은 데이터베이스가 아닌 코드 내 상수로 정의된다 (`src/lib/navigation.ts`).

### 초기 그룹 구성

```
그룹 "관리":
  - Admin Dashboard (/admin) — roles: [admin]
  - User Management (/admin/users) — roles: [admin]

그룹 "광고주":
  - Advertiser Dashboard (/advertiser) — roles: [advertiser, admin]

그룹 "대행사":
  - Agency Dashboard (/agency) — roles: [agency, admin]
```

## Filtering Logic

서버에서 현재 사용자의 역할에 따라 네비게이션을 필터링한다:

1. 모든 그룹을 순회
2. 각 그룹의 항목 중 사용자 역할이 `item.roles`에 포함된 것만 필터링
3. 필터링 후 항목이 0개인 그룹은 제외
4. 필터링된 그룹 배열을 클라이언트에 전달

## Existing Types (재사용)

- `UserRole` from `src/types/globals.d.ts`: `"admin" | "advertiser" | "agency"`
- `LucideIcon` from `lucide-react`: 아이콘 컴포넌트 타입
