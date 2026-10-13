import type { ApiError, ApiResponse } from "@/types/common"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

async function send(path: string, options: FetchOptions = {}): Promise<Response> {
  const requestId = generateRequestId()
  const { body, ...rest } = options

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let errorData: Partial<ApiError> = {}
    try {
      errorData = await response.json()
    } catch {
      // JSON 파싱 실패 무시
    }
    const error: ApiError = {
      message: errorData.message ?? "요청에 실패했습니다.",
      code: errorData.code ?? "UNKNOWN_ERROR",
      requestId: errorData.requestId ?? requestId,
      statusCode: response.status,
    }
    throw error
  }

  return response
}

async function request<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const response = await send(path, options)
  return response.json() as Promise<ApiResponse<T>>
}

export const apiClient = {
  get: <T>(path: string, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  // 백엔드 DELETE는 204 No Content라 본문을 파싱하지 않는다
  delete: async (path: string, options?: FetchOptions): Promise<void> => {
    await send(path, { ...options, method: "DELETE" })
  },
}
