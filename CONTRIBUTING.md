# Contributing to MLForm

Thank you for considering a contribution to MLForm!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Security Reports](#security-reports)
- [License](#license)

## Code of Conduct

This project adheres to a code of conduct. By participating, you agree to uphold this code and to keep all interactions respectful, inclusive, and constructive.

### Our Standards

- Be respectful: treat everyone with kindness
- Be collaborative: work together toward shared goals
- Be inclusive: welcome different perspectives
- Be professional: keep discussions focused on the work

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:

   ```bash
   git clone https://github.com/<your-username>/mlform.git
   cd mlform
   ```

3. Add the upstream remote:

   ```bash
   git remote add upstream https://github.com/UlloaSP/mlform.git
   ```

4. Create a topic branch for your work:

   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

MLForm is built with TypeScript, Vite+, and Lit. We use `vp` for dependency management, checks, tests, and builds.

### Prerequisites

- Node.js 24.9.0 or newer
- `vp`
- Git

### Installation

1. Install dependencies:

   ```bash
   vp install
   ```

2. Run the test suite once to verify the environment:

   ```bash
   vp test
   ```

3. (Optional) Enable editor integrations for Oxc, TypeScript, and Vite+ tooling.

### Useful Commands

- `vp check` — format, lint, and TypeScript checks
- `vp run typecheck` — explicit TypeScript type check
- `vp test` — Vitest watch mode
- `vp test run` — Vitest single-run mode
- `vp run coverage` — Vitest coverage report
- `vp build` — production build

## Project Structure

```text
mlform/
├── src/                   # Library source code
│   ├── core/              # Core application, domain, and UI primitives
│   ├── extensions/        # Extension strategies and adapters
│   ├── mlform/            # Public entry points and types
│   └── strategies/        # Strategy registration and helpers
├── test/                  # Vitest unit tests and fixtures
│   ├── _fixtures/         # Shared test fixtures
│   └── unit/              # Unit test suites
├── docs/                  # Documentation site (Docusaurus)
├── coverage/              # Test coverage artifacts (generated)
├── stats/                 # Build statistics (generated)
└── package.json           # npm configuration
```

When in doubt, follow existing patterns in the relevant directory.

## Making Changes

### Branch Naming

Use descriptive prefixes to clarify intent:

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation updates
- `refactor/` — refactoring without behavior changes
- `test/` — test-only updates
- `chore/` — build, tooling, or maintenance tasks

Examples: `feature/add-date-field-strategy`, `fix/descriptor-registry-duplicates`.

### Commit Messages

Follow the Conventional Commits format:

```text
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Keep the scope small (e.g., `core`, `extensions`, `docs`).

## Testing

All changes must be covered by automated tests.

```bash
# Run all unit tests
vp test run

# Run in watch mode during development
vp test

# Generate coverage reports (stored in coverage/)
vp run coverage
```

### Test Expectations

- Write unit tests for new functionality (`test/unit/`).
- Update existing tests when behavior changes.
- Use the fixtures in `test/_fixtures/` when appropriate.
- Aim to keep coverage from regressing; add integration-style tests if a feature spans multiple modules.

## Code Style

We rely on Vite+, TypeScript, and Vitest for quality gates.

### Tooling

- **Vite+** (`vp check`) for linting, formatting, and integrated checks.
- **TypeScript** (`vp run typecheck`) for static analysis.
- **Vitest** (`vp test`, `vp test run`) for testing.

### Guidelines

- Prefer pure functions and immutable data where feasible.
- Keep modules small and focused; reuse existing strategies or services when possible.
- Document complex logic with concise comments when clarity is needed.
- Export public APIs from each module entry point (`src/<module>/index.ts`).
- Maintain strict typing: avoid `any` and prefer `unknown` with proper refinement.

## Submitting Changes

1. Sync with the latest upstream changes:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Run all checks before pushing:

   ```bash
   vp check
   vp run typecheck
   vp test run
   ```

3. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a pull request against `main` in the upstream repository.

### Pull Request Checklist

- Clear title using Conventional Commit style.
- Description explains the problem, solution, and alternatives considered.
- Tests added or updated.
- Documentation updated if behavior or APIs changed.
- Artifacts (coverage, stats) not committed.

### Suggested PR Template

```markdown
## Summary

Explain what this PR changes and why.

## Testing

- [ ] vp check
- [ ] vp run typecheck
- [ ] vp test run
- [ ] vp run coverage (if applicable)

## Additional Notes

Include screenshots, follow-up tasks, or related issues.
```

## Reporting Bugs

Before filing a bug report:

1. Search existing issues to avoid duplicates.
2. Reproduce the issue on the latest `main` branch.
3. Collect relevant logs or stack traces.

### Bug Report Template

```markdown
## Bug Description

Clear summary of the issue.

## Steps to Reproduce

1. Step one
2. Step two
3. ...

## Expected Behavior

What should happen.

## Actual Behavior

What actually happens.

## Environment

- OS: (e.g., Windows 11, macOS 15, Ubuntu 24.04)
- Node.js version: (e.g., 22.14.0)
- vp version: (e.g., 1.x)
- MLForm version: (e.g., 0.1.11)

## Additional Context

Screenshots, logs, or related issues.
```

## Feature Requests

We welcome ideas for new features or improvements. Please:

1. Check existing issues and discussions.
2. Describe the use case clearly.
3. Explain benefits and trade-offs.
4. Outline a possible implementation if you have one.

### Feature Request Template

```markdown
## Feature Description

What would you like to add or change?

## Use Case

Why is this needed?

## Proposed Solution

How might it work?

## Alternatives Considered

Other approaches you evaluated.

## Additional Context

Links, mockups, or related resources.
```

## Security Reports

If you discover a security vulnerability, do not open a public issue. Instead follow the process in [SECURITY.md](SECURITY.md).

## License

By contributing to MLForm you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Thank you for helping improve MLForm!
