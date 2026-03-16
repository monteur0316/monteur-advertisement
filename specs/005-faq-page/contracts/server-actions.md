# Server Actions Contract: 005-faq-page

**Date**: 2026-03-03

## Response Format

모든 Server Action은 기존 프로젝트 패턴을 따른다:

```typescript
type ApiResponse<T> = {
  data: T | null
  error: string | null
  message: string | null
}
```

## Actions

### getFaqs()

- **Purpose**: FAQ 전체 목록 조회
- **Auth**: 인증된 모든 사용자
- **Input**: 없음
- **Output**: `ApiResponse<Faq[]>`
- **Sort**: sortOrder ASC

### getFaq(input)

- **Purpose**: FAQ 단건 조회
- **Auth**: 인증된 모든 사용자
- **Input**: `{ id: number }`
- **Output**: `ApiResponse<Faq>`
- **Error**: 존재하지 않는 id → `{ error: "FAQ를 찾을 수 없습니다" }`

### createFaq(input)

- **Purpose**: FAQ 신규 생성
- **Auth**: 슈퍼 어드민만 (`requireSuperAdmin()`)
- **Input**: `{ question: string, answer: string }`
- **Validation**: question 1-200자, answer 1-2000자 (Zod)
- **Behavior**: sortOrder는 현재 최대값 + 1로 자동 설정
- **Output**: `ApiResponse<Faq>`
- **Error**: 권한 없음, 유효성 검증 실패

### updateFaq(input)

- **Purpose**: FAQ 수정
- **Auth**: 슈퍼 어드민만
- **Input**: `{ id: number, question?: string, answer?: string }`
- **Validation**: question 1-200자, answer 1-2000자 (optional fields, Zod)
- **Output**: `ApiResponse<Faq>`
- **Error**: 권한 없음, 존재하지 않는 id, 유효성 검증 실패

### deleteFaq(input)

- **Purpose**: FAQ 삭제
- **Auth**: 슈퍼 어드민만
- **Input**: `{ id: number }`
- **Output**: `ApiResponse<{ id: number }>`
- **Error**: 권한 없음, 존재하지 않는 id

### reorderFaqs(input)

- **Purpose**: FAQ 순서 변경 (드래그앤드롭 후 bulk update)
- **Auth**: 슈퍼 어드민만
- **Input**: `{ items: Array<{ id: number, sortOrder: number }> }`
- **Behavior**: 전달된 모든 항목의 sortOrder를 일괄 업데이트
- **Output**: `ApiResponse<{ success: boolean }>`
- **Error**: 권한 없음, 유효성 검증 실패
