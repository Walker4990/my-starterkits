// PreToolUse 훅: 중요 파일(비밀값·인증서·개인키)에 대한 접근(읽기/검색/수정/셸 명령)을 차단한다.
// stdin으로 이벤트 JSON을 받고, 차단 시 stderr 메시지와 함께 exit code 2로 종료한다.
// 보호 대상을 바꾸려면 PROTECTED_FILES만 수정한다.

// source: 파일명 패턴. .env.example은 비밀값이 없으므로 허용한다.
const PROTECTED_FILES = [
  { label: "환경변수 파일", source: String.raw`\.env(?:\.(?!example(?![\w.-]))[\w.-]+)?` },
  { label: "로컬 설정 파일(웹훅 URL 등)", source: String.raw`\.claude[\\/]settings\.local\.json` },
  { label: "인증서/키 파일", source: String.raw`[\w.-]+\.(?:pem|key)` },
  { label: "SSH 개인키", source: String.raw`id_(?:rsa|ed25519|ecdsa)` },
];

// 파일 경로: 경로 구분자 또는 문자열 시작 뒤에서 끝까지 일치해야 한다.
const pathMatchers = PROTECTED_FILES.map(({ label, source }) => ({
  label,
  regex: new RegExp(String.raw`(?:^|[\\/])${source}$`),
}));

// 셸 명령: 공백·따옴표·경로 구분자 뒤에서 시작하고, 공백·따옴표·파이프 등 앞에서 끝나는 토큰.
const commandMatchers = PROTECTED_FILES.map(({ label, source }) => ({
  label,
  regex: new RegExp(String.raw`(?:^|[\s"'\\/=<>])${source}(?=$|[\s"'|&;)])`),
}));

function findProtected(matchers, text) {
  return matchers.find(({ regex }) => regex.test(text))?.label;
}

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
    process.stderr.write(`protect-files: 입력 JSON 파싱 실패: ${error.message}\n`);
    process.exit(1);
  }

  const { tool_name: toolName, tool_input: input = {} } = event;

  if (["Read", "Edit", "Write", "NotebookEdit", "Grep"].includes(toolName)) {
    const target = input.file_path ?? input.notebook_path ?? input.path ?? "";
    const label = findProtected(pathMatchers, target);
    if (label) {
      block(`${label}은(는) 접근할 수 없습니다: ${target}`);
    }
  }

  if (["Bash", "PowerShell"].includes(toolName)) {
    const command = input.command ?? "";
    const label = findProtected(commandMatchers, command);
    if (label) {
      block(`${label}에 접근하는 명령입니다. 필요하면 사용자가 직접 실행하세요.`);
    }
  }

  process.exit(0);
});
