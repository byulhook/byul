const ANSI_COLORS = {
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

const mock_user_config = {
  byulFormat: "{type}: {commitMessage} #{issueNumber}",
};

async function formatTitle(branchName, title) {
  let branchType = "";
  let issueNumber = "";

  const parts = branchName.split("/");
  branchType = parts[parts.length - 2] || parts[0];

  const lastPart = parts[parts.length - 1];
  const numberMatch = lastPart.match(/-(\d+)$/);
  if (numberMatch) {
    issueNumber = numberMatch[1];
  }

  if (!branchType) {
    console.warn(
      `${ANSI_COLORS.yellow}[2/2] ⚠️ The branch name "${branchName}" does not follow the required format. Keeping the original commit message.${ANSI_COLORS.reset}`
    );
    return title;
  }

  const userConfig = mock_user_config;

  let format =
    userConfig?.byulFormat || "{type}: {commitMessage} #{issueNumber}";

  format = format
    .replace("{type}", branchType)
    .replace("{issueNumber}", issueNumber)
    .replace("{commitMessage}", title);

  return format;
}

// 테스트
const testCases = [
  ["feature/login-123-234", "add app.tsx"],
  ["react/dom/feat/login-23", "update login component"],
  ["byul/feat/323login-23-2565", "refactor authentication"],
  ["develop/323log4in-v23-2565-2345", "fix logger"],
  ["develop/fix/323log4in/dadasd/df-v23-2565-2345", "fix logger"],
];

async function runTests() {
  for (const [branchName, title] of testCases) {
    console.log(`Branch: ${branchName}`);
    console.log(`Title: ${title}`);
    const result = await formatTitle(branchName, title);
    console.log(`Result: ${result}`);
    console.log("---");
  }
}

runTests().catch((error) => console.error("Test error:", error));
