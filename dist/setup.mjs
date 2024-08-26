import { execSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findGitOrHuskyDir(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (existsSync(path.join(currentDir, ".git")) || existsSync(path.join(currentDir, ".husky")) || existsSync(path.join(currentDir, "lefthook.yml")) || existsSync(path.join(currentDir, "byulhook.yml"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
}

const rootDir = findGitOrHuskyDir(__dirname);

function writeConfigFile(filePath, defaultConfig) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  } else {
    const configFile = readFileSync(filePath, "utf8");
    let config = configFile.trim() ? JSON.parse(configFile) : {};

    if (!config.hasOwnProperty('byulFormat')) {
      config.byulFormat = defaultConfig.byulFormat;
      writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    }
  }
}

function setupCommitMsgHook() {
  const hookName = "commit-msg";
  const gitHookFile = path.join(rootDir, ".git", "hooks", hookName);
  const huskyHookFile = path.join(rootDir, ".husky", hookName);
  const lefthookConfigFile = path.join(rootDir, "lefthook.yml");
  const byulhookConfigFile = path.join(rootDir, "byulhook.yml");

  const useHusky = existsSync(path.join(rootDir, ".husky"));
  const useLefthook = existsSync(lefthookConfigFile);
  const useByulhook = existsSync(byulhookConfigFile);

  let hookFile;

  if (useHusky) {
    hookFile = huskyHookFile;
    const byulHookScript = `
# byulFormat
node ./node_modules/byul/dist/index.js "$1"
# byulFormat
`;
    writeFileSync(hookFile, byulHookScript, { mode: 0o755 });
  } else if (useLefthook) {
    hookFile = lefthookConfigFile;
    const lefthookConfig = readFileSync(lefthookConfigFile, "utf8");
    const lefthookScript = `
commit-msg:
  commands:
    byul:
      run: "node ./node_modules/byul/dist/index.js .git/COMMIT_EDITMSG"
`;
    if (!lefthookConfig.includes('node ./node_modules/byul/dist/index.js .git/COMMIT_EDITMSG')) {
      writeFileSync(lefthookConfigFile, lefthookScript, { flag: 'a' });
    }
  } else if (useByulhook) {
    hookFile = byulhookConfigFile;
    const byulhookConfig = readFileSync(byulhookConfigFile, "utf8");
    const byulhookScript = `
commit-msg:
  commands:
    byul:
      run: "node ./node_modules/byul/dist/index.js .git/COMMIT_EDITMSG"
`;
    if (!byulhookConfig.includes('node ./node_modules/byul/dist/index.js .git/COMMIT_EDITMSG')) {
      writeFileSync(byulhookConfigFile, byulhookScript, { flag: 'a' });
    }
  } else {
    hookFile = gitHookFile;
    const byulHookScript = `
# byulFormat
COMMIT_MSG_FILE="$1"
BRANCH_NAME=$(git symbolic-ref --short HEAD)
node .node_modules/byul/dist/index.js "$COMMIT_MSG_FILE" "$BRANCH_NAME"
# byulFormat
`;

    writeFileSync(hookFile, `#!/bin/sh\n\n${byulHookScript}\n`, { mode: 0o755 });
  }


  if (process.platform === "win32") {
    execSync(`attrib -r +a "${hookFile}"`);
  } else {
    execSync(`chmod +x "${hookFile}"`);
  }
}

function setupByulConfig() {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const byulConfigPath = join(projectRoot, "byul.config.json");

  const defaultConfig = {
    byulFormat: "{type}: {commitMessage} (#{issueNumber})",
  };

  writeConfigFile(byulConfigPath, defaultConfig);
}

setupByulConfig();
setupCommitMsgHook();