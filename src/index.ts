import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ANSI_COLORS = {
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function formatCommitMessage(): Promise<void> {
  const startTime = Date.now();
  console.log();
  console.log(`${ANSI_COLORS.cyan}🔄 Starting byul - Developed by love1ace${ANSI_COLORS.reset}`);
  console.log(`${ANSI_COLORS.gray}[1/2] 🔍 Retrieving branch information...${ANSI_COLORS.reset}`);

  try {
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    const commitMsgFile = process.env.HUSKY_GIT_PARAMS || process.argv[2];
    if (!commitMsgFile) {
      console.error(
        `${ANSI_COLORS.red}Error: No commit message file provided.${ANSI_COLORS.reset}`
      );
      return;
    }

    console.log(`${ANSI_COLORS.gray}[2/2] 📝 Formatting commit message...${ANSI_COLORS.reset}`);

    const commitMessage = readFileSync(commitMsgFile, "utf8");

    const lines = commitMessage
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));

    if (lines.length === 0) {
      console.error(
        `${ANSI_COLORS.red}Error: The commit message is empty after removing comments and empty lines.${ANSI_COLORS.reset}`
      );
      return;
    }

    const title = lines[0];
    const body = lines.slice(1).join("\n");

    const formattedTitle = await formatTitle(branchName, title);

    const formattedMessage = [formattedTitle, body]
      .filter(Boolean)
      .join("\n\n");

    writeFileSync(commitMsgFile, formattedMessage);

    console.log(
      `${ANSI_COLORS.green}Success!${ANSI_COLORS.reset} byul has formatted the commit message.`
    );
  } catch (error) {
    console.error(`${ANSI_COLORS.red}Error formatting commit message:${ANSI_COLORS.reset}`, error);
    process.exit(1);
  }

  console.log(
    `${ANSI_COLORS.blue}✨ Done in ${(Date.now() - startTime) / 1000}s.${ANSI_COLORS.reset}`
  );
  console.log();
}

async function formatTitle(branchName: string, title: string): Promise<string> {
  const [branchType] = branchName.split("/");
  const issueNumberMatch = branchName.match(/\d+/);
  const issueNumber = issueNumberMatch ? issueNumberMatch[0] : "";

  if (!branchName.includes("/")) {
    console.warn(
      `${ANSI_COLORS.yellow}[2/2] ⚠️ The branch name "${branchName}" does not follow the required format (e.g., "type/issue"). Keeping the original commit message.${ANSI_COLORS.reset}`
    );
    return title;
  }

  if (branchName.match(/\d+[.-]\d+/)) {
    console.warn(
      `${ANSI_COLORS.yellow}[2/2] ⚠️ Invalid issue number format detected in branch name "${branchName}". Keeping the original commit message.${ANSI_COLORS.reset}`
    );
    return title;
  }

  const userConfig = getUserConfig();
  let format =
    userConfig?.byulFormat || "{type}: {commitMessage} #{issueNumber}";

  format = format
    .replace("{type}", branchType)
    .replace("{issueNumber}", issueNumber)
    .replace("{commitMessage}", title);

  return format;
}

function getUserConfig(): { byulFormat: string } | null {
  try {
    const configPath = join(process.cwd(), "byul.config.json");
    const configFile = readFileSync(configPath, "utf8");
    return JSON.parse(configFile);
  } catch (error) {
    console.warn(
      "Warning: Could not read byul.config.json file. Using default format."
    );
    return null;
  }
}

formatCommitMessage().catch((error) => {
  console.error(`${ANSI_COLORS.red}Unhandled promise rejection:${ANSI_COLORS.reset}`, error);
  process.exit(1);
});
