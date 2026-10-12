"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/showcase/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type HealthResponse = {
  status: string
  request_id: string
  timestamp: string
}

export default function ApiDemoPage() {
  const [result, setResult] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleHealthCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/health`
      )
      const data = await res.json()
      setResult(data)
    } catch {
      setError("FastAPI 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeader
        title="API 데모"
        description="FastAPI 백엔드와 통신하는 예제입니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>헬스체크</CardTitle>
          <CardDescription>
            FastAPI 백엔드의 <code className="text-xs bg-muted px-1 py-0.5 rounded">GET /health</code> 엔드포인트를 호출합니다.
            백엔드를 먼저 실행해주세요:{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              cd backend && uvicorn main:app --reload
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleHealthCheck} disabled={loading}>
            {loading ? "요청 중..." : "헬스체크 실행"}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {result && (
            <div className="rounded-md border bg-muted/50 p-4 space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">status:</span>
                <Badge variant={result.status === "ok" ? "default" : "destructive"}>
                  {result.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">request_id: </span>
                {result.request_id}
              </div>
              <div>
                <span className="text-muted-foreground">timestamp: </span>
                {result.timestamp}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API 엔드포인트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            {[
              { method: "GET", path: "/health" },
              { method: "GET", path: "/api/v1/users" },
              { method: "GET", path: "/api/v1/users/:id" },
              { method: "POST", path: "/api/v1/users" },
              { method: "PUT", path: "/api/v1/users/:id" },
              { method: "DELETE", path: "/api/v1/users/:id" },
              { method: "GET", path: "/api/v1/items" },
              { method: "POST", path: "/api/v1/items" },
              { method: "PUT", path: "/api/v1/items/:id" },
              { method: "DELETE", path: "/api/v1/items/:id" },
            ].map(({ method, path }) => (
              <div key={`${method}-${path}`} className="flex items-center gap-3">
                <Badge
                  variant={method === "GET" ? "secondary" : method === "POST" ? "default" : "outline"}
                  className="w-16 justify-center text-xs"
                >
                  {method}
                </Badge>
                <span className="text-muted-foreground">{path}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
