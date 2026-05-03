# AGENTS.md

These instructions are binding for any coding agent working in this repository.
Hard constraints override convenience. If a requested change conflicts with them, stop and say so.

## How To Apply These Instructions

- Read this root file first for repository-wide rules.
- Then read the nearest nested `AGENTS.md` for the subtree you are changing.
- Local `AGENTS.md` files extend this file and override it within their subtree when rules conflict.
- If no nested `AGENTS.md` exists for the target path, only this root file applies.

## Mission

- Keep MLForm correct, reproducible, and maintainable across all modules
- Prefer simple, coherent changes that reduce legacy assumptions.

## Repo Map

- `engine\`:
  ...
- `README.md`: product and deployment context, not operational editing policy.

## Hard Constraints

- No source file may exceed 300 lines.
- If an edit would exceed 300 lines, split the file first.
- Prefer new modules over growing existing files.
- For any communication with the user, always use the `caveman` skill in `ultra` mode.
- `DEBT.md` is mandatory repo memory for technical debt, known bugs, architectural compromises, and incomplete migrations.
- Any change touching `src\`, `test\`, `docs\`, or `README.md` must update `DEBT.md` if the debt picture changes, including debt removed, debt added, or scope/status changes.
- Do not duplicate business rules unless duplication is explicitly justified by UX or runtime needs.
- Do not add new runtime dependencies without explicit reason.
- Do not leave dead branches, half-wired flags, placeholder implementations, or misleading UI copy.
- Do not fake verification, passing tests, or supported environments.

## Change Strategy

- Prefer smallest coherent change that fully resolves task.
- Remove obsolete assumptions before extending behavior.
- If touching multiple layers, keep one clear source of truth and adapt other layers to it.
- Refactor before feature work when target file is near line limit or already mixes unrelated concerns.
- Preserve data compatibility and migration safety unless task explicitly allows breaking changes.
- When closing debt, remove or downgrade the corresponding entry in `DEBT.md` in the same change.
- When introducing a temporary compromise, document it in `DEBT.md` immediately with scope, reason, and exit condition.

## Testing Rules

- When creating a test for a feature do it in a single file.
- Tests for a feature have to cover at least the success case and each error case at least once.
- Update tests in same change when behavior or contract changes.
- Run narrowest relevant verification first, then broader checks when environment supports them.
- If full verification cannot run, report exact command attempted and exact blocker.

## Do Not Do

- Do not preserve migration-only fields in active code or tests after migration path is removed.
- Do not expand already-large files instead of splitting them.
- Do not silently change public API contracts.
- Do not mix unrelated refactors into bug-fix patches unless required by hard constraints.

## Done Criteria

- Hard constraints satisfied.
- No stale references to removed behavior remain.
- Code, tests, and UI copy agree on actual contract.
- `DEBT.md` matches the new repo reality.
- Verification performed, or exact blocker documented.
- Result leaves codebase simpler than before.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
