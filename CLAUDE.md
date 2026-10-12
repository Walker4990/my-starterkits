# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev        # 개발 서버 (Turbopack)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 검사
npx tsc --noEmit   # 타입 검사
npm run test       # vitest run (단위 테스트)
npm run test:watch # vitest (watch 모드)
npx vitest run __tests__/services/userService.test.ts  # 단일 테스트 파일 실행
```

백엔드:
```bash
cd backend && uvicorn main:app --reload --port 8000
```

## 완료 조건

`npm run test` + `npx tsc --noEmit` + `npm run lint` 모두 통과.

## 아키텍처

Next.js 16 App Router 기반 스타터킷. 프론트엔드(Next.js) + 백엔드(FastAPI) 분리 구조.

### 프론트엔드 데이터 흐름

```
Page/Component → hooks (useUsers, useItems, useAuth)
                    ↓ TanStack Query
              services (userService, itemService)
                    ↓
           repositories (userRepository, itemRepository)
                    ↓
        lib/supabase/client  또는  lib/api/client (→ FastAPI)
```

- `hooks/` — TanStack Query 래핑. 컴포넌트는 hooks를 통해서만 데이터 접근
- `services/` — 비즈니스 로직. repository를 호출하고 데이터를 가공
- `repositories/` — Supabase 쿼리 직접 실행. `Db*` raw 타입(snake_case)을 camelCase 도메인 타입으로 변환
- `store/` — Zustand. `authStore`(persist), `uiStore` — 서버 상태는 TanStack Query, 클라이언트 UI 상태만 Zustand
- `lib/api/client.ts` — FastAPI 호출용 fetch 래퍼. 모든 요청에 `X-Request-ID` 헤더 자동 추가

### 타입 시스템

- `types/database.ts` — `DbProfile`, `DbItem` (Supabase snake_case raw) + `toProfile()`, `toItem()` 변환 함수
- `types/common.ts` — `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`, `PaginationParams`
- Repository 계층에서만 `Db*` 타입을 사용하고, 상위 계층에는 camelCase 도메인 타입만 노출

### 디렉토리 구조

- `app/` — App Router 라우트
  - `(showcase)/` — 컴포넌트/폼/데이터/API 쇼케이스
  - `(auth)/` — 로그인/회원가입
- `components/ui/` — shadcn 기반 UI 컴포넌트
- `components/layout/` — Header, Sidebar
- `components/forms/`, `components/data/`, `components/showcase/`
- `backend/` — FastAPI: `routers/` → `services/` → `repositories/` → `database/supabase.py`
- `__tests__/` — vitest 단위 테스트 (services 계층 위주, repository는 mock)

## 주요 기술 설정

- **Next.js 16**: `next.config.ts`에서 `agentFeedback` (experimental), `cacheComponents`, `partialPrefetching` 활성화
- **Tailwind v4**: `@tailwindcss/turbopack` 로더 사용, `@import "tailwindcss"` 방식 (설정 파일 없음)
- **shadcn/ui**: `@import "shadcn/tailwind.css"` + `globals.css`의 CSS 변수로 테마 정의
- **다크모드**: `@custom-variant dark (&:is(.dark *))` 방식 (class 기반)
- **경로 별칭**: `@/*` → 프로젝트 루트 (vitest.config.ts에도 동일하게 설정)

## 컴포넌트 패턴

- `Button`: `@base-ui/react/button` 기반 → `asChild` 없음, Link 연결 시 `render={<Link href="..." />}` 사용
- `cn`: `import { cn } from "cn"` (별도 패키지, `clsx`/`tailwind-merge` 아님)
- `lib/utils.ts`에도 `cn` re-export 있음 → `import { cn } from "@/lib/utils"` 도 가능

## 환경변수

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 연결
- `NEXT_PUBLIC_API_BASE_URL` — FastAPI 주소 (기본값: `http://localhost:8000`)
