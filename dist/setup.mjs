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

    // 기존 설정을 유지하면서 새로운 설정 추가
    config = { ...defaultConfig, ...config };
    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  }
}

function setupCommitMsgHook() {
  const hookName = "prepare-commit-msg";
  const gitHookDir = path.join(rootDir, ".git", "hooks");
  const huskyHookDir = path.join(rootDir, ".husky");
  const lefthookHookDir = path.join(rootDir, ".lefthook");
  const byulhookHookDir = path.join(rootDir, ".byulhook");

  const hookDirs = [gitHookDir, huskyHookDir, lefthookHookDir, byulhookHookDir];

  for (const dir of hookDirs) {
    if (existsSync(dir)) {
      const hookFile = path.join(dir, hookName);
      let hookContent = '';

      if (existsSync(hookFile)) {
        hookContent = readFileSync(hookFile, 'utf8');
      }

      const byulCommand = 'node ./node_modules/byul/dist/index.js "$1"';

      if (!hookContent.includes(byulCommand)) {
        hookContent += `\n${byulCommand}\n`;
        writeFileSync(hookFile, hookContent, { mode: 0o755 });
      }

      if (process.platform === "win32") {
        execSync(`attrib -r +a "${hookFile}"`);
      } else {
        execSync(`chmod +x "${hookFile}"`);
      }
    }
  }
}

function setupByulConfig() {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const byulConfigPath = join(projectRoot, "byul.config.json");

  const defaultConfig = {
    "language": "한국어",
    "model": "gpt-4o-mini",
    "_comment_language": "English, 한국어, 日本語, 中文, Español, Français, Deutsch...",
    "_comment_model": "gpt-3.5-turbo, gpt-4, gpt-4-32k, gpt-4o, gpt-4o-mini, gpt-o1-mini, gpt-o1-preview...",
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