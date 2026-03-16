# Server Action Contracts: 공지사항 관리

**Date**: 2026-03-03 | **File**: `src/actions/notices.ts`

## Response Type

모든 액션은 기존 `ApiResponse<T>` 패턴을 따른다:

```typescript
type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}
```

## Actions

### getNotices

**Purpose**: 조직의 공지사항 목록 조회
**Auth**: org 구성원 (org:admin 또는 org:member)

**Input**:
```
orgId: string (required)
page: number (optional, default 1)
limit: number (optional, default 20)
```

**Output**: `ApiResponse<{ notices: Notice[], total: number }>`

**Authorization**:
- getAuthContext()로 orgId 일치 확인
- 또는 superAdmin이면 모든 조직 접근 가능

---

### getNotice

**Purpose**: 공지사항 단건 조회
**Auth**: org 구성원

**Input**:
```
id: number (required)
orgId: string (required)
```

**Output**: `ApiResponse<{ notice: Notice }>`

**Authorization**: orgId 일치 또는 superAdmin

---

### createNotice

**Purpose**: 새 공지사항 생성
**Auth**: org:admin 만

**Input** (Zod validated):
```
title: string (1-200자, 필수)
content: string (1-10000자, 필수)
isPinned: boolean (선택, default false)
```

**Output**: `ApiResponse<{ notice: Notice }>`

**Authorization**: requireOrgAdmin() 또는 superAdmin
**Side effects**: authorId, authorName을 현재 사용자 정보에서 자동 설정

---

### updateNotice

**Purpose**: 기존 공지사항 수정
**Auth**: org:admin 만

**Input** (Zod validated):
```
id: number (필수)
title: string (1-200자, 선택)
content: string (1-10000자, 선택)
isPinned: boolean (선택)
```

**Output**: `ApiResponse<{ notice: Notice }>`

**Authorization**: requireOrgAdmin() 또는 superAdmin
**Validation**: 해당 공지가 현재 조직에 속하는지 확인

---

### deleteNotice

**Purpose**: 공지사항 삭제
**Auth**: org:admin 만

**Input**:
```
id: number (필수)
```

**Output**: `ApiResponse<{ success: boolean }>`

**Authorization**: requireOrgAdmin() 또는 superAdmin
**Validation**: 해당 공지가 현재 조직에 속하는지 확인

---

### getAllNotices (슈퍼 관리자 전용)

**Purpose**: 전체 조직의 공지사항 목록 조회
**Auth**: superAdmin 만

**Input**:
```
page: number (optional, default 1)
limit: number (optional, default 20)
```

**Output**: `ApiResponse<{ notices: Notice[], total: number }>`

**Authorization**: requireSuperAdmin()

## Error Codes

| Code | Message | Condition |
|------|---------|-----------|
| UNAUTHORIZED | 인증이 필요합니다 | 미인증 사용자 |
| FORBIDDEN | 권한이 없습니다 | org:member가 생성/수정/삭제 시도 |
| NOT_FOUND | 공지사항을 찾을 수 없습니다 | 존재하지 않는 ID 또는 다른 조직의 공지 |
| VALIDATION_ERROR | 입력값이 올바르지 않습니다 | Zod 검증 실패 |
| INTERNAL_ERROR | 서버 오류가 발생했습니다 | DB 오류 등 |
