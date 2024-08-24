import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findGitOrHuskyDir(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, ".git")) || fs.existsSync(path.join(currentDir, ".husky"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
}

const rootDir = findGitOrHuskyDir(__dirname);

function setupCommitMsgHook() {
  const hookName = "commit-msg";
  const gitHookFile = path.join(rootDir, ".git", "hooks", hookName);
  const huskyHookFile = path.join(rootDir, ".husky", hookName);

  const useHusky = fs.existsSync(path.join(rootDir, ".husky"));

  const hookFile = useHusky ? huskyHookFile : gitHookFile;

  const startMarker = "# byulFormat";
  const endMarker = "# byulFormat";

  let existingHookContent = "";
  if (fs.existsSync(hookFile)) {
    const content = fs.readFileSync(hookFile, "utf8");
    if (content.includes('node ./node_modules/byul/dist/index.js "$1"')) {
      console.log("byul settings already exists.");
      return;
    }
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    existingHookContent = content.replace(regex, "").trim();
  }

  let byulHookScript;

  if (useHusky) {
    byulHookScript = `
${startMarker}
node ./node_modules/byul/dist/index.js "$1"
${endMarker}
`;
  } else {
    byulHookScript = `
${startMarker}
COMMIT_MSG_FILE="$1"
BRANCH_NAME=$(git symbolic-ref --short HEAD)
node .node_modules/byul/dist/index.js "$COMMIT_MSG_FILE" "$BRANCH_NAME"
${endMarker}
`;
  }

  let finalHookScript;

  if (useHusky) {
    finalHookScript = `${byulHookScript}

# Existing hook content
${existingHookContent}`;
  } else {
    finalHookScript = `#!/bin/sh

${byulHookScript}

# Existing hook content
${existingHookContent}`;
  }

  fs.writeFileSync(hookFile, finalHookScript, { mode: 0o755 });

  console.log("byul settings successfully");

  if (process.platform === "win32") {
    execSync(`attrib -r +a "${hookFile}"`);
  } else {
    execSync(`chmod +x "${hookFile}"`);
  }
}

function setupByulConfig() {
  const byulConfigPath = path.join(rootDir, "byul.config.json");

  if (!fs.existsSync(byulConfigPath)) {
    const byulConfig = {
      byulFormat: "{type}: {commitMessage} (#{issueNumber})",
    };
    fs.writeFileSync(byulConfigPath, JSON.stringify(byulConfig, null, 2));
    console.log("byul.config.json file created successfully");
  } else {
    const configFile = fs.readFileSync(byulConfigPath, "utf8");
    let config = {};

    if (configFile.trim()) {
      config = JSON.parse(configFile);
    }

    if (!config.hasOwnProperty('byulFormat')) {
      config.byulFormat = "{type}: {commitMessage} (#{issueNumber})";
      fs.writeFileSync(byulConfigPath, JSON.stringify(config, null, 2));
      console.log("byulFormat added to existing byul.config.json file");
    } else {
      console.log("byulFormat already exists in byul.config.json file");
    }
  }
}

setupCommitMsgHook();
setupByulConfig();