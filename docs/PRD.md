# 견적서 웹 뷰어 MVP PRD

| 항목 | 내용 |
|------|------|
| 문서 버전 | v0.2 |
| 작성일 | 2026-10-14 |
| 상태 | Draft |
| 작성 근거 | `CLAUDE.md`(루트/전역), 기존 코드 구조, Context7로 확인한 Notion API·react-pdf 문서, `docs/NOTION_API_GUIDE.md` |
| 변경 요약 (v0.2) | Notion 가이드 검증 반영: SDK 재시도 책임 분담(FR-05), 타임아웃 설정(FR-03), 품목 역방향 필터 조회(6·9절), 타입 가드 보완(11절), rate limit 수치 정정 |

## 1. 배경과 문제 정의

### 현재 문제
- 프리랜서/1인 개발자가 견적서를 Notion에 정리한 뒤, 클라이언트에게는 PDF나 캡처로 따로 전달해야 한다.
- 견적 내용이 바뀌면 파일을 다시 만들어 보내야 하고, 클라이언트가 어떤 파일이 최신인지 헷갈린다.
- Notion 페이지를 그대로 공유하면 내부 메모와 다른 견적까지 노출될 위험이 있고, 브랜딩과 인쇄 품질을 통제하기 어렵다.

### 해결 방향
- 관리자는 **Notion에만 입력**한다.
- 클라이언트는 **링크 하나**로 최신 견적서를 웹에서 보고, 같은 화면에서 **PDF를 내려받는다**.
- 공유 범위는 링크가 가리키는 견적서 한 건으로 제한한다.

## 2. 목표 / 비목표

### 목표
| ID | 목표 | 측정 기준 |
|----|------|-----------|
| G1 | Notion 입력 후 별도 작업 없이 웹에 반영 | 수정 후 캐시 만료 시간(기본 5분 이내, 확인 필요) 안에 웹 반영 |
| G2 | 클라이언트가 로그인 없이 열람 | 링크 클릭 후 3초 이내 본문 표시(캐시 적중 시) |
| G3 | PDF 다운로드 성공 | 한글 깨짐 없이 A4 1~2장으로 생성, 다운로드 실패율 0 목표(수동 검증) |
| G4 | 2주 내 출시 가능한 범위 | 마일스톤 M1~M4 완료 |

### 비목표 (이번 MVP에서 하지 않음)
- 관리자 화면(견적 작성/수정 UI). 입력은 Notion만 사용
- 견적 수락·거절·수정 요청, 전자서명, 결제
- 클라이언트 계정/로그인, 접근 통계
- 다국어, 다중 통화, 견적서 템플릿 커스터마이징
- 기존 스타터킷의 Supabase 인증·DB, FastAPI 백엔드 사용 (제외 범위: 7절 참고)

## 3. 사용자 페르소나

| 페르소나 | 설명 | 핵심 니즈 |
|----------|------|-----------|
| 관리자 (프리랜서) | Notion을 일상 도구로 사용. 개발 지식 있음 | Notion에서 입력하면 끝. 링크만 복사해 전달 |
| 클라이언트 | 비개발자. 모바일/PC 모두 사용. 계정 만들기 싫어함 | 링크 클릭 즉시 보기, 금액 확인, 내부 결재용 PDF 확보 |

## 4. 사용자 스토리

| ID | 스토리 | 우선순위 |
|----|--------|----------|
| US-01 | 관리자로서 Notion에 견적을 입력하고 싶다, 그래서 별도 도구 없이 견적서를 만든다 | P0 |
| US-02 | 관리자로서 견적서별 공유 링크를 만들고 싶다, 그래서 해당 클라이언트에게만 보여 줄 수 있다 | P0 |
| US-03 | 클라이언트로서 링크로 견적서를 보고 싶다, 그래서 로그인 없이 금액과 범위를 확인한다 | P0 |
| US-04 | 클라이언트로서 PDF를 받고 싶다, 그래서 내부 결재나 보관에 쓴다 | P0 |
| US-05 | 클라이언트로서 모바일에서도 읽기 쉬웠으면 한다 | P0 |
| US-06 | 관리자로서 링크를 만료/비활성화하고 싶다, 그래서 오래된 견적이 계속 노출되지 않게 한다 | P0 |
| US-07 | 클라이언트로서 만료·잘못된 링크일 때 이유를 알고 싶다 | P1 |
| US-08 | 관리자로서 견적서 인쇄용 브랜딩(로고, 사업자 정보)을 넣고 싶다 | P1 |

## 5. 기능 요구사항

**공통 인수 기준(모든 FR 적용)**: `npm run test`, `npx tsc --noEmit`, `npm run lint` 모두 통과.

### FR-01 견적서 조회 (P0)
- Given 유효한 공유 토큰이 있을 때
- When `/quotes/[token]`에 접속하면
- Then 서버가 Notion에서 해당 견적서를 조회해 헤더·품목표·합계·비고를 표시한다.
- And 토큰으로 조회되는 견적서는 정확히 0 또는 1건이다. 2건 이상이면 에러로 처리하고 로그에 남긴다.

### FR-02 금액 계산 (P0)
- Given 품목(수량, 단가)과 세율이 있을 때
- When 화면/PDF를 렌더링하면
- Then 공급가액 = Σ(수량×단가), 세액 = 공급가액×세율, 합계 = 공급가액+세액을 서비스 계층에서 계산해 표시한다.
- And 원 단위 반올림 규칙을 하나로 고정하고 웹/PDF가 같은 값을 쓴다. (규칙은 오픈 이슈 O-3)

### FR-03 PDF 다운로드 (P0)
- Given 견적서 화면이 표시되어 있을 때
- When "PDF 다운로드"를 누르면
- Then `GET /quotes/[token]/pdf`가 PDF를 `Content-Disposition: attachment`로 응답하고 파일명은 `견적서_{견적번호}_{클라이언트명}.pdf` 형식이다.
- And 한글이 깨지지 않고 A4 규격이다.
- And 응답 시간 목표 5초 이내(확인 필요: 배포 환경 측정 후 확정).
- And Notion SDK 기본 `timeoutMs`(60초)와 429 대기(최대 60초)는 이 목표와 충돌하므로, 타임아웃과 최대 재시도 대기 시간을 5초 목표에 맞춰 명시적으로 낮춘다. 초과 시 오류 화면과 `requestId`로 처리한다.

### FR-04 링크 상태 처리 (P0)
- Given 토큰이 없거나, 상태가 비공개이거나, 유효기간이 지났을 때
- When 접속하면
- Then 각각 404(없음), 404(비공개, 존재 여부를 노출하지 않음), 만료 안내 화면을 표시한다.
- And 만료 안내 화면에는 견적 내용을 포함하지 않는다.

### FR-05 에러 및 장애 처리 (P0)
- Given Notion API가 429/5xx/타임아웃을 반환할 때
- When 조회를 시도하면
- Then 제한된 횟수만 재시도(지수 백오프)하고, 실패하면 사용자에게 안내 화면과 `requestId`를 보여 준다.
- And 재시도 책임을 나눈다. 429/529는 SDK 내장 재시도(`Retry-After` 존중)에 맡기고 중복 재시도하지 않는다. `dataSources.query`는 POST라 SDK가 5xx와 타임아웃을 재시도하지 않으므로, `lib/notion`의 `withRetry`가 이 경우만 재시도한다.
- And 에러는 삼키지 않고 `requestId`와 함께 서버 로그에 남긴다.

### FR-06 반응형 열람 (P0)
- Given 360px 폭 모바일일 때
- When 견적서를 열면
- Then 품목표가 가로 스크롤 없이 읽히거나 카드형으로 전환된다.

### FR-07 검색 엔진 비노출 (P0)
- Given 견적서 페이지에 접속하면
- Then `noindex, nofollow` 메타와 `Referrer-Policy: no-referrer` 헤더가 적용된다.

### FR-08 브랜딩 (P1)
- 로고, 발행자 사업자 정보, 입금 계좌를 Notion 속성 또는 환경변수에서 표시한다.

## 6. Notion 데이터 모델

### 구조 비교: 품목 저장 방식
| 기준 | A. 품목 하위 데이터베이스(Relation) | B. 품목을 견적 행의 텍스트/JSON 속성에 입력 |
|------|------|------|
| 입력 편의 | 행 단위 입력, 수량/단가 숫자 속성 | 한 칸에 형식을 맞춰 입력해야 해 오타 위험 |
| 구현 복잡도 | 쿼리 2회 + 조인 필요 | 파싱 로직 필요 |
| 호출 수 | 견적 1회 + 품목 1회 이상 (rate limit 소비) | 1회 |
| 확장성 | 품목 단위 필터·롤업 가능 | 낮음 |

**추천: A (하위 데이터베이스)**. 입력 오류가 가장 적고 숫자 타입을 보장한다. 호출 수 증가는 캐시로 흡수한다.

### 데이터 소스 1: 견적서 (Quotes)
| 속성명 | Notion 타입 | 필수 | 설명 |
|--------|-------------|------|------|
| 견적번호 | Title | O | 예: `Q-2026-001` |
| 클라이언트명 | Rich text | O | 화면·파일명에 사용 |
| 발행일 | Date | O | |
| 유효기간 | Date | O | 이 날짜 이후 만료 처리 |
| 세율 | Number (percent) | O | 예: 10% |
| 비고 | Rich text | | 결제 조건 등 |
| 상태 | Status/Select | O | `작성중`, `공개`, `비공개` 중 `공개`만 노출 |
| 공유 토큰 | Rich text | O | 추측 불가 랜덤 문자열 (아래 보안 참고) |
| 품목 | Relation → 견적 품목 | O | |

### 데이터 소스 2: 견적 품목 (QuoteItems)
| 속성명 | Notion 타입 | 필수 | 설명 |
|--------|-------------|------|------|
| 품명 | Title | O | |
| 견적 | Relation → 견적서 | O | |
| 수량 | Number | O | |
| 단가 | Number | O | 원 단위 |
| 설명 | Rich text | | |
| 순서 | Number | | 표시 순서 |

### Notion 연동 사실 (Context7 확인)
- 최신 API 버전은 `2026-03-11`, 목록 조회는 **data source 쿼리**(`POST /v1/data-sources/{id}/query`)를 사용한다. 공식 SDK `@notionhq/client`는 `notion.dataSources.query(...)`를 제공한다.
- 속성 필터(`rich_text`, `status`, `select`, `date` 등)와 `filter_properties`로 응답을 줄일 수 있다.
- 요청 한도: 연결당 60초 창 기준 Business/Enterprise 600회(평균 초당 10회), 그 외 플랜 180회(평균 초당 3회). 초과 시 429와 `Retry-After`. 529 `service_overload`도 같은 방식으로 재시도한다.
- 연동 대상 데이터베이스는 Notion Integration에 공유해야 한다. 공유하지 않으면 404. **견적서와 품목 두 데이터베이스 모두** 공유해야 하며, Relation이 참조하는 데이터베이스가 미공유이면 값이 비거나 404가 난다.
- 견적서의 `품목` Relation 값은 25건을 넘으면 잘린다(`has_more`). 품목은 Relation 값이 아니라 **품목 데이터 소스를 `견적` Relation으로 역방향 필터링**해 조회한다. 이를 위해 Relation은 양방향으로 구성한다.
- 상세 근거와 코드 스케치는 `docs/NOTION_API_GUIDE.md` 참고.

## 7. 화면 및 라우트 설계

### 라우트
| 경로 | 종류 | 설명 |
|------|------|------|
| `/quotes/[token]` | Server Component 페이지 | 견적서 열람 |
| `/quotes/[token]/pdf` | Route Handler (GET) | PDF 다운로드 |
| `/` | 기존 | 안내 페이지로 교체 또는 최소화 (오픈 이슈 O-5) |

기존 `(showcase)`, `(auth)` 라우트와 `login`/`register`는 MVP에서 사용하지 않는다. 삭제는 **별도 변경으로 제안**하며 이 PRD 범위에 넣지 않는다.

### 화면 구성
| 영역 | 내용 |
|------|------|
| 헤더 | 견적번호, 발행일, 유효기간, 상태 배지 |
| 클라이언트 정보 | 클라이언트명 |
| 품목표 | 품명, 수량, 단가, 금액 (기존 `components/ui/table.tsx` 재사용) |
| 합계 | 공급가액, 세액, 합계 |
| 비고 | 결제 조건 등 |
| 액션 | PDF 다운로드 버튼 (`Button` 사용) |

### 상태 화면
| 상태 | 처리 |
|------|------|
| 로딩 | 서버 렌더링 + `Skeleton` (스트리밍 시) |
| 품목 없음 | "등록된 품목이 없습니다" 안내, PDF 버튼 비활성 |
| 없음/비공개 | `notFound()` → 동일한 404 화면 |
| 만료 | 만료 안내(견적 내용 미표시) |
| 조회 실패 | 오류 안내 + `requestId` |

## 8. PDF 요구사항

- 규격 A4 세로, 품목이 많으면 다중 페이지, 표 헤더 반복
- 한글 폰트를 **직접 임베딩**한다(시스템 폰트에 의존하지 않음). 라이선스가 자유로운 폰트(예: Noto Sans KR 등, 라이선스 확인 필요)를 사용
- 웹과 PDF의 금액·문구는 같은 **도메인 객체와 계산 함수**에서 생성한다
- 파일명 `견적서_{견적번호}_{클라이언트명}.pdf`, 한글 파일명은 `filename*=UTF-8''` 인코딩

### 구현 방식 비교
| 기준 | A. `@react-pdf/renderer` | B. Puppeteer(headless Chromium) | C. 브라우저 인쇄 CSS(`window.print`) |
|------|------|------|------|
| 방식 | React로 PDF 전용 문서를 선언, 서버에서 `renderToBuffer` | 웹 페이지를 HTML 그대로 PDF 변환 | 사용자가 인쇄 대화상자에서 PDF 저장 |
| 웹/PDF 일관성 | 레이아웃을 따로 작성(코드 중복) | 웹과 동일 | 웹과 동일 |
| 서버리스 적합성 | 순수 Node, 가벼움 | Chromium 바이너리가 커서 서버리스 제약 큼 | 서버 불필요 |
| 한글 폰트 | `Font.register`로 TTF 등록 필요 (Context7 확인) | 폰트 설치/임베딩 필요 | 사용자 브라우저에 의존 |
| 사용자 경험 | 클릭 한 번에 파일 다운로드 | 동일 | 대화상자 거쳐야 하고 결과가 브라우저마다 다름 |
| 신규 의존성 | `@react-pdf/renderer` | `puppeteer` 또는 `@sparticuz/chromium` 등 | 없음 |

**추천: A (`@react-pdf/renderer`)**. 서버리스 배포에서 가장 안정적이고 다운로드 경험이 일정하다. 레이아웃 중복은 계산 로직을 공유하고 PDF 문서 컴포넌트를 한 파일로 격리해 감수한다.

> 이 추천은 **제안**이며 새 라이브러리 도입은 사용자 확인 후에만 진행한다. 배포 대상(Vercel 등)이 정해지지 않았으므로 번들 크기·실행 시간 한도는 **확인 필요**.

## 9. 비기능 요구사항

### 보안
- 공유 토큰은 암호학적 난수로 생성한 **최소 128비트**(예: 32자 hex 이상). 순번·견적번호·이메일 기반 금지
- 토큰 생성은 Notion 수식으로 불가하므로 관리자가 스크립트(1회성 CLI 또는 Notion 자동화)로 발급 — 발급 방식은 오픈 이슈 O-1
- Notion API 키는 **서버 전용 환경변수**. `NEXT_PUBLIC_` 접두사 금지, 클라이언트 번들에 포함 금지
- 클라이언트에는 도메인 타입 중 화면에 필요한 필드만 전달한다 (Notion 페이지 ID, 내부 메모 등 미노출)
- 링크 폐기: 상태를 `비공개`로 바꾸거나 유효기간을 과거로 설정. 토큰 재발급으로 기존 링크 무효화
- 토큰 대상 무차별 대입 방지: 잘못된 토큰 요청 제한(rate limit)은 P1, MVP는 토큰 길이로 대응

### 성능 / 캐싱
- 조회 결과를 서버에서 캐시하고 `revalidate` 주기(기본 300초, 확인 필요)로 갱신한다. 구체 API(`cacheComponents`, 캐시 태그 등)는 이 프로젝트가 Next.js 16에서 `cacheComponents`를 활성화했으므로 **구현 전에 Next.js 공식 문서로 확인**한다.
- Notion 호출은 견적 1회 + 품목 1회로 제한(`filter_properties` 활용). 품목이 100건을 초과하면 `has_more` 순회로 호출이 늘어난다(100건 기준은 확인 필요). 캐시 없이는 접속당 2회 소비하므로 평균 3회/초 한도(비-Business 플랜)에서 캐시가 필수
- 429/529 수신 시 `Retry-After`를 존중(SDK 내장 재시도). SDK 기본 타임아웃 60초는 PDF 5초 목표와 맞지 않으므로 `timeoutMs`와 최대 대기 시간을 낮춰 설정
- 토큰 형식(길이·문자 집합)이 틀리면 Notion을 호출하지 않고 바로 404로 응답해 호출을 아낀다

### 접근성 / 반응형
- 표에 `caption`과 `th scope` 사용, 색상 대비 WCAG AA, 키보드로 PDF 버튼 조작
- 모바일 360px부터 지원, 다크모드는 기존 `next-themes` 설정을 따름(PDF는 항상 라이트)

### 추적성 / 에러
- 모든 요청은 `requestId`를 가진다. 서버 진입점에서 생성(또는 수신한 `X-Request-ID` 사용)하고 로그와 에러 응답에 포함한다. 기존 `lib/api/client.ts`의 `generateRequestId`를 서버에서도 쓸 수 있도록 공용 위치로 분리하는 것을 검토
- 에러는 삼키지 않는다. 기존 `ApiError`(`message`, `code`, `requestId`, `statusCode`) 형태를 따른다

## 10. 시스템 아키텍처

### 재사용 / 제외 정리
| 대상 | 판단 |
|------|------|
| `types/common.ts`의 `ApiError`, `ApiResponse` | 재사용 |
| `components/ui/*` (`table`, `card`, `badge`, `button`, `skeleton`) | 재사용 |
| `lib/utils.ts`의 `cn` | 재사용 |
| `services/*`, `repositories/*`의 함수 모듈 패턴, `__tests__/` 구조 | 동일 패턴 유지 |
| `lib/api/client.ts` (FastAPI 호출용, 브라우저 `fetch`) | 미사용. Notion은 서버에서 SDK로 호출 |
| Supabase (`lib/supabase`, `types/database.ts`, auth 관련) | 제외 |
| FastAPI `backend/` | 제외 |
| TanStack Query, Zustand | 열람은 서버 렌더링이라 불필요. 클라이언트 상호작용이 생기면 그때 사용 |

> 전역 원칙의 "Controller → Service → Repository"에서 Controller 역할은 **Page(Server Component)와 Route Handler**가 맡는다. 데이터 흐름이 서버 렌더링이라 `hooks/`는 이 MVP에서 만들지 않는다(기존 CLAUDE.md의 "컴포넌트는 hooks로만 접근" 규칙의 의도적 예외, 확인 필요).

### 데이터 흐름
```
클라이언트 브라우저
   │  GET /quotes/[token]
   ▼
app/quotes/[token]/page.tsx (Server Component)  ── requestId 생성
   │
   ▼
services/quoteService.ts      ← 상태/만료 판단, 금액 계산, 에러 매핑
   │
   ▼
repositories/quoteRepository.ts  ← Notion 쿼리, Notion* → 도메인 변환
   │
   ▼
lib/notion/client.ts          ← @notionhq/client 인스턴스, 재시도
   │
   ▼
Notion API (data sources query)

PDF: GET /quotes/[token]/pdf (Route Handler)
   → quoteService.getQuoteByToken() → components/pdf/QuotePdf.tsx → renderToBuffer → 응답
```

### 디렉토리 배치안
```
app/quotes/[token]/page.tsx
app/quotes/[token]/pdf/route.ts
app/quotes/[token]/not-found.tsx
components/quote/            # QuoteHeader, QuoteItemsTable, QuoteTotals, ExpiredNotice
components/pdf/QuotePdf.tsx  # PDF 전용 문서
services/quoteService.ts
repositories/quoteRepository.ts
lib/notion/client.ts         # SDK 초기화, 재시도
lib/notion/mappers.ts        # Notion 속성 → 값 추출 헬퍼
types/notion.ts              # Notion* raw 타입
types/quote.ts               # 도메인 타입
__tests__/services/quoteService.test.ts
__tests__/repositories/quoteRepository.test.ts
```

### 계층별 책임
| 계층 | 책임 | 하지 않는 것 |
|------|------|--------------|
| Page / Route Handler | 요청 수신, `requestId` 생성, 응답/상태 화면 결정 | 비즈니스 로직 |
| Service | 상태·만료 판정, 금액 계산, 에러 코드 매핑 | Notion SDK 호출 |
| Repository | Notion 쿼리, raw → 도메인 변환 | 계산, 상태 판정 |
| lib/notion | SDK 초기화, 재시도/백오프 | 도메인 지식 |

### 환경변수
| 이름 | 용도 | 노출 |
|------|------|------|
| `NOTION_API_KEY` | Integration 시크릿 | 서버 전용 |
| `NOTION_QUOTES_DATA_SOURCE_ID` | 견적서 데이터 소스 ID | 서버 전용 |
| `NOTION_ITEMS_DATA_SOURCE_ID` | 품목 데이터 소스 ID | 서버 전용 |
| `QUOTE_REVALIDATE_SECONDS` | 캐시 갱신 주기 | 서버 전용 |

## 11. 타입 설계

- Notion raw 타입은 `types/notion.ts`에 `NotionQuotePage`, `NotionItemPage`로 정의하고 **repository 안에서만** 사용한다. 기존 `Db*` → 도메인 변환 패턴(`toProfile` 등)과 같은 방식이다.
- SDK 응답은 `isFullPageOrDataSource` 같은 타입 가드로 좁혀 `any` 없이 사용한다. 이 가드는 Page 또는 DataSource로만 좁히므로, 속성에 접근하기 전에 `object === "page"` 확인을 추가한다.
- 속성 누락/타입 불일치는 변환 단계에서 **명시적 에러**(`code: "NOTION_SCHEMA_MISMATCH"`)로 던진다.

```ts
// types/quote.ts (도메인, camelCase)
export type QuoteStatus = "draft" | "published" | "private"

export type QuoteItem = {
  name: string
  description: string | null
  quantity: number
  unitPrice: number
  amount: number // quantity * unitPrice, service에서 계산
}

export type Quote = {
  quoteNumber: string
  clientName: string
  issuedAt: string       // ISO date
  validUntil: string     // ISO date
  taxRate: number        // 0.1
  note: string | null
  status: QuoteStatus
  items: QuoteItem[]
}

export type QuoteTotals = {
  subtotal: number
  tax: number
  total: number
}
```

## 12. 테스트 전략 (TDD)

순서: 실패하는 테스트 작성 → 구현 → 리팩터링. 기존 `__tests__/services`, `__tests__/repositories` 패턴을 따르고 repository는 Notion SDK를 mock한다.

| 계층 | 핵심 테스트 케이스 |
|------|--------------------|
| Service | 금액 합계/세액/반올림, 세율 0%, 품목 0건, 만료 경계(유효기간 당일), 비공개 상태, 토큰 없음 → not found, 중복 토큰 → 에러 |
| Repository | 토큰 필터가 쿼리에 전달됨, 페이지네이션(`has_more`) 처리, 속성 누락 시 `NOTION_SCHEMA_MISMATCH`, 품목 정렬(`순서`) |
| lib/notion | 429에서 `Retry-After` 대기 후 재시도, 최대 재시도 후 에러 전파 |
| PDF Route | 응답 헤더(content-type, 파일명 인코딩), 존재하지 않는 토큰 404, 만료 시 PDF 미생성 |
| 컴포넌트 | 품목표 렌더링, 만료 안내에 견적 내용이 없음 |
| 수동 | 한글 PDF 육안 확인, 모바일 360px, 다크모드 |

## 13. 마일스톤 (1인, 약 2주)

| 단계 | 기간 | 작업 | 확인 방법 |
|------|------|------|-----------|
| M0 | 0.5일 | 오픈 이슈 O-1~O-4 결정, Notion Integration/DB 생성, 샘플 데이터 입력 | 샘플 견적 1건 존재 |
| M1 | 3일 | 타입, repository, service(금액 계산·상태 판정) TDD | 서비스/리포지토리 테스트 통과 |
| M2 | 3일 | `/quotes/[token]` 페이지, 상태 화면, 반응형 | 브라우저에서 샘플 견적 확인 |
| M3 | 3일 | PDF 생성 및 다운로드, 한글 폰트 | 실제 PDF 육안 확인 |
| M4 | 2일 | 캐시·재시도·`noindex`·보안 점검, 배포 | 완료 조건 3종 통과, 배포 환경 PDF 확인 |

## 14. 리스크와 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Notion rate limit(비-Business 플랜 평균 3회/초) | 접속 집중 시 429 | 서버 캐시, 재시도, 품목 조회 최소화 |
| Notion API 장애/지연(503 등) | 견적 열람 불가 | 백오프 재시도, 오류 화면 + `requestId`. 마지막 성공 캐시 제공은 P1 |
| 한글 PDF 폰트 | 글자 깨짐, 용량 증가 | 폰트 TTF 직접 등록, 서브셋 고려, 라이선스 확인 |
| 링크 유출 | 제3자 열람 | 긴 랜덤 토큰, 만료·비공개 전환, `noindex`, 필요 시 비밀번호(P1) |
| 서버리스 실행 시간/번들 한도 | PDF 생성 실패 | `@react-pdf/renderer` 선택, 배포 대상 확정 후 측정 |
| Notion 스키마 변경(속성명 수정) | 조회 실패 | 변환 단계 명시적 에러, 속성명을 상수 한 곳에 정의 |
| 웹/PDF 레이아웃 불일치 | 신뢰도 저하 | 계산·문구는 도메인 객체 공유, 디자인 검수 |

## 15. 오픈 이슈

| ID | 질문 | 선택지 | 추천 |
|----|------|--------|------|
| O-1 | 공유 토큰은 누가 어떻게 발급하나 | (a) 관리자가 로컬 스크립트로 생성 후 Notion에 붙여넣기 (b) Notion 버튼/자동화 (c) 앱이 발급 API 제공 | (a) 가장 단순. (c)는 관리자 UI가 생겨 비목표와 충돌 |
| O-2 | 배포 대상 | Vercel / 자체 서버 / 기타 | 미정. PDF 시간·번들 한도와 연결되므로 M0에서 결정 |
| O-3 | 금액 반올림 규칙과 부가세 처리 | 세액 단위 절사 / 반올림, 면세·영세율 여부 | 세액을 원 단위 반올림, 면세는 세율 0% |
| O-4 | PDF 한글 폰트 선택 | Noto Sans KR / Pretendard 등 | 라이선스 확인 후 결정 |
| O-5 | 기존 스타터킷 페이지(`showcase`, `auth`, 루트)를 정리할지 | 유지 / 삭제 / 숨김 | 별도 정리 작업으로 분리 |
| O-6 | 캐시 갱신 주기 | 60초 / 300초 / 수동 재검증 | 300초 |
| O-7 | `hooks/` 계층 생략을 허용할지 (9~10절) | 허용 / 클라이언트 훅 강제 | 서버 렌더링 구간은 생략 허용 |

## 사용자 확인이 필요한 항목

- [ ] `@react-pdf/renderer`, `@notionhq/client` 신규 의존성 도입 승인 (둘 다 제안 상태)
- [ ] O-1 공유 토큰 발급 방식
- [ ] O-2 배포 대상
- [ ] O-3 금액 반올림/부가세 규칙
- [ ] O-4 PDF 한글 폰트와 라이선스
- [ ] O-5 기존 스타터킷 페이지 정리 범위
- [ ] O-7 `hooks/` 계층 예외 허용 여부
- [ ] 캐시 갱신 주기 및 목표 수치(G1~G3)의 현실성 확인
