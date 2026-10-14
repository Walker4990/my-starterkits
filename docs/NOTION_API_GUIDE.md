# Notion API 데이터베이스 사용 가이드

| 항목 | 내용 |
|------|------|
| 대상 프로젝트 | invoice-web (견적서 웹 뷰어, Next.js 16 App Router) |
| 기준 | Notion API 버전 `2026-03-11`, `@notionhq/client` (data source 지원 버전) |
| 작성일 | 2026-10-14 |
| 근거 | Context7 (`/websites/developers_notion_reference`, `/websites/developers_notion_guides`, `/makenotion/notion-sdk-js`), `docs/PRD.md` 6, 9~12절 |
| 성격 | 읽기 전용 분석 문서. 코드는 스케치이며 실제 적용은 별도 승인 후 진행 |

표기 규칙: **확인 필요**는 이번 조사에서 공식 문서로 직접 확인하지 못한 항목이다.

---

## 1. 핵심 개념

### 1.1 개념 요약

| 개념 | 설명 | ID를 얻는 곳 |
|------|------|--------------|
| database | data source를 담는 컨테이너. Notion 앱의 "데이터베이스" 블록 | 데이터베이스 페이지 URL, 또는 `databases.retrieve` 응답의 `id` |
| data source | 실제 스키마(속성)와 행(page)을 가진 단위. 하나의 database가 여러 data source를 가질 수 있다 (2025-09 이후, multi-source database) | `GET /v1/databases/{database_id}` 응답의 `data_sources` 배열 (`id`, `name`) |
| page | data source의 행 하나. 속성 값 집합 | `dataSources.query` 결과의 `id` |
| property | data source 스키마가 정의하는 열. page는 스키마를 따르는 값을 가진다 | `dataSources.retrieve`의 `properties` (이름과 ID) |

**2025-09-03 변경점 (database와 data source 분리)**

- 이전의 `/v1/databases/{id}/query`는 `/v1/data_sources/{id}/query`로 대체되었다. `Notion-Version: 2025-09-03` 이상에서는 database ID가 아니라 **data source ID**로 쿼리한다.
- 기존 database ID는 그대로 유지되고, data source ID라는 새 ID가 추가되었다.
- 스키마 조회와 수정은 `/v1/databases`가 아니라 `/v1/data_sources`로 한다.
- 페이지 생성 시 부모는 `{ data_source_id }`를 쓴다.
- 이후 `2026-03-11`에서도 아래 변경이 있다. 이 프로젝트의 읽기 중심 흐름에는 영향이 거의 없다.
  - `archived`는 `in_trash`로 바뀌었다.
  - Append Block Children의 `after`는 `position` 객체로 바뀌었다.
  - `transcription` 블록은 `meeting_notes`로 이름이 바뀌었다.

**ID 획득 절차 (1회성)**

1. notion.so/profile/integrations 에서 Integration(connection)을 만들고 시크릿을 발급한다. 이것이 `NOTION_API_KEY`다.
2. 견적서 database와 품목 database 각각의 `•••` 메뉴에서 `Add connections`로 Integration을 연결(공유)한다.
3. URL에서 database ID를 얻고, `notion.databases.retrieve({ database_id })`의 `data_sources[0].id`를 환경변수에 저장한다. data source ID를 Notion UI에서 직접 복사하는 메뉴 위치는 **확인 필요**.

**Notion-Version 헤더와 SDK 설정**

- SDK는 `Client` 생성자의 `notionVersion` 옵션으로 `Notion-Version` 헤더를 지정한다. 직접 REST를 호출할 때는 헤더를 반드시 넣어야 한다.
- SDK 기본 `notionVersion` 값은 SDK 버전마다 다를 수 있다. 이번에 확인하지 못했으므로 **명시적으로 고정**한다.
- SDK 클라이언트 옵션은 `auth`, `notionVersion`, `timeoutMs`(기본 60,000ms), `retry`, `baseUrl`, `logLevel`, `fetch`다.

### 1.2 코드 예시

```ts
// lib/notion/client.ts (발췌)
import { Client } from "@notionhq/client"

export const NOTION_VERSION = "2026-03-11"

export function createNotionClient(apiKey: string): Client {
  return new Client({
    auth: apiKey,
    notionVersion: NOTION_VERSION,
    timeoutMs: 8_000, // 기본 60초는 FR-03(5초 목표)와 맞지 않아 단축
    retry: { maxRetries: 3, initialRetryDelayMs: 1_000, maxRetryDelayMs: 30_000 },
  })
}
```

```ts
// 1회성 스크립트: database ID -> data source ID 확인
const db = await notion.databases.retrieve({ database_id: process.env.QUOTES_DATABASE_ID! })
// db.data_sources: Array<{ id: string; name: string }>  (타입 가드 필요 여부는 SDK 버전별 확인 필요)
```

### 1.3 이 프로젝트 적용안

- `NOTION_QUOTES_DATA_SOURCE_ID`, `NOTION_ITEMS_DATA_SOURCE_ID`에는 **data source ID**를 넣는다. PRD 10절 환경변수 이름과 일치한다.
- `NOTION_API_KEY`는 서버 전용이다. `NEXT_PUBLIC_` 접두사를 쓰지 않는다. SDK는 브라우저에서 토큰 사용을 막기도 한다 (`dangerouslyAllowBrowser` 옵션이 별도로 있다).

### 1.4 주의사항 / 확인 필요

- database ID를 `dataSources.query`에 넣으면 실패한다.
- 한 database에 data source가 2개 이상이면 `data_sources[0]`이 원하는 것인지 `name`으로 확인한다.
- 문서에 경로가 `/v1/data-sources/{id}/query`(하이픈)와 `/v1/data_sources/{id}/query`(언더스코어) 두 가지로 모두 나온다. SDK가 처리하므로 직접 REST를 호출할 때만 문제가 되며, 정식 표기는 **확인 필요**.

---

## 2. @notionhq/client 사용법

### 2.1 개념 요약

| 작업 | SDK 호출 |
|------|----------|
| 행 목록 조회 | `notion.dataSources.query({ data_source_id, filter, sorts, filter_properties, page_size, start_cursor })` |
| 스키마 조회 | `notion.dataSources.retrieve({ data_source_id })` |
| 페이지 단건 조회 | `notion.pages.retrieve({ page_id, filter_properties? })` |
| 페이지 생성 | `notion.pages.create({ parent: { data_source_id }, properties })` |
| 페이지 수정 | `notion.pages.update({ page_id, properties })` |

- `dataSources.query`의 `filter_properties`는 SDK에서 **문자열 배열**이다. 속성 이름 또는 ID를 받는다.
- 응답을 줄이면 formula, rollup, relation이 많은 data source에서 쿼리가 빨라진다.
- 더 필요한 데이터는 페이지를 고른 뒤 `pages.retrieve`로 가져온다.

### 2.2 코드 예시

```ts
import type { Client } from "@notionhq/client"

// (a) 단일 필터 + 정렬 + 응답 축소
async function queryByToken(notion: Client, dataSourceId: string, token: string) {
  return notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: "공유 토큰", rich_text: { equals: token } },
    page_size: 2, // 0/1/2건만 구분하면 되므로 2
    filter_properties: ["title", "클라이언트명", "발행일", "유효기간", "세율", "비고", "상태", "공유 토큰"],
  })
}

// (b) 복합 필터: and / or 중첩
const compoundFilter = {
  and: [
    { property: "상태", status: { equals: "공개" } },
    {
      or: [
        { property: "유효기간", date: { on_or_after: "2026-10-14" } },
        { property: "유효기간", date: { is_empty: true } },
      ],
    },
  ],
} as const

// (c) 정렬
const sorts = [{ property: "순서", direction: "ascending" }] as const

// (d) 스키마 조회
const schema = await notion.dataSources.retrieve({ data_source_id: dataSourceId })

// (e) 페이지 조회 / 생성 / 수정
const page = await notion.pages.retrieve({ page_id })
const created = await notion.pages.create({
  parent: { data_source_id: dataSourceId },
  properties: { 견적번호: { title: [{ text: { content: "Q-2026-002" } }] } },
})
await notion.pages.update({
  page_id: created.id,
  properties: { 상태: { status: { name: "비공개" } } },
})
```

### 2.3 이 프로젝트 적용안

- 이 앱은 **읽기 전용**이다. `pages.create`와 `pages.update`는 토큰 발급 스크립트(오픈 이슈 O-1의 (a)안)에서만 쓸 수 있다.
- 필터의 속성 이름은 PRD 14절 위험 대응대로 **상수 한 곳**(`lib/notion/mappers.ts` 또는 `types/notion.ts`)에 정의한다.
- 이름 기반 필터는 관리자가 Notion에서 속성명을 바꾸면 깨진다. 이때는 400 `validation_error`로 실패하므로 서비스 계층에서 `NOTION_SCHEMA_MISMATCH`와 함께 구분해 로그를 남긴다.

### 2.4 주의사항 / 확인 필요

- 필터 객체를 `as const`로 선언하면 SDK 파라미터 타입과 호환이 안 될 수 있다. 인라인으로 쓰거나 SDK 파라미터 타입에서 추출한 타입으로 선언한다. 컴파일 확인이 필요하다.
- `filter_properties`에 title 속성은 이름 대신 `"title"`을 써도 되는지, 한글 속성명을 URL 인코딩 없이 SDK가 처리하는지는 **확인 필요** (실제 호출로 검증).
- 상태 속성이 Status인지 Select인지에 따라 필터 키가 `status` 또는 `select`로 달라진다. 아래 3절 참고.

---

## 3. 속성 타입별 읽기·쓰기 JSON과 타입 안전 헬퍼

### 3.1 개념 요약

읽기(응답)와 쓰기(요청) 형태가 다르다. 쓰기에는 `id`, `type`, `plain_text` 같은 응답 전용 필드가 필요 없다.

| 타입 | 읽기 (page.properties[이름]) | 쓰기 (properties[이름]) | 필터 키 |
|------|------------------------------|--------------------------|---------|
| title | `{ type: "title", title: RichText[] }` | `{ title: [{ text: { content } }] }` | `title` |
| rich_text | `{ type: "rich_text", rich_text: RichText[] }` | `{ rich_text: [{ text: { content } }] }` | `rich_text` |
| number | `{ type: "number", number: number \| null }` | `{ number: 8 }` | `number` |
| date | `{ type: "date", date: { start, end, time_zone } \| null }` | `{ date: { start: "2026-09-15" } }` | `date` |
| status | `{ type: "status", status: { id, name, color } \| null }` | `{ status: { name: "공개" } }` (기존 옵션만. 새 옵션 생성 불가) | `status` |
| select | `{ type: "select", select: { id, name, color } \| null }` | `{ select: { name: "공개" } }` | `select` |
| relation | `{ type: "relation", relation: { id }[], has_more: boolean }` | `{ relation: [{ id: pageId }] }` | `relation: { contains: pageId }` |
| formula | `{ type: "formula", formula: { type: "string" \| "number" \| "boolean" \| "date", ... } }` (읽기 전용) | 불가 | `formula: { string \| number \| checkbox \| date: ... }` |
| rollup | `{ type: "rollup", rollup: { type: "number" \| "date" \| "array" \| "unsupported" \| "incomplete", ..., function } }` (읽기 전용) | 불가 | 속성별 |

**핵심 주의**

- relation 값은 페이지 응답에서 최대 25건까지만 오고, `has_more: true`가 될 수 있다. 25건을 넘으면 `pages.properties.retrieve`로 별도 페이징해야 한다.
- rollup과 formula는 연결된 database를 Integration에 공유하지 않으면 값이 비거나 incomplete가 될 수 있다.
- rollup은 `type: "unsupported"`(참조가 너무 많거나 중첩 계산)가 올 수 있고, 이 경우 값이 없다.
- 빈 값은 `null` 또는 빈 배열이다. 필수 속성이 비어 있으면 스키마 불일치로 취급한다.

### 3.2 코드 예시 (`any` 없는 값 추출 헬퍼)

```ts
// lib/notion/mappers.ts
import type { PageObjectResponse } from "@notionhq/client"

type PropertyValue = PageObjectResponse["properties"][string]
type PropertyOfType<T extends PropertyValue["type"]> = Extract<PropertyValue, { type: T }>

export class NotionSchemaMismatchError extends Error {
  readonly code = "NOTION_SCHEMA_MISMATCH"
  constructor(message: string) {
    super(message)
    this.name = "NotionSchemaMismatchError"
  }
}

// 속성 존재와 타입을 검사하고 타입을 좁힌다
function requireProperty<T extends PropertyValue["type"]>(
  page: PageObjectResponse,
  name: string,
  type: T,
): PropertyOfType<T> {
  const value = page.properties[name]
  if (value === undefined) {
    throw new NotionSchemaMismatchError(`속성 "${name}"이(가) 없습니다.`)
  }
  if (value.type !== type) {
    throw new NotionSchemaMismatchError(`속성 "${name}" 타입이 ${type}이(가) 아닙니다. (실제: ${value.type})`)
  }
  return value as PropertyOfType<T>
}

export function readTitle(page: PageObjectResponse, name: string): string {
  const prop = requireProperty(page, name, "title")
  const text = prop.title.map((t) => t.plain_text).join("")
  if (text === "") throw new NotionSchemaMismatchError(`필수 속성 "${name}"이(가) 비어 있습니다.`)
  return text
}

export function readRichText(page: PageObjectResponse, name: string): string | null {
  const text = requireProperty(page, name, "rich_text").rich_text.map((t) => t.plain_text).join("")
  return text === "" ? null : text
}

export function readNumber(page: PageObjectResponse, name: string): number {
  const { number } = requireProperty(page, name, "number")
  if (number === null) throw new NotionSchemaMismatchError(`필수 속성 "${name}"이(가) 비어 있습니다.`)
  return number
}

export function readOptionalNumber(page: PageObjectResponse, name: string): number | null {
  return requireProperty(page, name, "number").number
}

export function readDateStart(page: PageObjectResponse, name: string): string {
  const { date } = requireProperty(page, name, "date")
  if (date === null) throw new NotionSchemaMismatchError(`필수 속성 "${name}"이(가) 비어 있습니다.`)
  return date.start // "2026-09-15" 또는 ISO 8601 datetime
}

// 상태가 Status 또는 Select 어느 쪽이든 이름만 반환
export function readOptionName(page: PageObjectResponse, name: string): string {
  const value = page.properties[name]
  if (value === undefined) throw new NotionSchemaMismatchError(`속성 "${name}"이(가) 없습니다.`)
  if (value.type === "status" && value.status !== null) return value.status.name
  if (value.type === "select" && value.select !== null) return value.select.name
  throw new NotionSchemaMismatchError(`속성 "${name}"은(는) 값이 있는 status/select여야 합니다.`)
}

export function readRelationIds(page: PageObjectResponse, name: string): string[] {
  const prop = requireProperty(page, name, "relation")
  if (prop.has_more) {
    throw new NotionSchemaMismatchError(`속성 "${name}" relation이 25건을 초과했습니다. 별도 조회가 필요합니다.`)
  }
  return prop.relation.map((r) => r.id)
}

// formula: 결과 타입을 호출자가 지정
export function readFormulaNumber(page: PageObjectResponse, name: string): number | null {
  const { formula } = requireProperty(page, name, "formula")
  if (formula.type !== "number") throw new NotionSchemaMismatchError(`formula "${name}" 결과가 number가 아닙니다.`)
  return formula.number
}

// rollup: number 결과만 지원, unsupported/incomplete는 에러
export function readRollupNumber(page: PageObjectResponse, name: string): number | null {
  const { rollup } = requireProperty(page, name, "rollup")
  if (rollup.type !== "number") {
    throw new NotionSchemaMismatchError(`rollup "${name}" 결과를 사용할 수 없습니다. (type: ${rollup.type})`)
  }
  return rollup.number
}
```

### 3.3 이 프로젝트 적용안

- 위 헬퍼는 PRD 10절의 `lib/notion/mappers.ts`에 둔다. repository는 헬퍼를 호출해 도메인 타입(`Quote`, `QuoteItem`)을 만들고, 오류는 삼키지 않고 `NOTION_SCHEMA_MISMATCH`로 던진다.
- 세율은 Number(percent) 속성이다. 응답 값은 비율(예: 10%는 `0.1`)로 오는 것이 일반적이다. 도메인의 `taxRate: 0.1`과 맞는지 **확인 필요** (샘플 데이터로 검증).
- PRD의 `상태`가 Status인지 Select인지는 미정이므로 `readOptionName`처럼 둘 다 받는 헬퍼가 안전하다. 필터는 둘 중 하나로 확정해야 한다.

### 3.4 주의사항 / 확인 필요

- `requireProperty` 안의 `value as PropertyOfType<T>`는 `type` 검사 직후이므로 안전하지만, `any`는 아니어도 단언이다. 사용 범위를 이 함수 안으로 제한한다.
- SDK 타입의 정확한 유니온 이름과 `PageObjectResponse["properties"]` 구조는 SDK 버전에 따라 다를 수 있다. 설치 후 `npx tsc --noEmit`로 확인한다.
- 금액 계산은 PRD FR-02대로 service 계층에서 한다. mapper에서 `amount`를 계산하지 않는다.

---

## 4. 페이지네이션, rate limit, 에러 처리

### 4.1 개념 요약

**페이지네이션**

- 응답에 `has_more`, `next_cursor`, `results`가 있다. 다음 요청에서 `start_cursor`에 `next_cursor`를 넘긴다.
- 응답은 `page_size`보다 적게 올 수 있다. `has_more`로만 종료를 판단한다.
- SDK 헬퍼 두 가지가 있다.
  - `collectPaginatedAPI(listFn, firstPageArgs)`는 전체를 배열로 모은다.
  - `iteratePaginatedAPI(listFn, firstPageArgs)`는 `for await`로 하나씩 순회한다.
- 응답의 `request_status`에 `incomplete_reason: "query_result_limit_reached"`가 올 수 있다. 쿼리 결과 한도에 도달했다는 뜻이며 의미 해석은 **확인 필요**.

**Rate limit (Context7 `request-limits` 문서)**

| 플랜 | 한도 (연결당, 60초 창) |
|------|------------------------|
| Business, Enterprise | 600회 (평균 초당 10회) |
| 그 외 | 180회 (평균 초당 3회) |

- 창 안에서 어떤 속도로 써도 된다. 초과하면 HTTP 429와 `rate_limited` 코드가 오고, `Retry-After`는 창이 리셋되기까지 남은 초(최대 60초)다.
- 같은 내용이 본문 `additional_data.retry_after`(문자열)에도 온다.
- `additional_data.rate_limit_reason` 값
  - `public_api_request_rate_limit`: 연결 단위 한도 초과.
  - `public_api_space_request_rate_limit`: 워크스페이스 공유 예산 소진.
  - `public_api_endpoint_rate_limit`: 엔드포인트별 한도.
  - `collection_router_upstream_429`: data source 쿼리가 업스트림에서 제한됨.
  - `public_api_request_blocked`: 접근이 제한된 상태이며 재시도해도 소용없다.
- **529 `service_overload`** 도 Notion 과부하이며 429와 같게 재시도한다.

**공식 권장 재시도 정책**

- 429와 529는 모든 메서드에서 재시도한다.
- 500, 502, 503, 504는 멱등 메서드(GET, DELETE)에서만 재시도한다.
- 대기 시간은 `Retry-After`가 있으면 그 값, 없으면 지수 백오프(`min(2^attempt, 30)`초)에 최대 250ms 지터를 더한다. 최대 6회 시도다.

**SDK 내장 재시도**

- 기본 `maxRetries: 2`, `initialRetryDelayMs: 1000`, `maxRetryDelayMs: 60000`이다. `Retry-After`를 존중한다.
- 재시도 대상은 429와 529(모든 메서드), 500과 503(GET, DELETE만)이다.
- **`dataSources.query`는 POST이므로 500/503은 SDK가 재시도하지 않는다.** 읽기 전용이라 재시도해도 안전하지만 SDK는 메서드로만 판단한다.
- 타임아웃(`RequestTimeoutError`, 기본 60초)은 SDK가 재시도하지 않는다.

**에러 타입**

- `isNotionClientError(error)`로 `NotionClientError`(`APIResponseError`, `RequestTimeoutError`, `UnknownHTTPResponseError`, `InvalidPathParameterError`)로 좁히고 `error.code`로 분기한다.
- `APIErrorCode` 값: `unauthorized`, `restricted_resource`, `object_not_found`, `rate_limited`, `invalid_json`, `invalid_request_url`, `invalid_request`, `invalid_beta`, `validation_error`, `conflict_error`, `internal_server_error`, `service_overload`, `service_unavailable`, `gateway_timeout`.
- `ClientErrorCode` 값: `notionhq_client_request_timeout`, `notionhq_client_response_error`, `notionhq_client_invalid_path_parameter`.

### 4.2 코드 예시

```ts
// 페이지네이션: 품목 전체 수집
import { collectPaginatedAPI } from "@notionhq/client"

const results = await collectPaginatedAPI(notion.dataSources.query, {
  data_source_id: itemsDataSourceId,
  filter: { property: "견적", relation: { contains: quotePageId } },
  sorts: [{ property: "순서", direction: "ascending" }],
  page_size: 100,
})

// 하나씩 순회(메모리 절약)
import { iteratePaginatedAPI } from "@notionhq/client"
for await (const result of iteratePaginatedAPI(notion.dataSources.query, { data_source_id, page_size: 100 })) {
  // result 처리
}
```

```ts
// lib/notion/client.ts: SDK가 재시도하지 않는 오류(5xx, 타임아웃)를 읽기 전용 호출에 한해 재시도
import { APIErrorCode, ClientErrorCode, isNotionClientError } from "@notionhq/client"

export class NotionRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly requestId: string,
    readonly statusCode: number,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = "NotionRequestError"
  }
}

const RETRYABLE_CODES: ReadonlySet<string> = new Set([
  APIErrorCode.InternalServerError,
  APIErrorCode.ServiceUnavailable,
  APIErrorCode.GatewayTimeout,
  ClientErrorCode.RequestTimeout,
])
// RateLimited/ServiceOverload는 SDK가 이미 maxRetries까지 재시도했으므로 중복 재시도하지 않는다.

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function withRetry<T>(
  fn: () => Promise<T>,
  ctx: { requestId: string; maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = ctx.maxAttempts ?? 3
  const baseDelayMs = ctx.baseDelayMs ?? 500

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const code = isNotionClientError(error) ? String(error.code) : "unknown"
      const retryable = isNotionClientError(error) && RETRYABLE_CODES.has(error.code)

      if (!retryable || attempt >= maxAttempts) {
        // 삼키지 않고 requestId와 함께 로그 후 도메인 에러로 변환
        console.error("[notion] 요청 실패", { requestId: ctx.requestId, code, attempt })
        throw new NotionRequestError("Notion 요청에 실패했습니다.", code, ctx.requestId, mapStatus(code), { cause: error })
      }
      const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250
      await sleep(delay)
    }
  }
}

function mapStatus(code: string): number {
  switch (code) {
    case APIErrorCode.ObjectNotFound: return 404
    case APIErrorCode.Unauthorized: return 401
    case APIErrorCode.RestrictedResource: return 403
    case APIErrorCode.RateLimited: return 429
    case ClientErrorCode.RequestTimeout:
    case APIErrorCode.GatewayTimeout: return 504
    default: return 502
  }
}
```

### 4.3 이 프로젝트 적용안

- `lib/notion/client.ts`에 SDK 인스턴스 생성(SDK 내장 재시도로 429/529 처리)과 `withRetry`(5xx, 타임아웃)를 둔다. 이렇게 하면 PRD FR-05의 "제한된 횟수만 재시도(지수 백오프)"를 충족한다.
- `NotionRequestError`는 PRD 9절 `ApiError`(`message`, `code`, `requestId`, `statusCode`)와 같은 필드를 가지므로 service에서 `ApiError`로 매핑하기 쉽다.
- 에러 코드별 사용자 노출 정책
  - `object_not_found`는 두 가지 원인이 섞인다. Integration 미공유(설정 오류)는 서버 로그에 별도로 남기고, 사용자에게는 일반 오류와 `requestId`를 보여 준다.
  - `unauthorized`는 키 오류이므로 운영 알림 대상이다.

### 4.4 주의사항 / 확인 필요

- SDK는 429에서 `Retry-After`를 존중하지만, `maxRetryDelayMs: 60000` 설정 시 서버리스 함수가 최대 60초 대기할 수 있다. PRD의 PDF 응답 5초 목표와 충돌하므로 `maxRetryDelayMs`를 낮추고(예: 5000), 대기가 초과되면 오류 화면 + `requestId`로 처리하는 방침을 정해야 한다. 이 경우 `Retry-After`가 더 길면 SDK가 그 값을 쓰는지 상한과 어떻게 상호작용하는지는 **확인 필요**.
- `isNotionClientError`의 `error.code`가 `NotionErrorCode` 유니온이므로 `Set<string>`에 `has`할 때 타입 호환을 컴파일로 확인한다.
- `collectPaginatedAPI`가 `dataSources.query`를 `this` 바인딩 없이 받아도 동작하는지(화살표 프로퍼티인지)는 공식 예시가 `blocks.children.list`로만 나와 있어 **확인 필요**. 테스트 mock 환경에서는 `vi.fn()`이라 문제없다. 확인 전에는 수동 `has_more` 루프(5.2절 `queryAllPages`)가 더 안전하다.
- `page_size` 최대값 100은 Notion 페이지네이션 문서의 일반 규칙이다. 이번 조회에서는 직접 확인하지 못했으므로 **확인 필요**.

---

## 5. PRD 데이터 모델 적용안

### 5.1 개념 요약: 호출 설계

PRD 6절 구조(견적서 data source ↔ 품목 data source, Relation)에서 견적서 1건 조회는 아래 순서다.

1. 견적서 data source를 `공유 토큰` rich_text `equals` 필터로 쿼리한다. `page_size: 2`로 0, 1, 2건을 구분한다. 2건이면 FR-01대로 에러 처리와 로그를 남긴다.
2. 찾은 견적서 page ID로 **품목 data source를 relation 필터(`견적` contains quotePageId)로 1회 쿼리**하고, `순서`로 정렬한다.
3. 도메인 타입으로 변환해 service에 반환한다.

**N+1을 피하는 방법**

- 나쁜 방법: 견적서의 `품목` relation에서 ID를 꺼내 품목마다 `pages.retrieve`를 부르면 품목 수만큼 호출한다. 게다가 relation은 25건을 넘으면 `has_more`가 되어 잘린다.
- 좋은 방법: 품목 data source를 `견적` relation으로 역방향 필터링해 한 번에 가져온다(품목 100건 이하이면 1회). 호출 수는 2회로 고정된다(PRD 9절 "견적 1회 + 품목 1회"와 일치).
- 견적서 쪽 `품목` relation 속성은 `filter_properties`에서 제외해 응답을 줄인다.
- 품목 쪽 `견적` relation이 있어야 역방향 필터가 가능하다. PRD 6절 품목 스키마에 이미 `견적` Relation이 있다.

**호출 수와 캐시**

- 평균 3회/초 한도에서 캐시 없이는 접속당 2회를 쓰므로 캐시는 필수다(PRD 9절과 동일).
- 공개 링크라 임의 토큰 요청도 Notion 호출을 소비한다. 캐시 키가 토큰이므로, 존재하지 않는 토큰에 대한 반복 요청을 막는 방법(부정 캐시, 토큰 형식 사전 검증)을 검토한다. 토큰 형식(32자 hex 이상)이 틀리면 Notion을 호출하지 않고 바로 404를 반환하는 것이 가장 저렴하다.

### 5.2 코드 예시

```ts
// types/notion.ts
import type { PageObjectResponse } from "@notionhq/client"

export type NotionQuotePage = PageObjectResponse
export type NotionItemPage = PageObjectResponse

export const QUOTE_PROPS = {
  number: "견적번호",
  clientName: "클라이언트명",
  issuedAt: "발행일",
  validUntil: "유효기간",
  taxRate: "세율",
  note: "비고",
  status: "상태",
  token: "공유 토큰",
} as const

export const ITEM_PROPS = {
  name: "품명",
  quote: "견적",
  quantity: "수량",
  unitPrice: "단가",
  description: "설명",
  order: "순서",
} as const
```

```ts
// lib/notion/client.ts (발췌: 싱글턴 getter)
import { Client } from "@notionhq/client"

let cached: Client | undefined

export function getNotionClient(): Client {
  if (cached) return cached
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) throw new Error("NOTION_API_KEY가 설정되지 않았습니다.")
  cached = createNotionClient(apiKey)
  return cached
}
```

```ts
// repositories/quoteRepository.ts
import type { Client, PageObjectResponse } from "@notionhq/client"
import { getNotionClient, withRetry } from "@/lib/notion/client"
import {
  NotionSchemaMismatchError, readTitle, readRichText, readNumber, readOptionalNumber,
  readDateStart, readOptionName,
} from "@/lib/notion/mappers"
import { QUOTE_PROPS, ITEM_PROPS } from "@/types/notion"
import type { Quote, QuoteItem, QuoteStatus } from "@/types/quote"

const STATUS_MAP: Record<string, QuoteStatus> = {
  작성중: "draft",
  공개: "published",
  비공개: "private",
}

export class DuplicateTokenError extends Error {
  readonly code = "DUPLICATE_QUOTE_TOKEN"
  constructor() {
    super("같은 공유 토큰을 가진 견적서가 2건 이상입니다.")
    this.name = "DuplicateTokenError"
  }
}

// query 결과 union(partial page, page, data source)에서 속성을 가진 page만 남긴다
type QueryResult = Awaited<ReturnType<Client["dataSources"]["query"]>>["results"][number]
function isPageWithProperties(result: QueryResult): result is PageObjectResponse {
  return result.object === "page" && "properties" in result
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`)
  return value
}

// 모든 페이지를 수동으로 순회(has_more/next_cursor)
async function queryAllPages(
  notion: Client,
  args: Omit<Parameters<Client["dataSources"]["query"]>[0], "start_cursor">,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = []
  let cursor: string | undefined
  do {
    const response = await notion.dataSources.query({ ...args, start_cursor: cursor })
    pages.push(...response.results.filter(isPageWithProperties))
    cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined
  } while (cursor)
  return pages
}

function toQuoteItem(page: PageObjectResponse): Omit<QuoteItem, "amount"> {
  return {
    name: readTitle(page, ITEM_PROPS.name),
    description: readRichText(page, ITEM_PROPS.description),
    quantity: readNumber(page, ITEM_PROPS.quantity),
    unitPrice: readNumber(page, ITEM_PROPS.unitPrice),
  }
}

export async function findQuoteByToken(token: string, requestId: string): Promise<Omit<Quote, "items"> & { items: Omit<QuoteItem, "amount">[] } | null> {
  const notion = getNotionClient()
  const quotesDataSourceId = requireEnv("NOTION_QUOTES_DATA_SOURCE_ID")
  const itemsDataSourceId = requireEnv("NOTION_ITEMS_DATA_SOURCE_ID")

  // 1) 토큰으로 견적서 조회 (page_size 2: 중복 감지)
  const quoteResponse = await withRetry(
    () =>
      notion.dataSources.query({
        data_source_id: quotesDataSourceId,
        filter: { property: QUOTE_PROPS.token, rich_text: { equals: token } },
        page_size: 2,
        filter_properties: Object.values(QUOTE_PROPS).filter((name) => name !== QUOTE_PROPS.number).concat("title"),
      }),
    { requestId },
  )
  const quotePages = quoteResponse.results.filter(isPageWithProperties)
  if (quotePages.length === 0) return null
  if (quotePages.length > 1) throw new DuplicateTokenError()
  const quotePage = quotePages[0]

  // 2) 품목 data source를 relation 필터로 1회 쿼리 (100건 초과 시 has_more 순회)
  const itemPages = await withRetry(
    () =>
      queryAllPages(notion, {
        data_source_id: itemsDataSourceId,
        filter: { property: ITEM_PROPS.quote, relation: { contains: quotePage.id } },
        sorts: [{ property: ITEM_PROPS.order, direction: "ascending" }],
        page_size: 100,
      }),
    { requestId },
  )

  // 3) 도메인 변환 (Notion raw 타입은 여기서 끝)
  const statusName = readOptionName(quotePage, QUOTE_PROPS.status)
  const status = STATUS_MAP[statusName]
  if (status === undefined) {
    throw new NotionSchemaMismatchError(`알 수 없는 상태 값입니다: ${statusName}`)
  }

  return {
    quoteNumber: readTitle(quotePage, QUOTE_PROPS.number),
    clientName: readRichTextRequired(quotePage, QUOTE_PROPS.clientName),
    issuedAt: readDateStart(quotePage, QUOTE_PROPS.issuedAt),
    validUntil: readDateStart(quotePage, QUOTE_PROPS.validUntil),
    taxRate: readNumber(quotePage, QUOTE_PROPS.taxRate),
    note: readRichText(quotePage, QUOTE_PROPS.note),
    status,
    items: itemPages.map(toQuoteItem),
  }
}

function readRichTextRequired(page: PageObjectResponse, name: string): string {
  const value = readRichText(page, name)
  if (value === null) throw new NotionSchemaMismatchError(`필수 속성 "${name}"이(가) 비어 있습니다.`)
  return value
}
```

위 스케치의 반환 타입은 PRD 11절의 `Quote`와 `QuoteItem.amount`(service에서 계산) 사이를 맞추려고 `Omit`을 썼다. 실제 구현 때는 `types/quote.ts`에 repository 반환 전용 타입(예: `QuoteRecord`)을 두는 것이 읽기 쉽다. `QUOTE_PROPS` 필터링 부분(`filter_properties`)은 장황해서 상수 배열로 분리하는 것을 권한다.

### 5.3 vitest repository 테스트 예시

기존 `__tests__/repositories/itemRepository.test.ts` 패턴(모듈 mock + `vi.mocked` + 헬퍼 함수 + `as unknown as`)을 그대로 따른다.

```ts
// __tests__/repositories/quoteRepository.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { findQuoteByToken, DuplicateTokenError } from "@/repositories/quoteRepository"
import { getNotionClient } from "@/lib/notion/client"

vi.mock("@/lib/notion/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/notion/client")>()
  return { ...actual, getNotionClient: vi.fn(), withRetry: <T>(fn: () => Promise<T>) => fn() }
})

const richText = (content: string) => [{ type: "text", text: { content }, plain_text: content }]

function quotePage(overrides: Record<string, unknown> = {}) {
  return {
    object: "page",
    id: "quote-page-1",
    properties: {
      견적번호: { type: "title", title: richText("Q-2026-001") },
      클라이언트명: { type: "rich_text", rich_text: richText("테스트 고객") },
      발행일: { type: "date", date: { start: "2026-10-01", end: null, time_zone: null } },
      유효기간: { type: "date", date: { start: "2026-10-31", end: null, time_zone: null } },
      세율: { type: "number", number: 0.1 },
      비고: { type: "rich_text", rich_text: [] },
      상태: { type: "status", status: { id: "s1", name: "공개", color: "green" } },
      "공유 토큰": { type: "rich_text", rich_text: richText("a".repeat(32)) },
      ...overrides,
    },
  }
}

function itemPage(name: string, order: number) {
  return {
    object: "page",
    id: `item-${order}`,
    properties: {
      품명: { type: "title", title: richText(name) },
      수량: { type: "number", number: 2 },
      단가: { type: "number", number: 1000 },
      설명: { type: "rich_text", rich_text: [] },
      순서: { type: "number", number: order },
    },
  }
}

function mockNotion(...responses: Array<{ results: unknown[]; has_more: boolean; next_cursor: string | null }>) {
  const query = vi.fn()
  for (const response of responses) query.mockResolvedValueOnce(response)
  vi.mocked(getNotionClient).mockReturnValue({ dataSources: { query } } as unknown as ReturnType<typeof getNotionClient>)
  return { query }
}

describe("quoteRepository.findQuoteByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NOTION_QUOTES_DATA_SOURCE_ID", "quotes-ds")
    vi.stubEnv("NOTION_ITEMS_DATA_SOURCE_ID", "items-ds")
  })

  it("토큰 필터가 쿼리에 전달된다", async () => {
    const { query } = mockNotion(
      { results: [quotePage()], has_more: false, next_cursor: null },
      { results: [], has_more: false, next_cursor: null },
    )

    await findQuoteByToken("token-x", "req-1")

    expect(query).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data_source_id: "quotes-ds",
      filter: { property: "공유 토큰", rich_text: { equals: "token-x" } },
    }))
  })

  it("견적서가 없으면 null을 반환하고 품목은 조회하지 않는다", async () => {
    const { query } = mockNotion({ results: [], has_more: false, next_cursor: null })

    await expect(findQuoteByToken("none", "req-1")).resolves.toBeNull()
    expect(query).toHaveBeenCalledTimes(1)
  })

  it("같은 토큰이 2건이면 DuplicateTokenError를 던진다", async () => {
    mockNotion({ results: [quotePage(), quotePage()], has_more: false, next_cursor: null })

    await expect(findQuoteByToken("dup", "req-1")).rejects.toBeInstanceOf(DuplicateTokenError)
  })

  it("품목은 relation 필터 1회 쿼리로 가져오고 camelCase 도메인 타입으로 변환한다", async () => {
    const { query } = mockNotion(
      { results: [quotePage()], has_more: false, next_cursor: null },
      { results: [itemPage("디자인", 1), itemPage("개발", 2)], has_more: false, next_cursor: null },
    )

    const quote = await findQuoteByToken("t", "req-1")

    expect(query).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data_source_id: "items-ds",
      filter: { property: "견적", relation: { contains: "quote-page-1" } },
      sorts: [{ property: "순서", direction: "ascending" }],
    }))
    expect(quote?.items.map((i) => i.name)).toEqual(["디자인", "개발"])
    expect(quote).toMatchObject({ quoteNumber: "Q-2026-001", clientName: "테스트 고객", status: "published" })
  })

  it("품목이 has_more이면 next_cursor로 이어서 조회한다", async () => {
    const { query } = mockNotion(
      { results: [quotePage()], has_more: false, next_cursor: null },
      { results: [itemPage("A", 1)], has_more: true, next_cursor: "cursor-2" },
      { results: [itemPage("B", 2)], has_more: false, next_cursor: null },
    )

    const quote = await findQuoteByToken("t", "req-1")

    expect(query).toHaveBeenNthCalledWith(3, expect.objectContaining({ start_cursor: "cursor-2" }))
    expect(quote?.items).toHaveLength(2)
  })

  it("필수 속성이 없으면 NOTION_SCHEMA_MISMATCH를 던진다", async () => {
    mockNotion({ results: [quotePage({ 세율: undefined })], has_more: false, next_cursor: null })

    await expect(findQuoteByToken("t", "req-1")).rejects.toMatchObject({ code: "NOTION_SCHEMA_MISMATCH" })
  })
})
```

`lib/notion` 테스트(429 `Retry-After` 대기 후 재시도, 최대 재시도 후 에러 전파)는 `vi.useFakeTimers()`와 `APIResponseError` 유사 객체 mock으로 작성한다. SDK 내장 재시도는 `fetch` mock 또는 `baseUrl`로 별도 검증해야 하며, 단위 테스트에서는 `withRetry`의 5xx와 타임아웃 재시도만 대상으로 한다. 429 재시도는 SDK 책임이므로 설정값(`retry` 옵션) 확인 테스트로 갈음하는 것을 권한다.

### 5.4 이 프로젝트 적용안

| 파일 | 역할 |
|------|------|
| `lib/notion/client.ts` | SDK 인스턴스, `withRetry`, `NotionRequestError` |
| `lib/notion/mappers.ts` | 속성 값 추출 헬퍼, `NotionSchemaMismatchError` |
| `types/notion.ts` | 속성명 상수(`QUOTE_PROPS`, `ITEM_PROPS`), `NotionQuotePage`/`NotionItemPage` |
| `repositories/quoteRepository.ts` | 쿼리 2회, 중복 토큰 감지, 도메인 변환 (상태·만료 판정은 하지 않음) |
| `services/quoteService.ts` | 상태·만료 판정, 금액 계산, `NotionRequestError`/`DuplicateTokenError`를 `ApiError`로 매핑 |

- 상태 `비공개`와 만료 판정을 service에서 하므로 repository는 `공개` 필터를 걸지 않는다. 이 방침은 PRD 10절 계층별 책임표와 일치한다.
- 토큰 형식 검증(길이, 문자 집합)은 service 진입부에서 하고, 형식이 틀리면 Notion을 호출하지 않는다.

### 5.5 주의사항 / 확인 필요

- 위 스케치는 **미실행 코드**다. SDK 설치 후 `npx tsc --noEmit`로 타입을 확인한다. 특히 `Parameters<Client["dataSources"]["query"]>[0]`의 `Omit`과 `filter_properties` 배열 타입에 주의한다.
- `rich_text equals`가 대소문자를 구분하는지는 **확인 필요**. 토큰이 소문자 hex면 문제없지만, 일관되게 소문자로 발급한다.
- 품목 relation 필터는 품목 data source 쪽에 `견적` relation 속성이 있어야 한다. 단방향 relation으로 만들었다면 견적서 쪽 `품목`이 없을 수 있으므로, Notion에서 **양방향(dual) relation**으로 구성하는 것을 권한다.
- 견적서와 품목 database **모두** Integration에 공유해야 한다. 품목 쪽만 공유가 빠지면 relation 필터가 비거나 404가 난다.
- 서비스 계층 중복 토큰 처리: 2건이 감지돼도 사용자에게는 일반 오류와 `requestId`를 보여 주고, 로그에는 토큰의 앞 일부만 남긴다(토큰 전체 로그 금지 권장).
- Next.js 16 `cacheComponents` 환경에서 SDK 호출을 캐시하는 방법(`use cache`, 캐시 태그 등)은 PRD 9절대로 **구현 전 Next.js 공식 문서 확인 필요**. SDK가 사용하는 `fetch` 구현이 Next의 fetch 캐시 대상인지도 확인하지 못했다.
- 변경 통지를 폴링 대신 webhook으로 받는 방법이 Notion 문서에 언급되어 있다(query 성능 팁 항목). 이번 MVP 범위 밖이며, 즉시 반영이 필요해지면 `revalidateTag` 연동과 함께 검토한다. 세부는 **확인 필요**.

---

## 6. PRD 6절 "Notion 연동 사실" 검증

| # | PRD 주장 | 판정 | 근거 |
|---|----------|------|------|
| 1 | 최신 API 버전은 `2026-03-11` | **맞음** (조사 시점 기준) | Context7(`retrieve-a-data-source`, `post-page`, `retrieve-a-page`)에 "The latest version is `2026-03-11`". `changes-by-version`에도 `2026-03-11` 항목이 있다. 이후 새 버전이 나왔는지는 문서 갱신 주기에 달려 있으므로, 구현 시점에 `changes-by-version`을 재확인한다. |
| 2 | 목록 조회는 data source 쿼리 `POST /v1/data-sources/{id}/query` | **맞음** (경로 표기만 확인 필요) | 문서의 `query-a-data-source` 페이지가 이 엔드포인트다. 다만 같은 문서군에서 `data-sources`(하이픈)와 `data_sources`(언더스코어) 표기가 섞여 있다. SDK 사용 시 영향 없음. |
| 3 | SDK가 `notion.dataSources.query(...)` 제공 | **맞음** | Context7 `/websites/developers_notion_reference`의 TypeScript SDK 예시와 `/makenotion/notion-sdk-js` 문서에서 확인. |
| 4 | 속성 필터(`rich_text`, `status`, `select`, `date` 등)와 `filter_properties`로 응답 축소 | **맞음** | `filter-data-source-entries`에 status, select, relation 필터 예시가 있고, `query-a-data-source`에 `filter_properties` 권장 사항이 있다. SDK에서는 문자열 배열이며 이름 또는 ID를 받는다. |
| 5 | 연결당 60초 창 기준 Business/Enterprise 600회, 그 외 180회 | **맞음** | `request-limits` 문서: Business/Enterprise는 분당 600회(평균 초당 10회), 그 외는 분당 180회(평균 초당 3회). |
| 6 | "(평균 초당 3회)" | **맞음** (그 외 플랜 한정) | 위 표와 동일. Business/Enterprise는 평균 초당 10회다. PRD의 "평균 초당 3회"는 비-Business 플랜 기준이라는 점을 문서에 명시하면 더 정확하다. |
| 7 | 초과 시 429와 `Retry-After` | **맞음** (보충 필요) | 429 `rate_limited`, `Retry-After`는 창 리셋까지 남은 초(최대 60초). 추가로 **529 `service_overload`도 같은 방식으로 재시도**해야 하고, 워크스페이스 공유 예산(`public_api_space_request_rate_limit`) 등 `rate_limit_reason`이 여러 종류다. |
| 8 | 공유하지 않으면 404 | **맞음** (보충 필요) | `query-a-data-source` 문서: "Before a connection can query a data source, its parent database must be shared with the connection. ... will return an HTTP response with a 404 status code." `retrieve-a-page`도 404를 "Missing page or missing access"로 설명. **보충**: relation, rollup, formula가 참조하는 연결된 database도 공유해야 하며, 누락 시 404가 아니라 값이 비거나 incomplete가 될 수 있다. |

**PRD 다른 곳에서 발견한 사실과의 차이**

- **재시도 책임 (FR-05, 10절)**: PRD는 "429/5xx/타임아웃 시 지수 백오프 재시도"를 `lib/notion`이 하는 것으로 둔다. SDK에 이미 내장 재시도가 있다(기본 2회, 429/529는 모든 메서드, 500/503은 GET/DELETE만). `dataSources.query`는 POST라 **5xx와 타임아웃은 SDK가 재시도하지 않으므로** 본문 4절의 `withRetry`가 필요하다. 반대로 429/529를 `lib/notion`이 직접 또 재시도하면 중복이다.
- **타임아웃**: SDK 기본 `timeoutMs`는 60초다. FR-03의 5초 목표를 지키려면 명시적으로 줄여야 한다.
- **`isFullPageOrDataSource` (11절)**: SDK에 존재하는 가드다. 다만 이 가드는 `PageObjectResponse | DataSourceObjectResponse`로 좁히므로, 속성에 접근하려면 `object === "page"` 확인이 추가로 필요하다(5.2절 `isPageWithProperties`).
- **호출 수 "견적 1회 + 품목 1회"**: 품목이 100건을 초과하면 `has_more` 순회로 호출이 늘어난다(100건은 일반 규칙, **확인 필요**). 견적서의 `품목` relation 값을 쓰는 경로는 25건 초과 시 잘리므로, 역방향 relation 필터 방식을 쓴다.
- **환경변수 이름**: PRD의 `NOTION_*_DATA_SOURCE_ID`는 data source ID라는 의미로 올바르다. database ID와 혼동하지 않도록 `.env.example` 주석에 명시하는 것을 권한다.

---

## 출처

**Context7 라이브러리 ID**

- `/websites/developers_notion_reference` (Notion API Reference): query-a-data-source, retrieve-a-data-source, post-page, retrieve-a-page, page-property-values, property-object, filter-data-source-entries, request-limits, changes-by-version, update-a-data-source
- `/websites/developers_notion_guides` (Notion API Guides): notion-s-api-workspace (2025-09-03 마이그레이션), working-with-views
- `/makenotion/notion-sdk-js` (Notion JavaScript SDK): README(에러 처리, 자동 재시도), `_autodocs/configuration.md`, `_autodocs/errors.md`, `_autodocs/api-reference/helpers.md`, `_autodocs/api-reference/client.md`, `_autodocs/api-reference/data-sources.md`

**문서 URL (Context7 응답에 표기된 원문 출처)**

- https://developers.notion.com/reference/query-a-data-source
- https://developers.notion.com/reference/retrieve-a-data-source
- https://developers.notion.com/reference/update-a-data-source
- https://developers.notion.com/reference/filter-data-source-entries
- https://developers.notion.com/reference/page-property-values
- https://developers.notion.com/reference/property-object
- https://developers.notion.com/reference/post-page
- https://developers.notion.com/reference/retrieve-a-page
- https://developers.notion.com/reference/request-limits
- https://developers.notion.com/reference/changes-by-version
- https://developers.notion.com/guides/resources/notion-s-api-workspace
- https://github.com/makenotion/notion-sdk-js (README, `_autodocs/`)

**프로젝트 내 근거**

- `docs/PRD.md` 6, 9, 10, 11, 12절
- `types/common.ts` (`ApiError` 형태)
- `__tests__/repositories/itemRepository.test.ts` (repository 테스트 패턴)

**미확인 항목 요약 (WebFetch로 직접 확인하지 않음)**

- SDK 기본 `notionVersion` 값, `collectPaginatedAPI`의 `this` 바인딩 동작, `page_size` 최대 100, `rich_text equals` 대소문자 구분, 퍼센트 Number 속성의 응답 값 형태, Next.js 16 캐시와 SDK `fetch`의 관계
