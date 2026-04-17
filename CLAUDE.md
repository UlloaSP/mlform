# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

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

## Architecture

MLForm is a TypeScript library (ESM, no default CJS) built with **Lit** (Web Components) and **Zod** (schema validation). It exposes four separate entry points, each independently importable:

### Four surfaces

| Surface                 | Entry                | Role                                                                                                          |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `mlform` / `mlform/kit` | `src/kit/`           | High-level `mountForm` API — wires the other three surfaces together. The main consumer entry point.          |
| `mlform/engine`         | `src/engine/`        | Headless state machine — fields, validation, conditions, submission lifecycle, transport. Framework-agnostic. |
| `mlform/primitives`     | `src/primitives/`    | Lit Web Component renderers. Consumes `FormController` from the engine and renders the DOM.                   |
| `mlform/design-system`  | `src/design-system/` | Theming — themes, recipes, CSS custom property tokens, runtime stylesheet injection.                          |

### Data flow

```
mountForm(container, options)
  └─ Kit
      ├─ createForm(schema, registry, transport)  →  FormController  [Engine]
      ├─ mountPrimitiveForm(container, form, ...)  →  MountedPrimitive  [Primitives]
      └─ attachDesignSystem(host, ...)  →  AttachedDesignSystem  [Design System]
```

### Engine internals (`src/engine/`)

- **`form.ts`** – `createForm()` is the main factory. Holds submission/validation lifecycles, abort logic, and field sync.
- **`field-controller.ts`** / **`report-controller.ts`** – per-field and per-report reactive state.
- **`registry.ts`** – `EngineRegistry` maps field/report `kind` strings → `FieldDefinition` / `ReportDefinition` objects.
- **`builtins/`** – built-in field (`text`, `number`, `boolean`, `category`, `date`, `time-series`) and report (`classifier`, `regressor`) definitions. Each definition provides: `schema` (Zod), `getDefaultValue`, `normalizeValue`, `serializeValue`, `validate`, and `describe`.
- **`internal.ts`** / **`store.ts`** – immutable state store and transition helpers.
- **`schema.ts`** – normalizes raw `FormSchema` (auto-generates `id` from `label` when absent).

### Design system (`src/design-system/`)

- **`contract/`** – CSS custom property keys (`component-keys.ts`, `component-tokens.ts`, `global-tokens.ts`). Changes here affect all themes.
- **`themes/`** / **`recipes/`** – built-in manifests (`neutral`, `cobalt`, `graphite`, `sage`, `sunset`; `default`, `minimal`, `soft`, `contrast`).
- **`runtime/`** – `attachDesignSystem`, `DesignSystemController`, stylesheet injection.
- **`resolve/`** – `resolveDesignSystem` merges config → `ResolvedDesignSystem` (computed tokens + component overrides).

### Path alias

`@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

### Tests

- `test/unit/` — pure engine/design-system tests (no DOM needed, though jsdom is the environment).
- `test/integration/` — full stack tests using jsdom: kit mount/unmount, primitive rendering, design system attachment.
- Test framework: `vitest` (via `vite-plus/test`). Import test utilities from `"vite-plus/test"`.
- Setup file: `test/setup.ts`.

### Build output

Five ES module chunks written to `dist/`:

- `dist/mlform.mjs` (re-exports kit public API)
- `dist/mlform/engine.mjs`, `kit.mjs`, `primitives.mjs`, `design-system.mjs`
- Type declarations under `dist/types/src/`.
