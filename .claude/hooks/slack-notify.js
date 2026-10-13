// Notification / Stop 훅: Slack Incoming Webhook으로 알림을 보낸다.
// 사용법: node slack-notify.js <permission|done>  (stdin으로 이벤트 JSON 수신)
// 웹훅 URL은 환경변수 SLACK_WEBHOOK_URL로 주입한다 (settings.local.json의 env).
// 실패 시 stderr에 원인을 남기고 exit 1로 종료한다. Claude 진행을 막는 exit 2는 쓰지 않는다.

const TIMEOUT_MS = 5000;

function projectName(cwd) {
  // Windows/POSIX 경로 모두에서 마지막 디렉토리명을 꺼낸다.
  const parts = String(cwd ?? "").split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? "unknown";
}

function buildMessage(kind, event) {
  const project = projectName(event.cwd);
  if (kind === "permission") {
    const detail = event.message ? `: ${event.message}` : "";
    return `🔐 *권한 요청* — ${project}${detail}`;
  }
  if (kind === "done") {
    return `✅ *작업 완료* — ${project}`;
  }
  return null;
}

function fail(message) {
  process.stderr.write(`slack-notify: ${message}\n`);
  process.exit(1);
}

async function send(url, text) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    fail(`Slack 웹훅 전송 실패 (HTTP ${response.status})`);
  }
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", async () => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    fail("SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다 (.claude/settings.local.json의 env 확인)");
  }

  let event;
  try {
    event = JSON.parse(raw || "{}");
  } catch (error) {
    fail(`입력 JSON 파싱 실패: ${error.message}`);
  }

  const kind = process.argv[2];
  const text = buildMessage(kind, event);
  if (!text) {
    fail(`알 수 없는 알림 종류: ${kind ?? "(없음)"} (permission | done)`);
  }

  try {
    await send(url, text);
  } catch (error) {
    fail(`Slack 웹훅 전송 오류: ${error.message}`);
  }
  process.exit(0);
});
