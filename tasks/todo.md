# Todo

## Package Types Todo

- [x] Confirm emitted declaration layout under `dist/types/src`.
- [x] Point package `exports.types` at emitted declaration files.
- [x] Narrow module-boundary test passed.
- [x] Verify build and package tarball.
- [x] Update graphify.

## Package Types Review

- Fixed `exports.*.types` to match emitted declarations under `dist/types/src/*`.
- Updated module-boundary regression to lock the package export contract.
- Verification: `vp test run test/unit/module-boundaries.test.ts`, `vp build`, export target existence check, `npm pack --dry-run --json`, `vp check --no-lint package.json test/unit/module-boundaries.test.ts DEBT.md tasks/todo.md`, `vp test run`, and `graphify update .` passed.
- Full `vp check` still blocked by pre-existing formatting issues outside this change.

## OneHot Category Todo

- [x] Add built-in `onehot-category` schema kind using category UI.
- [x] Encode selected option into `mappedTo` columns as 0/1 during submission.
- [x] Reject invalid/duplicate onehot output mappings.
- [x] Document concise schema, no hidden subordinate fields.
- [x] Update `DEBT.md`, focused tests, checks, and graph.

## OneHot Category Review

- Added built-in `onehot-category` using the existing category primitive.
- `options[].mappedTo` is the only backend target contract; hidden subordinate fields are not needed.
- Submission emits strict 0/1 encoded columns and rejects duplicate or unresolved resolved targets.
- Docs added for English/Spanish schema usage; `mapped-category` docs now points strict one-hot users to `onehot-category`.
- Verification: `vp test run test/unit/runtime.test.ts`, `vp run typecheck`, `vp check --fix`, `vp test run`, `vp build`, source line cap, and `graphify update .` passed.
