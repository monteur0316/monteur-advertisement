# Data Model: 005-faq-page

**Date**: 2026-03-03

## Entity: FAQ 항목 (faqs)

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, auto increment | 고유 식별자 |
| question | text | NOT NULL, max 200자 | 질문 제목 |
| answer | text | NOT NULL, max 2000자 | 답변 본문 |
| sortOrder | integer | NOT NULL, default 0 | 표시 순서 (낮은 숫자 먼저) |
| authorId | text | NOT NULL | 작성자 Clerk userId |
| authorName | text | NOT NULL | 작성자 이름 (Clerk에서 조회) |
| createdAt | integer (timestamp) | NOT NULL, default unixepoch() | 생성 일시 |
| updatedAt | integer (timestamp) | NOT NULL, default unixepoch(), $onUpdate | 수정 일시 |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| idx_faqs_sort_order | sortOrder | FAQ 목록 정렬 조회 최적화 |

### Relationships

- 없음 (시스템 전역 데이터, 조직 범위 아님)
- authorId는 Clerk userId 참조 (application-level, FK 없음 - 004-notice-crud 선례)

### Validation Rules (Zod)

- **question**: 1-200자, 필수
- **answer**: 1-2000자, 필수
- **sortOrder**: 양의 정수

### Query Patterns

| Operation | 조건 | 정렬 | 접근 권한 |
|-----------|------|------|----------|
| 전체 조회 | 없음 | sortOrder ASC | 인증된 모든 사용자 |
| 단건 조회 | id | - | 인증된 모든 사용자 |
| 생성 | - | - | 슈퍼 어드민 |
| 수정 | id | - | 슈퍼 어드민 |
| 삭제 | id | - | 슈퍼 어드민 |
| 순서 변경 | 복수 id+sortOrder | - | 슈퍼 어드민 |

### State Transitions

- 없음 (모든 FAQ 항목은 공개 상태, 비공개/초안 기능 없음)

### 주요 차이점 (vs notices)

| 항목 | notices | faqs |
|------|---------|------|
| 데이터 범위 | 조직별 (orgId) | 시스템 전역 |
| 정렬 | isPinned + createdAt | sortOrder |
| 순서 변경 | 없음 | 드래그앤드롭 bulk update |
| 표시 방식 | DataTable | Accordion |
