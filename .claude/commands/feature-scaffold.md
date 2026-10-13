---
description: "도메인명을 받아 프론트/백엔드 레이어 구조(types → repository → service → hook, router → service → repository)와 테스트를 TDD 순서로 생성합니다"
argument-hint: "<도메인명 (단수형 영문, 예: order)>"
allowed-tools:
  [
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "Bash(npx vitest run:*)",
    "Bash(npm run test:*)",
    "Bash(npm run lint:*)",
    "Bash(npx tsc --noEmit:*)",
    "Bash(git status:*)",
    "Bash(git diff:*)",
  ]
---

# Claude 명령어: Feature Scaffold

도메인 하나에 필요한 레이어 파일 세트를 프로젝트 기존 패턴(`item` 도메인 기준)에 맞춰 생성합니다.

## 사용법

```
/feature-scaffold $ARGUMENTS
```

- `$ARGUMENTS`: 도메인명 (단수형 영문 소문자, 예: `order`)
- 인자가 없으면 도메인명과 필드 목록을 먼저 질문한다

## 사전 확인 (생성 전에 반드시 수행)

1. 도메인명 변환 규칙을 정한다
   - 예: `order` → 타입 `Order`, 테이블 `orders`, 파일 `orderService.ts` / `order_service.py`
2. 이미 존재하는 파일이 있는지 `Glob`으로 확인한다. **기존 파일은 덮어쓰지 않고**, 겹치면 중단 후 사용자에게 알린다
3. 필드 목록(이름, 타입, nullable 여부, 상태값 enum)을 사용자에게 확인한다. 정해지지 않았으면 `id`, `title`, `createdAt`, `updatedAt`만으로 시작하자고 제안한다
4. 생성할 파일 목록을 보여주고 확인받은 뒤 진행한다

## 기준 파일 (반드시 먼저 읽고 스타일을 맞춘다)

| 계층 | 참고 파일 |
| --- | --- |
| 프론트 타입 | `types/database.ts`, `types/api.ts`, `types/common.ts` |
| 프론트 repository | `repositories/itemRepository.ts` |
| 프론트 service | `services/itemService.ts` |
| 프론트 hook | `hooks/useItems.ts` |
| 프론트 테스트 | `__tests__/services/userService.test.ts` |
| 백엔드 모델 | `backend/models/item.py` |
| 백엔드 repository | `backend/repositories/item_repository.py` |
| 백엔드 service | `backend/services/item_service.py` |
| 백엔드 router | `backend/routers/items.py`, `backend/main.py` |

## 프로세스 (TDD 순서)

### 1. 테스트 먼저 (Red)

- `__tests__/services/{domain}Service.test.ts` 작성
  - `vi.mock("@/repositories/{domain}Repository")`로 repository를 mock
  - 조회(목록/단건/없을 때 `null`), 생성, 수정, 삭제 케이스
  - 테스트 설명은 한국어
- `npx vitest run __tests__/services/{domain}Service.test.ts`로 **실패를 확인**한다 (구현이 없어서 실패해야 정상)

### 2. 프론트엔드 구현 (Green)

1. `types/database.ts`: `{Domain}`(camelCase), `Db{Domain}`(snake_case), `to{Domain}()` 변환 함수 추가
2. `types/api.ts`: `Create{Domain}Request`, `Update{Domain}Request`, `{Domain}FilterParams` 추가
3. `repositories/{domain}Repository.ts`: `findMany{Domain}s`, `find{Domain}ById`, `create{Domain}`, `update{Domain}`, `delete{Domain}`
   - Supabase 쿼리 직접 실행, `Db*` 타입은 이 계층에서만 사용
   - 에러는 삼키지 않고 `throw error` (단건 조회의 not found만 `null`)
4. `services/{domain}Service.ts`: `get{Domain}s`, `get{Domain}`, `add{Domain}`, `edit{Domain}`, `remove{Domain}`
5. `hooks/use{Domain}s.ts`: `use{Domain}s`, `use{Domain}`, `useCreate{Domain}`, `useUpdate{Domain}`, `useDelete{Domain}` (TanStack Query, 변경 시 `queryKey` invalidate)

### 3. 백엔드 구현

1. `backend/models/{domain}.py`: `{Domain}Base`, `{Domain}Create`, `{Domain}Update`, `{Domain}` (Pydantic)
2. `backend/repositories/{domain}_repository.py`: `{Domain}Repository(db: Client)`
3. `backend/services/{domain}_service.py`: `{Domain}Service(repository)`
   - 없을 때 `HTTPException(404, detail={"message": "...", "code": "{DOMAIN}_NOT_FOUND"})`
4. `backend/routers/{domain}s.py`: `APIRouter(prefix="/api/v1/{domain}s")`
   - 의존성 주입은 `get_service` 패턴
   - 모든 응답에 `request_id=request.state.request_id` 포함
5. `backend/main.py`: `from backend.routers import ...`에 추가하고 `app.include_router()` 등록
6. 백엔드 테스트 디렉터리와 pytest가 이미 있으면 service 단위 테스트도 추가한다. 없으면 만들지 말고 완료 보고에 "백엔드 테스트 미작성"이라고 명시한다

### 4. 검증

아래를 순서대로 실행하고 결과를 그대로 보고한다.

```bash
npm run test
npx tsc --noEmit
npm run lint
```

- 하나라도 실패하면 원인을 수정한 뒤 다시 실행한다. 통과하지 못한 채로 완료라고 하지 않는다

## 규칙

- 변수명·함수명은 영어, 주석·테스트 설명은 한국어
- `any` 금지, 과도한 추상화 금지 (기준 파일에 없는 공통 base 클래스나 제네릭 헬퍼를 만들지 않는다)
- 새 라이브러리를 추가하지 않는다
- 컴포넌트는 hooks를 통해서만 데이터에 접근한다 (이 커맨드는 UI 컴포넌트와 페이지는 만들지 않는다)
- DB 테이블과 RLS 정책은 만들지 않는다. 필요한 컬럼 구조를 SQL 예시로 마지막에 안내만 한다
- 커밋하지 않는다 (커밋은 `/git:commit`으로 별도 진행)

## 완료 보고 형식

1. 생성/수정한 파일 목록
2. `npm run test`, `npx tsc --noEmit`, `npm run lint` 결과
3. 사용자가 직접 해야 할 일 (Supabase 테이블 생성 SQL, 백엔드 테스트 여부 등)
