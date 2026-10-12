import { QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
      },
    },
  })
}

// 서버 측에서는 매 요청마다 새 QueryClient 생성
// 브라우저에서는 싱글턴 유지
let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
