import { execSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path, { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findGitDir(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (existsSync(path.join(currentDir, ".git"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

const rootDir = findGitDir(__dirname);
if (!rootDir) {
  console.error(
    "Error: .git directory not found. Please run this script inside a Git repository."
  );
  process.exit(1);
}

function getHooksPath(gitDir) {
  const configPath = path.join(gitDir, ".git", "config");
  if (!existsSync(configPath)) {
    return path.join(gitDir, ".git", "hooks");
  }

  const configContent = readFileSync(configPath, "utf8");
  const hooksPathMatch = configContent.match(/^\s*hooksPath\s*=\s*(.+)$/m);

  if (hooksPathMatch) {
    const hooksPath = hooksPathMatch[1].trim();
    if (!path.isAbsolute(hooksPath)) {
      return path.resolve(gitDir, hooksPath);
    }
    return hooksPath;
  }

  return path.join(gitDir, ".git", "hooks");
}

const gitHookDir = getHooksPath(rootDir);

function isHuskyInstalled() {
  try {
    const packageJsonPath = path.join(rootDir, "package.json");
    if (!existsSync(packageJsonPath)) return false;
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    return "husky" in deps || "husky" in devDeps;
  } catch {
    return false;
  }
}

function writeConfigFile(filePath, defaultConfig) {
  try {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), "utf8");
    } else {
      const configFile = readFileSync(filePath, "utf8");
      let config = configFile.trim() ? JSON.parse(configFile) : {};

      config = { ...defaultConfig, ...config };
      writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
    }
  } catch (error) {
    console.error(
      `Failed to write config file at ${filePath}: ${error.message}`
    );
    process.exit(1);
  }
}

function readByulHookFile() {
  const possiblePaths = [
    path.join(rootDir, "node_modules", "byul", "dist", "byul_script"),
    path.join(rootDir, "dist", "byul_script"),
  ];
  for (const byulHookFile of possiblePaths) {
    if (existsSync(byulHookFile)) {
      return readFileSync(byulHookFile, "utf8");
    }
  }

  throw new Error("Unable to find byul_script file.");
}

function setupCommitMsgHook() {
  const hookName = "prepare-commit-msg";
  const hookFile = path.join(gitHookDir, hookName);
  const SHEBANG = "#!/bin/sh";
  try {
    const byulHookContent = readByulHookFile();

    if (isHuskyInstalled()) {
      const huskyHookPath = path.join(rootDir, ".husky", hookName);
      let existingHuskyHook = "";
      if (existsSync(huskyHookPath)) {
        existingHuskyHook = readFileSync(huskyHookPath, "utf8");
      }

      const hasByulCommand = existingHuskyHook.includes(byulHookContent.trim());

      if (!hasByulCommand) {
        execSync(`echo '${byulHookContent}' >> .husky/${hookName}`);
      }
    } else {
      let existingHook = "";
      if (existsSync(hookFile)) {
        existingHook = readFileSync(hookFile, "utf8");
      }

      let newHookContent = "";

      if (existingHook) {
        const lines = existingHook.split("\n");
        const hasShebang = lines[0].startsWith(SHEBANG);
        const hasByulCommand = existingHook.includes(byulHookContent.trim());

        if (!hasShebang) {
          newHookContent += SHEBANG + "\n";
        } else {
          newHookContent += lines[0] + "\n";
        }

        const hookBody = lines.slice(hasShebang ? 1 : 0).join("\n");
        newHookContent += hookBody.trim() ? hookBody + "\n" : "";

        if (!hasByulCommand) {
          newHookContent += "\n" + byulHookContent + "\n";
        }
      } else {
        newHookContent = `${SHEBANG}\n\n${byulHookContent}\n`;
      }

      writeFileSync(hookFile, newHookContent, { mode: 0o755 });

      if (process.platform !== "win32") {
        execSync(`chmod +x "${hookFile}"`);
      }
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
    byulFormat: "{type}: {commitMessage} (#{issueNumber})",
    AI: true,
    language: "English",
    model: "gpt-4o-mini",
    commitTypes: {
      feat: "Feature (new feature)",
      fix: "Bug fix (bug fix)",
      refactor: "Refactoring",
      style:
        "Code style (code formatting, whitespace, comments, semicolons: no changes to business logic)",
      docs: "Documentation (add, modify, delete docs, README)",
      test: "Tests (add, modify, delete test code: no changes to business logic)",
      settings: "Project settings",
      chore:
        "Miscellaneous changes like package manager mods, e.g., .gitignore",
      init: "Initial creation",
      rename: "Rename or move files/folders only",
      remove: "Delete files only",
      design: "UI/UX design changes like CSS",
      release: "Deployment or release, e.g., release/login-123",
    },
  };

  writeConfigFile(byulConfigPath, defaultConfig);
}

setupByulConfig();
setupCommitMsgHook();
