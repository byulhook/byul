# byul

**byul** is a tool that automatically formats Git commit messages based on branch names

![npm](https://img.shields.io/npm/v/byul)
![license](https://img.shields.io/npm/l/byul)

## Installation

You can install **byul** using your preferred package manager:

### npm

```bash
npm install byul
```

### Yarn

```bash
yarn add byul
```

### pnpm

```bash
pnpm add byul
```

### Bun

```bash
bun add byul
```

## Setup error
If the `byul.config.json` file hasn’t been created, run:
```bash
node node_modules/byul/dist/setup.mjs
```
Or, you can manually create the `byul.config.json` file and add this code:

```json
{
"byulFormat": "{type}: {commitMessage} (#{issueNumber})"
}
```

## Features

**byul** offers the following features:

- **Automatic Commit Message Formatting**: Based on your branch name, **byul** automatically formats commit messages to ensure consistency.
- **Integration with git hooks**: Easily integrates with byulhook, lefthook, Husky to automate commit message formatting without additional setup.
- **Customizable**: Supports custom branch naming conventions.
- **Non-Disruptive**: If an existing `commit-msg` hook exists, **byul** appends its functionality, ensuring that your current workflow remains intact.

## Recommended Branch Naming Conventions

To maximize the effectiveness of **byul**, it is recommended to use the following branch naming conventions:

- **type/issue**: For new features (e.g., `feature/123-login` or `feature/login-123 or feature/login123`)

**byul** will format commit messages based on these conventions by extracting the branch type and issue number (if present).

### Unsupported Branch Naming Conventions

Branch names that do not follow the recommended format may not work correctly with **byul**. Examples of unsupported naming conventions include:

- `release/release-1.0.2`
- `develop/develop3-132`

## How It Works

When you commit changes using Git, **byul** automatically formats the commit message by following these steps:

1. **Branch Name Retrieval**: **byul** retrieves the current branch name.
2. **Commit Message Formatting**: The commit message is prefixed with the branch type (e.g., `feature:`) and suffixed with the issue number (if available).
3. **Integration with Existing Hooks**: If there is an existing `commit-msg` hook, **byul** appends its functionality, ensuring non-disruptive integration.

### Example

Given the branch `feature/login-123`, and you commit with:

```bash
git commit -m "Add login logic"
```

**byul** will automatically format the message to:

```
feature: Add login logic #123
```

### Customization

You can customize the commit message format by modifying the `byul.config.json` file. For example, with the following configuration:

```json
{
  "byulFormat": "#{issueNumber} {commitMessage} ({type})"
}
```

Given the same branch `feature/login-123` and commit message:

```bash
git commit -m "Add login logic"
```

The commit message will be formatted as:

```
#123 Add login logic (feature)
```

This flexibility allows you to define a format that best suits your project's needs.

![img.png](img.png)

## Contributing

We welcome contributions to **byulhook**! Whether it's reporting a bug, suggesting an enhancement, or submitting a pull request, your input is valued.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions, suggestions, or feedback, please contact [love1ace](mailto:lovelacedud@gmail.com).
