# Technical debt

## Open

- **Published documentation still describes removed APIs.** Forty English pages contain examples built around `createJsonTransport`, legacy streaming, capability, retry, or policy APIs, invalid layout values, or migration paths that MLForm no longer supports. Astro builds these pages because fenced TypeScript is not compiled, so a green docs build is not evidence that the examples work. Remove obsolete pages or rewrite them against the current public contract before the next documentation deployment.
- **The extension surface still exposes pre-plugin registration paths.** `registerDefinedFieldKind` and `registerDefinedReportKind` remain public delegating helpers even though plugins are the intended extension boundary. Remove the helpers and migrate internal callers before the next public release; there are no external consumers that require a compatibility period.
- **Headless kind definitions still receive presentation behavior.** `defineFieldKind` and `defineReportKind` copy `describe` from their presenters onto headless definitions and return overlapping flat aliases. Separate the definition and presenter contracts, then update plugins and tests to consume the owning layer directly.
- **TypeScript tooling scripts are outside the lint and format gate.** Type checking covers `scripts/` through `tsconfig.scripts.json`, but the CI `vp check` allow-list omits both. Add them to the check once the scripts conform to the repository formatter.
- **Four modified test files exceed the 300-line repository limit.** `runtime.test.ts`, `primitives.integration.test.ts`, `kit-view.test.ts`, and `playwright-render-matrix.test.ts` must be split by behavior without weakening coverage.
- **Public plugin naming is unsettled.** Decide whether the exported API should use `MLFormPlugin` and `defineMLFormPlugin` rather than `MlformPlugin` and `defineMlformPlugin` before external plugin consumers depend on either spelling.
- **Plugin compatibility and versioning are not formalized.** Define a policy only when MLForm gains external plugin consumers or needs compatibility checks across releases.
