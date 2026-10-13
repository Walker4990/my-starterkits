import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { apiClient } from "@/lib/api/client"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("apiClient", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("모든 요청에 X-Request-ID 헤더를 추가한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }))

    await apiClient.get("/api/v1/items")

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["X-Request-ID"]).toMatch(/^req_/)
  })

  it("204 응답은 본문 파싱 없이 성공으로 처리한다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiClient.delete("/api/v1/items/item-1")).resolves.toBeUndefined()
  })

  it("서버 에러 응답의 message, code, requestId를 그대로 전달한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { message: "아이템을 찾을 수 없습니다.", code: "ITEM_NOT_FOUND", requestId: "req_server", statusCode: 404 },
        404
      )
    )

    await expect(apiClient.get("/api/v1/items/x")).rejects.toEqual({
      message: "아이템을 찾을 수 없습니다.",
      code: "ITEM_NOT_FOUND",
      requestId: "req_server",
      statusCode: 404,
    })
  })

  it("에러 본문이 JSON이 아니면 기본 메시지와 클라이언트 requestId를 사용한다", async () => {
    fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }))

    await expect(apiClient.get("/api/v1/items")).rejects.toMatchObject({
      code: "UNKNOWN_ERROR",
      statusCode: 502,
      requestId: expect.stringMatching(/^req_/),
    })
  })
})
