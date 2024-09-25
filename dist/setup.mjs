import { execSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findGitOrHuskyDir(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (existsSync(path.join(currentDir, ".git"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

const rootDir = findGitOrHuskyDir(__dirname);
if (!rootDir) {
  console.error("Error: .git directory not found. Please run this script inside a Git repository.");
  process.exit(1);
}

function writeConfigFile(filePath, defaultConfig) {
  try {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    } else {
      const configFile = readFileSync(filePath, "utf8");
      let config = configFile.trim() ? JSON.parse(configFile) : {};

      config = { ...defaultConfig, ...config };
      writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    }
  } catch (error) {
    console.error(`Failed to write config file at ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

function setupCommitMsgHook() {
  const hookName = "prepare-commit-msg";
  const gitHookDir = path.join(rootDir, ".git", "hooks");
  const hookFile = path.join(gitHookDir, hookName);

  try {
    let existingHook = '';
    if (existsSync(hookFile)) {
      existingHook = readFileSync(hookFile, 'utf8');
    }

    const byulCommand = `node ${path.join(rootDir, 'node_modules', 'byul', 'dist', 'index.js')} "$1" "$2" "$3"`;
    let newHookContent = '#!/bin/sh\n\n';

    if (existingHook && !existingHook.includes(byulCommand)) {
      newHookContent += existingHook + '\n';
    }

    newHookContent += byulCommand + '\n';

    writeFileSync(hookFile, newHookContent, { mode: 0o755 });

    if (process.platform !== "win32") {
      execSync(`chmod +x "${hookFile}"`);
    }
  } catch (error) {
    console.error(`Failed to set up the commit message hook: ${error.message}`);
    process.exit(1);
  }
}

function setupByulConfig() {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const byulConfigPath = join(projectRoot, "byul.config.json");

  const defaultConfig = {
    "byulFormat": "{type}: {commitMessage} (#{issueNumber})",
  
    "AI": true,
  
    "language": "English",
    "model": "gpt-4o-mini",

    "commitTypes": {
      "feat": "Feature (new feature)",
      "fix": "Bug fix (bug fix)",
      "refactor": "Refactoring",
      "style": "Code style (code formatting, whitespace, comments, semicolons: no changes to business logic)",
      "docs": "Documentation (add, modify, delete docs, README)",
      "test": "Tests (add, modify, delete test code: no changes to business logic)",
      "settings": "Project settings",
      "chore": "Miscellaneous changes like package manager mods, e.g., .gitignore",
      "init": "Initial creation",
      "rename": "Rename or move files/folders only",
      "remove": "Delete files only",
      "design": "UI/UX design changes like CSS",
      "release": "Deployment or release, e.g., release/login-123"
    }
    
  };

  writeConfigFile(byulConfigPath, defaultConfig);
}

setupByulConfig();
setupCommitMsgHook();