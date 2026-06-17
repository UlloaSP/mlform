# Todo

## MappedTo Contract Todo

- [x] Add schema-level `mappedTo` type/helper for string feature names and numeric positions.
- [x] Route submitted field payload keys through `mappedTo` when present.
- [x] Replace report `source` contract with `mappedTo`.
- [x] Keep mapped-category field references internal and document `fieldId` semantics.
- [x] Update focused tests, docs, and `DEBT.md`.
- [x] Run focused verification, line cap, full checks when feasible, and `graphify update .`.

## MappedTo Contract Review

- Added `mappedTo` for fields and reports as explicit backend contract.
- `mappedTo` supports string keys, numeric positions, and backend-specific maps with `default`.
- Field `id` remains UI/schema identity; `fieldValues` still use ids, while submitted `values` use `mappedTo` or explicit `valuePath`.
- Report `source` was removed from schema normalization/types; built-in reports resolve payloads through `mappedTo`.
- `mapped-category` still maps to internal field ids; docs now state subordinate fields need their own `mappedTo` for backend payloads.
- Verification: `vp run typecheck`, `vp test run test/unit/runtime.test.ts`, `vp test run test/integration/kit.integration.test.ts`, `vp test run`, `vp check`, `vp build`, `git diff --check`, `src` line cap, and `graphify update .` passed.
