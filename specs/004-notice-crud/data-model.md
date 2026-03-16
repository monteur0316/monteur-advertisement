# Data Model: 공지사항 관리 (Notice CRUD)

**Date**: 2026-03-03 | **Branch**: `004-notice-crud`

## Entities

### Notice (공지사항)

조직 내 공유 정보를 전달하기 위한 게시물.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | integer (PK, autoIncrement) | No | auto | 고유 식별자 |
| orgId | text | No | — | Clerk 조직 ID (조직 범위 격리) |
| title | text | No | — | 공지 제목 |
| content | text | No | — | 공지 본문 내용 |
| isPinned | integer (boolean) | No | false | 중요 공지 여부 (상단 고정) |
| authorId | text | No | — | 작성자 Clerk 사용자 ID |
| authorName | text | No | — | 작성자 표시 이름 (비정규화) |
| createdAt | integer (timestamp) | No | unixepoch() | 생성일시 |
| updatedAt | integer (timestamp) | No | unixepoch() | 수정일시 |

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| idx_notices_org_id | orgId | 조직별 공지사항 조회 최적화 |
| idx_notices_org_pinned_created | orgId, isPinned, createdAt | 목록 정렬 최적화 (고정 우선 + 최신순) |

### Relationships

- Notice → Organization: Many-to-One (orgId로 연결, FK 없음 — Clerk에서 관리)
- Notice → User: Many-to-One (authorId로 연결, FK 없음 — Clerk에서 관리)

### Design Decisions

1. **비정규화된 authorName**: Clerk API 호출 없이 목록에서 작성자 이름 표시. 사용자 이름 변경 시 업데이트 필요 없음 (작성 시점의 이름 유지).
2. **FK 없음**: Organization과 User는 Clerk에서 관리하므로 DB에 FK 제약 불가. 애플리케이션 레벨에서 정합성 보장.
3. **isPinned boolean**: 복잡한 우선순위 시스템 대신 단순 boolean 플래그. 목록 정렬: isPinned DESC → createdAt DESC.

## Validation Rules (Zod Schema)

### CreateNoticeInput

```
title: string, min 1, max 200, trim
content: string, min 1, max 10000, trim
isPinned: boolean, optional, default false
```

### UpdateNoticeInput

```
id: number, positive integer
title: string, min 1, max 200, trim (optional)
content: string, min 1, max 10000, trim (optional)
isPinned: boolean (optional)
```

### DeleteNoticeInput

```
id: number, positive integer
```

## State Transitions

공지사항은 별도의 상태 전환(draft/published) 없이 생성 즉시 공개된다.

```
[없음] → 생성 (Create) → [공개됨]
[공개됨] → 수정 (Update) → [공개됨] (내용 변경)
[공개됨] → 삭제 (Delete) → [없음]
```

## Query Patterns

### 목록 조회 (조직별)

```
SELECT * FROM notices
WHERE org_id = :orgId
ORDER BY is_pinned DESC, created_at DESC
LIMIT :limit OFFSET :offset
```

### 단건 조회

```
SELECT * FROM notices
WHERE id = :id AND org_id = :orgId
```

### 전체 카운트 (페이지네이션)

```
SELECT COUNT(*) FROM notices
WHERE org_id = :orgId
```

### 슈퍼 관리자 전체 조회

```
SELECT * FROM notices
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```
