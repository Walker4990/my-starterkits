// PreToolUse 훅: 민감 파일 수정과 위험한 명령을 차단한다.
// stdin으로 이벤트 JSON을 받고, 차단 시 stderr 메시지와 함께 exit code 2로 종료한다.

const PROTECTED_FILE = /(^|[\\/])\.env(\.(?!example$)[^\\/]*)?$/;

const DANGEROUS_COMMANDS = [
  { pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i, reason: "rm -rf" },
  { pattern: /\bRemove-Item\b.*-Recurse.*-Force|\bRemove-Item\b.*-Force.*-Recurse/i, reason: "Remove-Item -Recurse -Force" },
  { pattern: /\bgit\s+push\b.*(--force\b|\s-f\b)/i, reason: "git push --force" },
  { pattern: /\bgit\s+reset\s+--hard\b/i, reason: "git reset --hard" },
  { pattern: /\bgit\s+clean\s+-[a-z]*f/i, reason: "git clean -f" },
];

function block(message) {
  process.stderr.write(`[차단] ${message}\n`);
  process.exit(2);
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(raw);
  } catch (error) {
    // 훅 자체 오류로 작업을 막지 않되, 원인은 stderr에 남긴다.
    process.stderr.write(`pre-tool-use-guard: 입력 JSON 파싱 실패: ${error.message}\n`);
    process.exit(1);
  }

  const { tool_name: toolName, tool_input: input = {} } = event;

  if (["Edit", "Write", "NotebookEdit"].includes(toolName)) {
    const filePath = input.file_path ?? input.notebook_path ?? "";
    if (PROTECTED_FILE.test(filePath)) {
      block(`환경변수 파일은 수정할 수 없습니다: ${filePath}`);
    }
  }

  if (["Bash", "PowerShell"].includes(toolName)) {
    const command = input.command ?? "";
    const matched = DANGEROUS_COMMANDS.find(({ pattern }) => pattern.test(command));
    if (matched) {
      block(`위험한 명령입니다 (${matched.reason}). 필요하면 사용자가 직접 실행하세요.`);
    }
  }

  process.exit(0);
});
