import { simpleGit, SimpleGit } from 'simple-git';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const chalk = await import('chalk');

const git: SimpleGit = simpleGit();

function getUserConfig(): { byulFormat: string } | null {
  try {
    const configPath = join(process.cwd(), 'byul.config.json');
    const configFile = readFileSync(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.warn('Warning: Could not read byul.config.json file. Using default format.');
    return null;
  }
}

async function formatCommitMessage(): Promise<void> {
  const startTime = Date.now();
  console.log();
  console.log(chalk.default.cyan('🔄 Starting byul - Developed by love1ace'));

  console.log(chalk.default.gray('[1/2] 🔍 Retrieving branch information...'));

  try {
    const branchInfo = await git.branch();
    const branchName = branchInfo.current;

    const commitMsgFile = process.env.HUSKY_GIT_PARAMS || process.argv[2];
    if (!commitMsgFile) {
      console.error(chalk.default.red('Error: No commit message file provided.'));
      return;
    }

    console.log(chalk.default.gray('[2/2] 📝 Formatting commit message...'));

    const commitMessage = readFileSync(commitMsgFile, 'utf8').trim();
    const formattedMessage = await getFormattedMessage(branchName, commitMessage);

    writeFileSync(commitMsgFile, formattedMessage);

    if (formattedMessage === commitMessage) {
      console.log(`${chalk.default.red('Failed!')} byul could not format the commit message.`);
    } else {
      console.log(`${chalk.default.green('Success!')} byul has formatted the commit message.`);
    }
  } catch (error) {
    console.error(chalk.default.red('Error formatting commit message:', error));
    process.exit(1);
  }

  console.log(chalk.default.blue(`✨ Done in ${(Date.now() - startTime) / 1000}s.`));
  console.log();
}

async function getFormattedMessage(branchName: string, commitMessage: string): Promise<string> {
  const [branchType] = branchName.split('/');
  const issueNumberMatch = branchName.match(/\d+/);
  const issueNumber = issueNumberMatch ? issueNumberMatch[0] : '';

  if (!branchName.includes('/')) {
    console.warn(chalk.default.yellow(`[2/2] ⚠️ The branch name "${branchName}" does not follow the required format (e.g., "type/issue"). Keeping the original commit message.`));
    return commitMessage;
  }

  if (branchName.match(/\d+[.-]\d+/)) {
    console.warn(chalk.default.yellow(`[2/2] ⚠️ Invalid issue number format detected in branch name "${branchName}". Keeping the original commit message.`));
    return commitMessage;
  }

  const userConfig = getUserConfig();
  let format = userConfig?.byulFormat || '{type}: {commitMessage} #{issueNumber}';

  format = format
    .replace('{type}', branchType)
    .replace('{issueNumber}', issueNumber)
    .replace('{commitMessage}', commitMessage);

  return format;
}

formatCommitMessage().catch(error => {
  console.error(chalk.default.red('Unhandled promise rejection:', error));
  process.exit(1);
});