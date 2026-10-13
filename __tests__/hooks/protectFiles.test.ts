// @vitest-environment node
import { spawn } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "vitest"

const SCRIPT = path.resolve(__dirname, "../../.claude/hooks/protect-files.js")

interface RunResult {
  code: number | null
  stderr: string
}

function runHook(stdin: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT])
    let stderr = ""
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, stderr }))
    child.stdin.end(stdin)
  })
}

const run = (toolName: string, toolInput: object) =>
  runHook(JSON.stringify({ tool_name: toolName, tool_input: toolInput }))

describe("protect-files 훅", () => {
  describe("파일 도구 (Read/Edit/Write/Grep)", () => {
    it.each([
      ["Read", { file_path: "C:\\work\\app\\.env" }],
      ["Read", { file_path: "/work/app/.env.local" }],
      ["Edit", { file_path: "/work/app/.env.production" }],
      ["Write", { file_path: "/work/app/.claude/settings.local.json" }],
      ["Read", { file_path: "C:\\work\\app\\.claude\\settings.local.json" }],
      ["Read", { file_path: "/home/me/certs/server.pem" }],
      ["Read", { file_path: "/home/me/certs/private.key" }],
      ["Read", { file_path: "/home/me/.ssh/id_rsa" }],
      ["Read", { file_path: "/home/me/.ssh/id_ed25519" }],
      ["Grep", { pattern: "SECRET", path: "/work/app/.env" }],
      ["NotebookEdit", { notebook_path: "/work/app/.env" }],
    ])("%s %j 는 exit 2로 차단한다", async (toolName, toolInput) => {
      const result = await run(toolName, toolInput)

      expect(result.code).toBe(2)
      expect(result.stderr).toContain("[차단]")
    })

    it.each([
      ["Read", { file_path: "/work/app/.env.example" }],
      ["Read", { file_path: "/work/app/README.md" }],
      ["Read", { file_path: "/work/app/.claude/settings.json" }],
      ["Read", { file_path: "/work/app/src/environment.ts" }],
      ["Read", { file_path: "/work/app/monkey.keyboard" }],
      ["Grep", { pattern: "foo", path: "/work/app/src" }],
    ])("%s %j 는 허용한다", async (toolName, toolInput) => {
      const result = await run(toolName, toolInput)

      expect(result.code).toBe(0)
    })
  })

  describe("셸 명령 (Bash/PowerShell)", () => {
    it.each([
      ["Bash", "cat .env"],
      ["Bash", "cat ./.env.local | head"],
      ["Bash", 'node -e "require(\'fs\').readFileSync(\'.claude/settings.local.json\')"'],
      ["PowerShell", "Get-Content .env"],
      ["PowerShell", "type C:\\work\\app\\.env.production"],
      ["Bash", "cp ~/.ssh/id_rsa /tmp/x"],
      ["Bash", "openssl x509 -in server.pem -text"],
    ])("%s `%s` 는 exit 2로 차단한다", async (toolName, command) => {
      const result = await run(toolName, { command })

      expect(result.code).toBe(2)
      expect(result.stderr).toContain("[차단]")
    })

    it.each([
      ["Bash", "cat .env.example"],
      ["Bash", "git status"],
      ["Bash", "npm run lint"],
      ["PowerShell", "Get-Content README.md"],
    ])("%s `%s` 는 허용한다", async (toolName, command) => {
      const result = await run(toolName, { command })

      expect(result.code).toBe(0)
    })
  })

  it("대상이 아닌 도구는 허용한다", async () => {
    const result = await run("Glob", { pattern: "**/*.ts" })

    expect(result.code).toBe(0)
  })

  it("JSON 파싱에 실패하면 원인을 stderr에 남기고 exit 1로 종료한다 (작업을 막는 exit 2는 사용하지 않는다)", async () => {
    const result = await runHook("not-json")

    expect(result.code).toBe(1)
    expect(result.stderr).toContain("protect-files")
  })
})
