# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of MLForm seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do NOT

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### Please DO

1. **Email us directly** at: <pablo.ulloa.santin@udc.es>
2. **Include the following information**:
   - Type of vulnerability
   - Full paths of source file(s) related to the manifestation of the vulnerability
   - The location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will keep you informed about the progress of the fix
- **Timeline**: We aim to address critical vulnerabilities within 30 days
- **Credit**: With your permission, we will publicly acknowledge your responsible disclosure

## Security Best Practices

When using MLForm, we recommend:

### Dependency Management

- Keep dependencies up to date
- Use `npm install --frozen-lockfile` (or your package manager equivalent) to ensure consistent versions
- Monitor security advisories for `lit` and `zod`

## Security Considerations

### Data Processing

MLForm processes descriptor definitions to render forms. It:

- **Does** send data over the network
- **Does not** persist data to disk
- **Does not** execute arbitrary code from descriptor contents

### Type Safety

MLForm relies on TypeScript and Zod for validation, which provide:

- Compile-time type checking (TypeScript)
- Runtime validation for descriptors (Zod)
- Clear errors when descriptor data is invalid

### Known Limitations

- MLForm assumes descriptors originate from trusted sources
- Field metadata is rendered as provided; sanitize inputs upstream
- Extremely large descriptors may impact rendering performance

## Vulnerability Disclosure Policy

We follow a **coordinated disclosure** approach:

1. **Report received**: Security team acknowledges the report
2. **Verification**: We verify and assess the vulnerability
3. **Fix development**: We develop and test a fix
4. **Release**: We release a security patch
5. **Public disclosure**: After the patch is released, we publish details

### Timeline

- **T+0**: Vulnerability reported
- **T+2 days**: Acknowledgment sent
- **T+7 days**: Assessment completed
- **T+30 days**: Fix released (for critical issues)
- **T+45 days**: Public disclosure

## Security Updates

Security updates are announced via:

- GitHub Security Advisories: <https://github.com/UlloaSP/mlform/security/advisories>
- Release notes: <https://github.com/UlloaSP/mlform/releases>
- Changelog: [docs/changelog.md](docs/changelog.md)

## Dependency Security

MLForm depends on:

### Runtime Dependencies

- **lit** (3.3.1): Actively maintained, web component security best practices
- **zod** (4.1.12): Robust runtime validation, actively maintained

### Monitoring

We monitor security advisories for all dependencies using:

- GitHub Dependabot alerts
- npm advisory database
- Direct monitoring of upstream projects

### Updating Dependencies

We aim to:

- Update dependencies within 7 days of security releases
- Test updates thoroughly before releasing
- Maintain compatibility with supported Node.js versions

## Secure Development Practices

Our development process includes:

- **Code Review**: All changes reviewed before merging
- **Automated Testing**: Vitest suite and coverage reporting
- **Static Analysis**: TypeScript type checks and Biome linting
- **Pre-release Builds**: Vite build verification for every release
- **Continuous Integration**: Automated checks on all pull requests

## Security Checklist for Contributors

When contributing code:

- [ ] Validate inputs for all public APIs
- [ ] Avoid dynamic code execution
- [ ] Do not introduce file system access (unless required and reviewed)
- [ ] Avoid network requests from core packages
- [ ] Maintain TypeScript type coverage
- [ ] Add tests covering security-relevant scenarios
- [ ] Document any new security considerations

## Contact

For security concerns:

- **Email**: <pablo.ulloa.santin@udc.es>
- **Subject**: `[SECURITY] MLForm Vulnerability Report`

For general questions:

- **Issues**: <https://github.com/UlloaSP/mlform/issues>
- **Discussions**: <https://github.com/UlloaSP/mlform/discussions>

## Attribution

We appreciate responsible security researchers who help keep MLForm safe. With your permission, we will:

- Credit you in the security advisory
- Add your name to our hall of fame (if you wish)
- Provide a reference for your responsible disclosure

Thank you for helping keep MLForm and its users safe! 🔒

---

**Last Updated**: October 29, 2025
