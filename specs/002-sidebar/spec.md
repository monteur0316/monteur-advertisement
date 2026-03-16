# Feature Specification: Sidebar Navigation

**Feature Branch**: `002-sidebar`
**Created**: 2026-02-27
**Status**: Draft
**Input**: 사이드바를 만들 예정이야 어떻게 구상할지 계획을 세워줘

## Clarifications

### Session 2026-03-03

- Q: 사이드바 레이아웃 구조 (full-height vs 헤더 아래)? → A: Full-height 사이드바 (화면 좌측 전체 높이, 상단에 로고/브랜딩 포함, 헤더는 사이드바 오른쪽에 배치)
- Q: 네비게이션 그룹 구성 방식? → A: 역할 도메인별 그룹 — "관리" (Dashboard, Users), "광고주" (Advertiser Dashboard), "대행사" (Agency Dashboard)
- Q: 하위 경로의 활성 상태 표시 방식? → A: 정확히 매칭되는 항목 + 소속 그룹 헤더 모두 활성 강조 (계층적 표시)

## User Scenarios & Testing

### User Story 1 - Role-Based Sidebar Navigation (Priority: P1)

인증된 사용자가 보호된 영역에 접속하면, 자신의 역할에 맞는 네비게이션 항목이 표시되는 사이드바를 통해 페이지 간 이동할 수 있다. 현재 활성 페이지가 시각적으로 강조 표시된다.

**Why this priority**: 사이드바의 핵심 기능으로, 사용자가 애플리케이션 내에서 원활하게 이동하기 위한 기본 요구사항이다.

**Independent Test**: 각 역할(admin, advertiser, agency)로 로그인하여 해당 역할에 맞는 메뉴만 표시되는지 확인하고, 각 메뉴를 클릭하여 활성 상태가 올바르게 표시되는지 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** admin 역할 사용자가 로그인 상태, **When** 보호된 영역에 접속, **Then** Admin Dashboard, User Management, Advertiser, Agency 메뉴가 사이드바에 표시된다
2. **Given** advertiser 역할 사용자가 로그인 상태, **When** 보호된 영역에 접속, **Then** Advertiser 메뉴만 사이드바에 표시된다
3. **Given** 사용자가 특정 페이지에 있음, **When** 사이드바를 확인, **Then** 현재 페이지에 해당하는 메뉴 항목과 소속 그룹 헤더가 모두 활성 상태로 강조 표시된다
4. **Given** 사용자가 사이드바 메뉴를 클릭, **When** 해당 페이지로 이동, **Then** 활성 상태가 새 페이지의 항목과 소속 그룹으로 업데이트된다

---

### User Story 2 - Mobile Responsive Sidebar (Priority: P1)

모바일 기기에서 사이드바는 화면 공간을 절약하기 위해 기본적으로 숨겨지며, 햄버거 메뉴 버튼을 통해 슬라이드 형태로 열고 닫을 수 있다.

**Why this priority**: 광고 관리 플랫폼에서 모바일 접근성은 필수이며, 반응형 디자인 없이는 모바일 사용자 경험이 크게 저하된다.

**Independent Test**: 모바일 뷰포트(768px 미만)에서 사이드바가 숨겨져 있는지 확인하고, 토글 버튼으로 열고 닫을 수 있는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 모바일 뷰포트(768px 미만), **When** 페이지 로드, **Then** 사이드바는 숨겨지고 햄버거 메뉴 버튼이 표시된다
2. **Given** 모바일에서 사이드바가 닫힌 상태, **When** 햄버거 메뉴 버튼 클릭, **Then** 사이드바가 오버레이와 함께 슬라이드-인된다
3. **Given** 모바일에서 사이드바가 열린 상태, **When** 메뉴 항목 클릭, **Then** 해당 페이지로 이동하고 사이드바가 자동으로 닫힌다
4. **Given** 모바일에서 사이드바가 열린 상태, **When** 오버레이 영역 클릭 또는 닫기 버튼, **Then** 사이드바가 닫힌다

---

### User Story 3 - Desktop Collapsible Sidebar (Priority: P2)

데스크톱 사용자는 사이드바를 축소하여 아이콘만 표시되는 compact 모드로 전환할 수 있으며, 이를 통해 메인 콘텐츠 영역의 공간을 확보할 수 있다.

**Why this priority**: 메인 콘텐츠에 집중해야 하는 사용자에게 유용하지만, 핵심 네비게이션 기능이 먼저 구현되어야 한다.

**Independent Test**: 데스크톱에서 사이드바 축소/확장 버튼을 클릭하여 아이콘 모드와 전체 모드 간 전환이 가능한지 확인한다.

**Acceptance Scenarios**:

1. **Given** 데스크톱에서 사이드바가 확장된 상태, **When** 축소 버튼 클릭, **Then** 사이드바가 아이콘만 표시되는 compact 모드로 전환된다
2. **Given** 사이드바가 compact 모드, **When** 확장 버튼 클릭, **Then** 사이드바가 아이콘+라벨 전체 모드로 복원된다
3. **Given** 사이드바가 compact 모드, **When** 아이콘에 마우스 호버, **Then** 해당 메뉴의 라벨이 툴팁으로 표시된다
4. **Given** 사용자가 사이드바를 축소/확장, **When** 페이지를 새로고침, **Then** 이전 상태가 유지된다

---

### User Story 4 - Grouped Navigation Items (Priority: P2)

관련된 메뉴 항목들이 논리적인 그룹(섹션)으로 구성되어, 사용자가 원하는 기능을 빠르게 찾을 수 있다.

**Why this priority**: 메뉴 항목이 늘어남에 따라 그룹화된 네비게이션은 사용성을 크게 향상시키지만, 기본 네비게이션이 먼저 동작해야 한다.

**Independent Test**: 사이드바에서 그룹 헤더와 하위 메뉴 항목이 올바르게 구분되어 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** admin 사용자가 사이드바를 확인, **When** 네비게이션을 살펴봄, **Then** "관리" 그룹 아래에 Admin Dashboard, User Management가 표시되고, "광고주" 그룹에 Advertiser Dashboard, "대행사" 그룹에 Agency Dashboard가 표시된다
2. **Given** advertiser 사용자가 사이드바를 확인, **When** 네비게이션을 살펴봄, **Then** "광고주" 그룹과 해당 항목만 표시된다
3. **Given** 그룹화된 메뉴가 표시됨, **When** 각 그룹을 확인, **Then** 그룹 헤더(라벨)로 시각적으로 구분된다

---

### Edge Cases

- 역할이 없는 사용자(role이 null)가 접속하면 사이드바에 메뉴가 표시되지 않아야 한다
- 브라우저 창 크기를 데스크톱에서 모바일로 줄이면 사이드바가 자동으로 모바일 모드로 전환된다
- 사이드바 축소 상태에서 브라우저를 새로고침해도 상태가 유지된다
- 네비게이션 항목이 하나도 없는 경우(역할 미배정) 사이드바 영역 자체가 표시되지 않는다

## Requirements

### Functional Requirements

- **FR-001**: 사이드바는 인증된 사용자의 역할에 따라 접근 가능한 메뉴 항목만 표시해야 한다
- **FR-002**: 현재 활성 페이지에 해당하는 메뉴 항목과 소속 그룹 헤더가 모두 시각적으로 구분되어야 한다 (계층적 활성 강조: 항목은 배경색/텍스트 색상 변경, 그룹 헤더는 강조 스타일 적용)
- **FR-003**: 모바일 환경(768px 미만)에서 사이드바는 기본 숨김 상태이며, 토글 버튼으로 슬라이드-인/아웃 되어야 한다
- **FR-004**: 데스크톱 환경에서 사이드바를 축소(아이콘만)/확장(아이콘+라벨) 토글할 수 있어야 한다
- **FR-005**: 사이드바의 축소/확장 상태는 사용자 세션 내에서 유지되어야 한다
- **FR-006**: 모바일에서 메뉴 항목 클릭 시 해당 페이지로 이동하고 사이드바가 자동으로 닫혀야 한다
- **FR-007**: 메뉴 항목은 역할 도메인별 그룹으로 구성되어야 한다 — "관리" (Admin Dashboard, User Management), "광고주" (Advertiser Dashboard), "대행사" (Agency Dashboard). 각 그룹은 그룹 헤더로 시각적으로 구분되어야 한다
- **FR-008**: 사이드바 compact 모드에서 아이콘에 마우스 호버 시 메뉴 라벨이 툴팁으로 표시되어야 한다
- **FR-009**: 각 메뉴 항목은 아이콘과 라벨을 함께 표시해야 한다
- **FR-010**: 역할이 없거나 표시할 메뉴 항목이 없는 경우 사이드바 영역이 표시되지 않아야 한다
- **FR-011**: 사이드바는 화면 좌측 전체 높이를 차지하며, 상단에 앱 로고/브랜딩을 표시해야 한다
- **FR-012**: 헤더는 사이드바 오른쪽 영역에만 배치되어야 한다 (사이드바와 헤더가 수평으로 나란히 위치)

### Key Entities

- **Navigation Item**: 개별 메뉴 항목 (경로, 라벨, 아이콘, 허용 역할 목록)
- **Navigation Group**: 관련 메뉴 항목의 논리적 그룹 (그룹 라벨, 하위 항목 목록)
- **Sidebar State**: 사이드바의 현재 상태 (확장/축소, 열림/닫힘)

## Success Criteria

### Measurable Outcomes

- **SC-001**: 사용자가 원하는 페이지로 2번 이내의 클릭으로 이동할 수 있다
- **SC-002**: 모바일에서 사이드바 열기/닫기 인터랙션이 300ms 이내에 완료된다
- **SC-003**: 모든 역할(admin, advertiser, agency)에서 역할에 맞지 않는 메뉴 항목이 0개 노출된다
- **SC-004**: 데스크톱에서 사이드바 축소 시 메인 콘텐츠 영역이 확장되어 화면 활용도가 향상된다
- **SC-005**: 사이드바 컴포넌트가 3초 이내(3G 네트워크)에 렌더링 완료된다

## Assumptions

- 사이드바는 보호된 영역(protected routes)에서 full-height 레이아웃으로 표시되며, 헤더는 사이드바 오른쪽에 배치된다
- 사이드바 축소/확장 상태는 클라이언트 측 저장소에 보관한다 (서버 동기화 불필요)
- 현재 정의된 3가지 역할(admin, advertiser, agency) 체계를 그대로 사용한다
- 향후 메뉴 항목이 추가될 것을 고려하여 확장 가능한 구조로 설계한다
- 모바일 breakpoint는 768px (md)를 기준으로 한다
