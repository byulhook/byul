import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync, spawnSync } from "child_process";
import { Taskl, Task, TasklOptions } from "taskl";
import { detectCommitMode } from "./detectCommitMode.js";
import { isValidNumber } from "./isValidNumber.js";

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

  const { mode } = detectCommitMode();
  if (mode === "amend" || mode === "squash" || mode === "merge") {
    console.log(
      "Skipping commit message generation for amend, squash, or merge commits."
    );
    return;
  }

  const tasks: Task[] = [
    {
      text: "Formatting commit message",
      run: async () => {
        branchName = execSync("git rev-parse --abbrev-ref HEAD")
          .toString()
          .trim();

        commitMsgFile = process.env.HUSKY_GIT_PARAMS || process.argv[2];
        if (!commitMsgFile) {
          throw new Error("No commit message file provided.");
        }

        commitMessage = readFileSync(commitMsgFile, "utf8");

        const lines = commitMessage.split("\n");
        let title = "";
        let bodyStartIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].startsWith("#") && lines[i].trim() !== "") {
            title = lines[i];
            bodyStartIndex = i + 1;
            break;
          }
        }
        const formattedTitle = await formatTitle(branchName, title, mode);
        const formattedLines = [formattedTitle, ...lines.slice(bodyStartIndex)];

        formattedMessage = formattedLines.join("\n");
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
    successMessage: "byul has formatted the commit message.",
    failedMessage:
      "byul encountered an error while processing the commit message.",
  };

  await new Taskl(options).runTasks();
}

async function formatTitle(
  branchName: string,
  title: string,
  commitMode?: String
): Promise<string> {
  let branchType = "";
  let issueNumber = "";

  if (!branchName.includes("/")) {
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
    return title;
  }

  const userConfig = getUserConfig();

  let format =
    userConfig?.byulFormat || "{type}: {commitMessage} #{issueNumber}";

  if (commitMode === "message" && !isValidNumber(issueNumber)) {
    const regex = /(\[?#\{issueNumber\}\]?|\(#\{issueNumber\}\))/g;
    format = format.replace(regex, "");

    format = format.replace(/\s+/g, " ").trim();
  }

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
