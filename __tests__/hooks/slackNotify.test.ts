// @vitest-environment node
import { spawn } from "node:child_process"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const SCRIPT = path.resolve(__dirname, "../../.claude/hooks/slack-notify.js")

interface RunResult {
  code: number | null
  stderr: string
}

function runHook(kind: string, event: object, env: Record<string, string | undefined>): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, kind], {
      env: { ...process.env, SLACK_WEBHOOK_URL: undefined, ...env },
    })
    let stderr = ""
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, stderr }))
    child.stdin.end(JSON.stringify(event))
  })
}

describe("slack-notify 훅", () => {
  let server: Server | undefined

  afterEach(() => {
    server?.close()
    server = undefined
  })

  async function startWebhook(status = 200) {
    const bodies: string[] = []
    server = createServer((req, res) => {
      let body = ""
      req.on("data", (chunk) => (body += chunk))
      req.on("end", () => {
        bodies.push(body)
        res.statusCode = status
        res.end("ok")
      })
    })
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve))
    const { port } = server.address() as AddressInfo
    return { url: `http://127.0.0.1:${port}/hook`, bodies }
  }

  it("permission: 프로젝트명과 알림 메시지를 전송한다", async () => {
    const { url, bodies } = await startWebhook()

    const result = await runHook(
      "permission",
      { message: "Claude needs your permission to use Bash", cwd: "C:\\work\\my-starterkits" },
      { SLACK_WEBHOOK_URL: url },
    )

    expect(result.code).toBe(0)
    expect(bodies).toHaveLength(1)
    const { text } = JSON.parse(bodies[0])
    expect(text).toContain("권한 요청")
    expect(text).toContain("my-starterkits")
    expect(text).toContain("Claude needs your permission to use Bash")
  })

  it("done: 작업 완료 메시지를 전송한다", async () => {
    const { url, bodies } = await startWebhook()

    const result = await runHook("done", { cwd: "/home/me/my-starterkits" }, { SLACK_WEBHOOK_URL: url })

    expect(result.code).toBe(0)
    const { text } = JSON.parse(bodies[0])
    expect(text).toContain("작업 완료")
    expect(text).toContain("my-starterkits")
  })

  it("SLACK_WEBHOOK_URL이 없으면 안내를 stderr에 남기고 exit 1로 종료한다", async () => {
    const result = await runHook("done", { cwd: "/x/proj" }, {})

    expect(result.code).toBe(1)
    expect(result.stderr).toContain("SLACK_WEBHOOK_URL")
  })

  it("웹훅이 실패 응답을 주면 상태 코드를 stderr에 남기고 exit 1로 종료한다", async () => {
    const { url } = await startWebhook(500)

    const result = await runHook("done", { cwd: "/x/proj" }, { SLACK_WEBHOOK_URL: url })

    expect(result.code).toBe(1)
    expect(result.stderr).toContain("500")
  })

  it("알 수 없는 종류면 exit 1로 종료한다 (작업을 막는 exit 2는 사용하지 않는다)", async () => {
    const result = await runHook("unknown", {}, { SLACK_WEBHOOK_URL: "http://127.0.0.1:1" })

    expect(result.code).toBe(1)
  })
})
