import { simpleGit } from "simple-git";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
const chalk = await import("chalk");
const git = simpleGit();
async function formatCommitMessage() {
    const startTime = Date.now();
    console.log();
    console.log(chalk.default.cyan("🔄 Starting byul - Developed by love1ace"));
    console.log(chalk.default.gray("[1/2] 🔍 Retrieving branch information..."));
    try {
        const branchInfo = await git.branch();
        const branchName = branchInfo.current;
        const commitMsgFile = process.env.HUSKY_GIT_PARAMS || process.argv[2];
        if (!commitMsgFile) {
            console.error(chalk.default.red("Error: No commit message file provided."));
            return;
        }
        console.log(chalk.default.gray("[2/2] 📝 Formatting commit message..."));
        const commitMessage = readFileSync(commitMsgFile, "utf8");
        const lines = commitMessage
            .split("\n")
            .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
        if (lines.length === 0) {
            console.error(chalk.default.red("Error: The commit message is empty after removing comments and empty lines."));
            return;
        }
        const title = lines[0];
        const body = lines.slice(1).join("\n");
        const formattedTitle = await formatTitle(branchName, title);
        const formattedMessage = [formattedTitle, body]
            .filter(Boolean)
            .join("\n\n");
        writeFileSync(commitMsgFile, formattedMessage);
        console.log(`${chalk.default.green("Success!")} byul has formatted the commit message.`);
    }
    catch (error) {
        console.error(chalk.default.red("Error formatting commit message:", error));
        process.exit(1);
    }
    console.log(chalk.default.blue(`✨ Done in ${(Date.now() - startTime) / 1000}s.`));
    console.log();
}
async function formatTitle(branchName, title) {
    const [branchType] = branchName.split("/");
    const issueNumberMatch = branchName.match(/\d+/);
    const issueNumber = issueNumberMatch ? issueNumberMatch[0] : "";
    if (!branchName.includes("/")) {
        console.warn(chalk.default.yellow(`[2/2] ⚠️ The branch name "${branchName}" does not follow the required format (e.g., "type/issue"). Keeping the original commit message.`));
        return title;
    }
    if (branchName.match(/\d+[.-]\d+/)) {
        console.warn(chalk.default.yellow(`[2/2] ⚠️ Invalid issue number format detected in branch name "${branchName}". Keeping the original commit message.`));
        return title;
    }
    const userConfig = getUserConfig();
    let format = (userConfig === null || userConfig === void 0 ? void 0 : userConfig.byulFormat) || "{type}: {commitMessage} #{issueNumber}";
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
formatCommitMessage().catch((error) => {
    console.error(chalk.default.red("Unhandled promise rejection:", error));
    process.exit(1);
});
