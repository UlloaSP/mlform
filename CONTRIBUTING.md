# Contributing

## Developer setup

MLForm uses TypeScript, Lit, and Vite+. You need Node.js 24.15.0 or newer, Git, and the global `vp` command.

Install `vp` on macOS or Linux:

```bash
curl -fsSL https://vite.plus | bash
```

On Windows, use PowerShell:

```powershell
irm https://vite.plus/ps1 | iex
```

Then install and verify the repository:

```bash
vp install
vp exec playwright install chromium
vp run ci
```

Documentation has its own workspace:

```bash
cd docs
vp install
vp run build
```

## Read this first

MLForm is pre-1.0 and its public model is still becoming smaller and more explicit. Contributions are welcome, but preserving a coherent schema, runtime, transport, rendering, and package contract matters more than adding surface area.

Read [AGENTS.md](./AGENTS.md) before changing code. It describes the architecture, vocabulary, invariants, package boundaries, and verification expectations.

For non-trivial features, public API changes, new dependencies, or architectural work, open an [issue](https://github.com/UlloaSP/mlform/issues) first. A short discussion can prevent a large PR from solving the wrong problem.

## What we are most likely to accept

- Small, focused bug fixes with regression coverage.
- Correctness and reliability fixes at the owning layer.
- Accessibility and performance improvements with observable evidence.
- Documentation fixes that bring examples back in line with the real contract.
- Narrow maintenance changes that remove complexity or obsolete assumptions.

## What we are least likely to accept

- Large, unrelated changes in one PR.
- Speculative abstractions, configuration, or compatibility layers.
- New runtime dependencies without a concrete need.
- Rewrites that duplicate schema or runtime rules in the UI.
- Public API changes without prior discussion.
- Generated artifacts, agent plans, scratch files, or PR-only evidence committed to the repository.

## If you want to open a PR

Keep one concern per PR. Use a Conventional Commit-style title, such as `fix(runtime): preserve mapped report identity`.

The description should answer:

- What problem exists?
- Why should MLForm solve it?
- What changed?
- How was it verified?

Update tests with behavior changes. Update user documentation only when usage or an external contract changes. Do not add documentation that merely repeats source code, types, or the PR history.

For visible component changes, include before-and-after images. For focus, keyboard, motion, timing, or interaction changes, include a short recording or another reproducible demonstration.

Before opening the PR, run the narrowest relevant test first, then the applicable repository gates:

```bash
vp check
vp run typecheck
vp test run
vp build
```

Package-surface changes should also run:

```bash
vp run check:bundle
vp run test:package
```

If something cannot run, state the exact command and blocker. Do not claim unverified environments or passing checks.

## Reporting bugs

Search existing [issues](https://github.com/UlloaSP/mlform/issues) first. A useful report includes:

- MLForm, Node.js, browser, and operating-system versions.
- A minimal schema or reproduction repository.
- Expected and actual behavior.
- Full error output or relevant logs.
- Whether the problem occurs through runtime, primitives, kit, or more than one surface.

Security vulnerabilities do not belong in public issues. Follow [SECURITY.md](./SECURITY.md).

## Be realistic

Opening a PR does not guarantee acceptance or immediate review. Maintainers may ask for a smaller change, choose a different design, or defer work that expands the project before its contracts are ready.

Respectful, technically specific disagreement is welcome. Scope and architectural consistency still decide what lands.

## License

By contributing, you agree that your contribution will be licensed under the [MIT License](./LICENSE).
