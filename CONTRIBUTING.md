# Contributing to Stellar Connect Wallet

Thank you for your interest in contributing to Stellar Connect Wallet! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a welcoming and inclusive community.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node.js version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- A clear description of the feature
- Use cases and benefits
- Any relevant examples or mockups

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Create an issue** describing your changes if it's a significant update
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/stellar-connect-wallet.git

# Navigate to project
cd stellar-connect-wallet/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Coding Standards

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure your code passes linting checks
- Write tests for new features when applicable

### Commit Messages

- Use clear and descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issues when applicable

Example:
```
Add multi-signature wallet support
Fix transaction history display issue
Update documentation for API endpoints
```

## License

By contributing, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE.md).

## Questions?

Feel free to open an issue for any questions or clarifications.
