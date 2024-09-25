#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Taskl } from "taskl";
import { legacyFormatCommitMessage } from "./legacyFormatCommitMessage.js";
import { detectCommitMode } from "./detectCommitMode.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ANSI_COLORS = {
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m",
};
function getByulConfig() {
    try {
        const configPath = path.join(process.cwd(), "byul.config.json");
        const configFile = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configFile);
    }
    catch (error) {
        console.warn(`${ANSI_COLORS.yellow}Warning: Could not read byul.config.json file. Using default settings.${ANSI_COLORS.reset}`);
        return { language: "English", model: "gpt-4o-mini" };
    }
}
async function analyzeChanges(diff) {
    var _a, _b, _c;
    const prompt = fs.readFileSync(path.join(__dirname, "..", "dist/analyze_changes.txt"), "utf8");
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt.replace("${diff}", diff) }],
        max_tokens: 500,
        temperature: 0.5,
    });
    return ((_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || "";
}
async function extractIssueNumber(branchName) {
    var _a, _b, _c;
    const prompt = fs.readFileSync(path.join(__dirname, "..", "dist/extract_issue_number.txt"), "utf8");
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "user", content: prompt.replace("${branchName}", branchName) },
        ],
        max_tokens: 50,
        temperature: 0.3,
    });
    return ((_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || "";
}
async function generateInitialCommitMessage(summary, issueNumber, config) {
    var _a, _b, _c;
    const prompt = fs.readFileSync(path.join(__dirname, "..", "dist/generate_commit_msg.txt"), "utf8");
    const commitTypesString = Object.entries(config.commitTypes || {})
        .map(([type, description]) => `- ${type}: ${description}`)
        .join("\n");
    const filledPrompt = prompt
        .replace("${summary}", summary)
        .replace("${issueNumber}", issueNumber)
        .replace("${language}", config.language)
        .replace("${commitTypes}", commitTypesString);
    const response = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: filledPrompt }],
        max_tokens: 200,
        temperature: 0.6,
    });
    return ((_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || "";
}
async function generateCommitMessage(commitMsgFile) {
    var _a;
    let config;
    let changesSummary;
    let issueNumber;
    let commitMessage;
    const { mode } = detectCommitMode();
    if (mode === "amend" || mode === "squash" || mode === "merge") {
        console.log();
        console.log(`${ANSI_COLORS.red} byul does not work when 'SQUASH' or 'AMEND'...${ANSI_COLORS.reset}`);
        console.log();
        return;
    }
    config = getByulConfig();
    if (!config.commitTypes) {
        console.warn(`${ANSI_COLORS.yellow}Warning: No commit types defined in byul.config.json file.${ANSI_COLORS.reset}`);
    }
    if (!Boolean((_a = config.AI) !== null && _a !== void 0 ? _a : true)) {
        await legacyFormatCommitMessage();
        return;
    }
    const tasks = [
        {
            text: "Analyzing staged changes",
            run: async () => {
                const diff = await getDiffStream(":(exclude)node_modules");
                changesSummary = await analyzeChanges(diff);
            },
        },
        {
            text: "Extracting issue number",
            run: async () => {
                const branchName = await getBranchName();
                issueNumber = await extractIssueNumber(branchName);
            },
        },
        {
            text: "Generating commit message",
            run: async () => {
                commitMessage = await generateInitialCommitMessage(changesSummary, issueNumber, config);
            },
        },
        {
            text: "Updating commit message file",
            run: async () => {
                const existingMessage = fs.readFileSync(commitMsgFile, "utf8");
                const combinedMessage = `${commitMessage}\n\n# byul generated commit message. Modify as needed.\n\n${existingMessage}`;
                fs.writeFileSync(commitMsgFile, combinedMessage, "utf8");
            },
        },
    ];
    const options = {
        tasks: tasks,
        startMessage: "🔄 Starting byul - Developed by love1ace",
        successMessage: "byul has generated the commit message.",
        failedMessage: "byul encountered an error while generating the commit message.",
    };
    const taskl = new Taskl(options);
    if (mode === "message") {
        console.log(`${ANSI_COLORS.red} byul does not work with the '-m' flag. Use 'git commit' without '-m'. ${ANSI_COLORS.reset}`);
    }
    else {
        await taskl.runTasks();
    }
}
function getDiffStream(excludePattern = "") {
    return new Promise((resolve, reject) => {
        const git = spawn("git", ["diff", "--cached", excludePattern]);
        let diff = "";
        git.stdout.on("data", (data) => {
            diff += data.toString();
        });
        git.stderr.on("data", (data) => {
            console.error(`Git error: ${data}`);
        });
        git.on("close", (code) => {
            if (code === 0) {
                resolve(diff);
            }
            else {
                reject(new Error(`Git process exited with code ${code}`));
            }
        });
    });
}
function getBranchName() {
    return new Promise((resolve, reject) => {
        const git = spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
        let branchName = "";
        git.stdout.on("data", (data) => {
            branchName += data.toString().trim();
        });
        git.on("close", (code) => {
            if (code === 0) {
                resolve(branchName);
            }
            else {
                reject(new Error(`Git process exited with code ${code}`));
            }
        });
    });
}
const commitMsgFile = process.argv[2];
if (commitMsgFile) {
    generateCommitMessage(commitMsgFile);
}
else {
    console.error(`${ANSI_COLORS.red}❌ Error: Commit message file path not provided.${ANSI_COLORS.reset}`);
}
