import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { Taskl } from "taskl";
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
async function legacyFormatCommitMessage() {
    let branchName;
    let commitMsgFile;
    let commitMessage;
    let formattedMessage;
    const commitMode = detectCommitMode();
    const tasks = [
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
                const lines = commitMessage.split("\n");
                const title = lines[0] || "";
                const body = lines.slice(1).join("\n");
                const formattedTitle = await formatTitle(branchName, title, commitMode.mode);
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
    const options = {
        tasks: tasks,
        startMessage: "🔄 Starting byul - Developed by love1ace",
        successMessage: "byul has formatted the commit message.",
        failedMessage: "byul encountered an error while processing the commit message.",
    };
    if (commitMode.mode === "message") {
        console.log(`${ANSI_COLORS.cyan}ℹ️ Commit message mode detected. Formatting will be applied after message is written.${ANSI_COLORS.reset}`);
        await new Taskl(options).runTasks();
    }
    else {
        await new Taskl(options).runTasks();
    }
}
async function formatTitle(branchName, title, commitMode) {
    let branchType = "";
    let issueNumber = "";
    if (!branchName.includes("/")) {
        console.warn(`${ANSI_COLORS.yellow}[2/2] ⚠️ The branch name "${branchName}" does not follow the required format. Keeping the original commit message.${ANSI_COLORS.reset}`);
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
        console.warn(`${ANSI_COLORS.yellow}[2/2] ⚠️ The branch name "${branchName}" does not follow the required format. Keeping the original commit message.${ANSI_COLORS.reset}`);
        return title;
    }
    const userConfig = getUserConfig();
    let format = (userConfig === null || userConfig === void 0 ? void 0 : userConfig.byulFormat) || "{type}: {commitMessage} #{issueNumber}";
    console.log("commitMode: ", commitMode);
    console.log("!isValidNumber(issueNumber))", !isValidNumber(issueNumber));
    console.log("issueNumber", issueNumber);
    // TODO: commitMode가 message이고, issueNuber가 없는 경우 이슈 번호를 추출하지 않도록 수정.
    if (commitMode === "message" && !isValidNumber(issueNumber)) {
        console.log("format", format);
        console.log("issueNumber", issueNumber);
        console.log("!issueNumber", !issueNumber);
        format = format.replace(" #{issueNumber}", "");
        console.log("format", format);
    }
    format = format
        .replace("{type}", branchType)
        .replace("{issueNumber}", issueNumber)
        .replace("{commitMessage}", title);
    return format;
}
function getUserConfig() {
    try {
        const configPath = join(process.cwd(), "byul.config.json");
        const configFile = readFileSync(configPath, "utf8");
        return JSON.parse(configFile);
    }
    catch (error) {
        console.warn("Warning: Could not read byul.config.json file. Using default format.");
        return null;
    }
}
export { legacyFormatCommitMessage };
