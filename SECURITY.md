# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Stellar Connect Wallet seriously. If you discover a security vulnerability, please follow these steps:

### Private Reporting

**Please do not open public issues for security vulnerabilities.**

Instead, report them by:

1. **Email**: Send details to janvisinghal10@gmail.com 
2. **GitHub Private Vulnerability Reporting**: Use the [Security Advisories](https://github.com/your-org/stellar-connect-wallet/security/advisories) feature

### What to Include

When reporting a vulnerability, please provide:

- Type of issue (e.g., buffer overflow, SQL injection, XSS, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Response**: We will provide an initial response within 5 business days
- **Resolution**: We aim to resolve critical issues within 30 days

### Process

1. **Submit**: Report the vulnerability privately
2. **Acknowledge**: We confirm receipt and assign a security engineer
3. **Assess**: We evaluate the report and determine severity
4. **Fix**: We develop and test a fix
5. **Release**: We publish a security update
6. **Disclose**: After 30 days, we publicly disclose the issue (with your permission)

## Security Best Practices

If you're contributing to the project, please follow these security guidelines:

- Never commit sensitive information (API keys, passwords, etc.)
- Validate and sanitize all user inputs
- Use prepared statements for database queries
- Keep dependencies up to date
- Follow the principle of least privilege
- Implement proper authentication and authorization checks

## Recognition

We appreciate responsible disclosure and will acknowledge contributors who report valid security issues (unless you prefer to remain anonymous).

Thank you for helping keep Stellar Connect Wallet secure!
