import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync, spawnSync } from "child_process";
import { Taskl, Task, TasklOptions } from "taskl";

const ANSI_COLORS = {
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

async function legacyFormatCommitMessage(): Promise<void> {
  let branchName: string;
  let commitMsgFile: string;
  let commitMessage: string;
  let formattedMessage: string;

  const tasks: Task[] = [
    {
      text: "Retrieving branch information",
      run: async () => {
        branchName = execSync("git rev-parse --abbrev-ref HEAD")
          .toString()
          .trim();
      },
    },
    {
      text: "Getting commit message file",
      run: async () => {
        commitMsgFile = process.env.HUSKY_GIT_PARAMS || process.argv[2];
        if (!commitMsgFile) {
          throw new Error("No commit message file provided.");
        }
      },
    },
    {
      text: "Reading commit message",
      run: async () => {
        commitMessage = readFileSync(commitMsgFile, "utf8");
      },
    },
    {
      text: "Formatting commit message",
      run: async () => {
        const lines = ["", ...commitMessage.split("\n")];
        const title = lines[0] || "";
        const body = lines.slice(1).join("\n");
        const formattedTitle = await formatTitle(branchName, title);
        formattedMessage = [formattedTitle, body].filter(Boolean).join("\n\n");
      },
    },
    {
      text: "Writing formatted commit message",
      run: async () => {
        writeFileSync(commitMsgFile, formattedMessage);
      },
    },
  ];

  const options: TasklOptions = {
    tasks: tasks,
    startMessage: "🔄 Starting byul - Developed by love1ace",
    successMessage:
      "byul has formatted the commit message and opened the editor for final editing.",
    failedMessage:
      "byul encountered an error while processing the commit message.",
  };

  const taskl = new Taskl(options);
  await taskl.runTasks();
}

async function formatTitle(branchName: string, title: string): Promise<string> {
  let branchType = "";
  let issueNumber = "";

  if (!branchName.includes("/")) {
    console.warn(
      `${ANSI_COLORS.yellow}[2/2] ⚠️ The branch name "${branchName}" does not follow the required format. Keeping the original commit message.${ANSI_COLORS.reset}`
    );
    return title;
  }

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

export { legacyFormatCommitMessage };
