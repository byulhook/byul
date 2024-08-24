# byul

**byul** is a tool that automatically formats Git commit messages based on branch names, ensuring consistent and meaningful commit history.

![npm](https://img.shields.io/npm/v/byul)
![license](https://img.shields.io/npm/l/byul)

## 1. 🚀 Installation

You can install **byul** using your preferred package manager:

### npm

```bash
npm install byul
```

### Yarn

```bash
yarn add byul
```

### Yarn Berry

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


## 2. ✨ Features

**byul** offers the following features:

- **Automatic Commit Message Formatting**: Based on your branch name, **byul** automatically formats commit messages to ensure consistency.
- **Integration with Husky**: Easily integrates with Husky to automate commit message formatting without additional setup.
- **Customizable**: Supports custom branch naming conventions.
- **Non-Disruptive**: If an existing `commit-msg` hook exists, **byul** appends its functionality, ensuring that your current workflow remains intact.

## 3. 🔧 Husky Integration

**byul** works seamlessly with [Husky](https://github.com/typicode/husky) to automate Git hook setup. After installation, Husky will automatically run **byul** during the commit process to format messages.

### SetupHooks.js

The Git hooks are set up through a `setupHooks.cjs` script that runs during the installation process. This script ensures that **byul** is correctly integrated into your project's workflow, even if you already have a `commit-msg` hook in place.

## 4. 🛠️ Recommended Branch Naming Conventions

To maximize the effectiveness of **byul**, it is recommended to use the following branch naming conventions:

- **type/issue**: For new features (e.g., `feature/123-login` or `feature/login-123 or feature/login123`)

**byul** will format commit messages based on these conventions by extracting the branch type and issue number (if present).

### Unsupported Branch Naming Conventions

Branch names that do not follow the recommended format may not work correctly with **byul**. Examples of unsupported naming conventions include:

- `release/release-1.0.2`
- `develop/develop3-132`

## 5. ⚙️ How It Works

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

```
feature: Add login logic #123
```

![img.png](img.png)

## 6. 🤝 Contributing

We welcome contributions to **byul**! Whether it's reporting a bug, suggesting an enhancement, or submitting a pull request, your input is valued.

### Steps to Contribute:

1. Fork the repository on GitHub.
2. Create a new branch from `main` (e.g., `git checkout -b feature/my-feature`).
3. Implement your changes.
4. Commit your changes following **byul**'s commit conventions.
5. Push your branch (`git push origin feature/my-feature`).
6. Open a pull request against the `main` branch.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For any questions, suggestions, or feedback, please contact [love1ace](mailto:lovelacedud@gmail.com).

## ❓ FAQ

### Why aren't my commit messages being formatted?

Ensure that your branch follows the recommended naming conventions (e.g., `feature/`, `bugfix/`). Also, make sure **byul** is properly installed and Husky is correctly set up in your project.

### How do I customize the branch naming conventions?

You can modify the branch naming conventions directly in the **byul** configuration. Check the documentation for more details.
