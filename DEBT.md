# Technical debt

## Open

- **Four modified test files exceed the 300-line repository limit.** `runtime.test.ts`, `primitives.integration.test.ts`, `kit-view.test.ts`, and `playwright-render-matrix.test.ts` must be split by behavior without weakening coverage.
- **Plugin compatibility and versioning are not formalized.** Define a policy only when MLForm gains external plugin consumers or needs compatibility checks across releases.
