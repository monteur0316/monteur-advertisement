# Component Interfaces: Sidebar Navigation

**Feature**: 002-sidebar | **Date**: 2026-03-03

## AppSidebar

메인 사이드바 컴포넌트. 로고, 네비게이션 그룹, SidebarRail을 포함한다.

```typescript
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: NavigationGroup[]
}
```

**Usage**:
```tsx
<AppSidebar groups={filteredGroups} />
```

**Behavior**:
- `collapsible="icon"` 모드로 동작 (아이콘 축소 지원)
- SidebarHeader에 앱 로고/브랜딩 표시
- SidebarContent에 NavGroup 컴포넌트들 렌더링
- SidebarRail로 축소 상태에서 호버 확장 지원

## NavGroup

그룹 헤더와 하위 메뉴 항목을 렌더링하는 컴포넌트.

```typescript
interface NavGroupProps {
  group: NavigationGroup
}
```

**Behavior**:
- SidebarGroup + SidebarGroupLabel로 그룹 헤더 표시
- 하위 NavItem 컴포넌트들 렌더링
- 그룹 내 활성 항목이 있으면 그룹 헤더에 강조 스타일 적용

## NavItem

개별 메뉴 항목 컴포넌트.

```typescript
interface NavItemProps {
  item: NavigationItem
  isActive: boolean
}
```

**Behavior**:
- SidebarMenuButton으로 렌더링
- `isActive` prop으로 활성 상태 스타일 적용
- `tooltip={item.label}`로 compact 모드 툴팁 지원
- Next.js `Link` 사용 (클라이언트 네비게이션)

## SidebarLogo

사이드바 상단 로고/브랜딩 영역.

```typescript
interface SidebarLogoProps {
  // No props — 앱 로고는 고정
}
```

**Behavior**:
- SidebarHeader 내부에 배치
- compact 모드: 아이콘만 표시
- 확장 모드: 아이콘 + "Monteur" 텍스트 표시

## Navigation Config (src/lib/navigation.ts)

```typescript
// Type definitions
interface NavigationItem {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

// Exported functions
function getNavigationGroups(): NavigationGroup[]
function filterGroupsByRole(groups: NavigationGroup[], role: UserRole | null): NavigationGroup[]
```

## Layout Integration

### Protected Layout (Server Component)

```
app/(protected)/layout.tsx:
  1. auth() → role 조회
  2. getNavigationGroups() → 전체 그룹
  3. filterGroupsByRole(groups, role) → 필터링
  4. groups.length === 0 → 사이드바 없이 콘텐츠만 렌더링
  5. groups.length > 0 → SidebarProvider > AppSidebar + SidebarInset
```

### SidebarInset Content

```
SidebarInset:
  header: SidebarTrigger + Separator + Header (기존 헤더 내용 재활용)
  main: children (페이지 콘텐츠)
```
