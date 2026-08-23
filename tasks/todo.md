# Todo

## Transport reachability cleanup

### Goal

- [x] Keep only transport contracts and behavior reached by production `src` code.
- [x] Remove optional public adapters, middleware, composition, state, capabilities, and barrels justified only by tests or stale docs.
- [x] Remove stale cross-module reexports and tests for deleted behavior.
- [x] Keep every remaining source file below 300 lines and update repository memory.

### Plan

- [x] Compute production symbol reachability from outside `src/transport`, excluding tests and docs.
- [x] Reduce transport and runtime/kit barrels to the reachable contract.
- [x] Delete unreachable transport source files and obsolete transport-focused tests.
- [x] Run narrow type/module checks, then `vp check`, typecheck, full tests, and build.
- [x] Run line-cap scan and `graphify update .`.

### Review

- Reduced `src/transport` from 62 files and 5,652 lines to 4 files and 172 lines.
- Kept submit/stream contracts, runtime transport errors, and report request lifecycle handling.
- Removed protocols, composition, middleware, state stores, capabilities, duplicate barrels, passive reexports, and tests that only protected deleted API.
- Split the edited kit integration suite; every changed TypeScript file is below 300 lines.
- Verification passed: focused module/kit/runtime tests, `vp check --fix`, `vp run typecheck`, `vp test run` with 30 files and 257 tests, `vp build`, package export target checks, `npm pack --dry-run --json`, and `git diff --check`.
- `graphify update . --force` rebuilt the graph with 2,074 nodes and no deleted transport source paths.

## Trusted Report Mount Renderer

## Goal

- [x] Add an optional trusted DOM mount path for custom report plugins.
- [x] Keep declarative report descriptors as the default path.
- [x] Update Crystal Tree plugin to use the mount path.

## Plan

- [x] Add `render.mount` types and route mounted reports to a built-in primitive renderer.
- [x] Add a primitive mounted report element with cleanup and error isolation.
- [x] Add focused coverage for mount render and cleanup.
- [x] Update the local Crystal Tree plugin to render into the mount host.
- [x] Run type/test/build verification and update graphify.

## Review

- Added optional trusted `render.mount` for report plugins.
- Added `mlf-mounted-report` with DOM host, abort signal, cleanup, and render error isolation.
- Crystal Tree now renders directly into the MLForm mount host.
- Verification passed: `vp check --fix`, `vp exec tsc -p tsconfig.json --noEmit`, `vp test run`, `vp build`, focused mounted-report test, plugin `vp run build`.

## Playwright CI Browser Install

## Goal

- [x] Fix CI failure for browser-backed render matrix test.
- [x] Keep Playwright integration test active.

## Plan

- [x] Install Chromium in the GitHub Actions test job after dependency install.
- [ ] Verify focused Playwright test locally.
- [ ] Run full MLForm test suite.

## Review

- Added `vp exec playwright install --with-deps chromium` before `vp test run` in CI.
- Root cause: Playwright package was installed, but runner browser cache lacked Chromium.

## MLSuite Contract Cleanup Todo

Scope: make MLForm remove MLSuite workarounds. Breaking changes are allowed when they remove ambiguity, duplicated rules, id leakage, or small edge-case bugs. Goal: zero consumer-side guessing.

### Contract Principles

- [x] Treat `mappedTo` as the external model/backend contract, never field/report `id`.
- [x] Treat field/report `id` as runtime/UI identity only: state, layout, focus, validation, events, report instances.
- [x] Add or keep `displayKey` as the stable user-facing persistence/export key; labels are display copy, not stable data keys.
- [x] Remove id fallback from external data contracts where a `mappedTo` or `displayKey` contract exists.
- [x] Prefer breaking API cleanup over compatibility shims when shims preserve wrong semantics.
- [x] Make missing external contracts fail early with useful errors instead of forcing MLSuite fallback logic.

### Submission Data

- [x] Add official submission snapshot records separate from legacy keyed records.
- [x] Add `displayKey?: string` to field config.
- [x] Add `inputs[]` with field handle, display key, label, raw value, serialized value, resolved `mappedTo`, per-field model values, visibility, and disabled state.
- [x] Add `displayValues` keyed by `displayKey` only; labels are never data keys.
- [x] Add `modelValues` keyed by resolved `mappedTo`/one-hot targets.
- [x] Preserve old `values`, `fieldValues`, `serializedValues`, `serializedFieldValues` during migration.
- [ ] Make `displayKey` required for persisted/display/export workflows in next breaking version.
- [ ] Rename payload fields in breaking version: `values` -> `modelValues`, `fieldValues` -> `runtimeFieldValues`, `serializedValues` -> `serializedModelValues`, `serializedFieldValues` -> `serializedRuntimeFieldValues`.
- [ ] Remove or de-emphasize public use of `fieldValues` for app persistence; keep it as runtime/debug API.
- [x] Add official helper `createSubmissionSnapshot(form, options)` or equivalent public API so consumers do not call submit just to inspect payloads.
- [x] Add tests proving label changes do not change `displayKey`, `modelValues`, or persisted payload contracts.
- [ ] Add tests proving explicit id changes do not affect `mappedTo`/`displayKey` external payload contracts.

### One-Hot And Mapped Inputs

- [x] Support `onehot-category` with `options[].mappedTo`.
- [x] Encode one selected option as `1`, others as `0`.
- [x] Reject duplicate/unresolved one-hot targets.
- [x] Include one-hot selected user value in submission snapshot.
- [x] Include one-hot expanded model values in submission snapshot.
- [x] Add official reverse display helper for saved model payloads: model columns -> selected one-hot display value.
- [x] Add backend-aware display snapshot for `mappedTo` objects, e.g. `{ backend: modelId }`.
- [x] Ensure one visible field with option-level `mappedTo` never needs parent field `mappedTo`.
- [x] Add tests for numeric `mappedTo` targets in display/model snapshots.
- [x] Add tests for hidden/inactive one-hot fields across `include`, `omit`, and `reset-on-hide`.

### Mounted UI Pipeline

- [x] Let `mountForm` use `executeFormPipeline`.
- [x] Add mounted option for `reportFetchMode: "lazy" | "all" | "none"` or equivalent.
- [x] Ensure submit success event can carry full pipeline result: submit result plus report fetch results/errors.
- [x] Preserve current lazy mounted behavior only as explicit compatibility mode.
- [x] Add tests proving mounted submit with `reportFetchMode: "all"` resolves async report fetches before success callback.
- [x] Add tests proving `reportFetchMode: "none"` does not fetch reports.

### Report Context

- [x] Make report context official: `reportContextById` or replacement typed API in submit result/report fetch request.
- [x] Add `getReportContext(result, report)` helper that accepts report object, report id, normalized id, and mapped target.
- [x] Stop requiring consumers to use `normalizeSchemaId` for report-context lookup.
- [x] Include backend/model id, model input, report target, meta, raw output in official context where available.
- [x] Support per-report/per-backend contexts without MLSuite patching `meta`.
- [x] Add tests for custom report fetch receiving correct model-specific context.
- [x] Add tests for reports with same kind bound to different models.

### Report Payload Mapping

- [x] Ensure report payload lookup prefers resolved `mappedTo`, not report `id`.
- [x] Remove exact report-id fallback from backend payload lookup in next breaking version unless explicitly configured.
- [x] Add helper for report output aliases during migration, with warnings/tests.
- [x] Make missing `mappedTo` for external reports fail before submit.
- [x] Add tests proving report label/id changes do not break output lookup when `mappedTo` stays same.
- [x] Add tests proving duplicate report mapped targets fail early.

### Multi-Backend / Multi-Model

- [x] Decide transport-only fanout is unnecessary for MLSuite after snapshot/report-context fixes.
- [x] If not enough, add schema-aware `submitMany` or `backendContexts` API.
- [x] Support one submit producing N backend/model runs with per-backend resolved field mappings.
- [x] Ensure submit/snapshot without explicit backend emits every backend target from `mappedTo` maps.
- [x] Return per-backend results, reports, errors, skipped reports, and contexts in one official result.
- [x] Add per-backend `displayValues` and `modelValues`.
- [x] Add per-backend report fetch context.
- [x] Allow breaking changes if this removes MLSuite fanout orchestration and context patching.
- [x] Add tests for partial backend success and failed backend report context.
- [x] Add tests for same field mapping to different backend keys.

### Runtime Id Boundaries

- [x] Document ids as runtime handles only.
- [x] Audit public APIs for id leakage into external data contracts.
- [x] Keep `getField(id)`, `getReport(id)`, layout refs, focus, validation, report states keyed by id.
- [x] Avoid using normalized label-derived ids for persistence/export/model payloads.
- [x] Add explicit API for field lookup by `displayKey`.
- [x] Add explicit API for field lookup by resolved `mappedTo`.
- [x] Add tests proving labels can change without changing external data.
- [x] Add tests proving ids can change without changing external data when `mappedTo`/`displayKey` stable.

### MLSuite Migration Targets

- [ ] Replace MLSuite `toVisiblePayload` with MLForm `displayValues`/snapshot APIs.
- [ ] Replace MLSuite `toCanonicalPayload` with MLForm `modelValues`.
- [ ] Replace MLSuite `toFieldIdPayload` usage with runtime-only state reads, not persistence.
- [x] Replace MLSuite `getVisibleSchemaInputs`/`getVisibleSchemaInputRecord` with MLForm display snapshot or reverse display helper.
- [ ] Replace MLSuite one-hot reverse mapping from saved model input with MLForm helper.
- [ ] Replace MLSuite custom report fetch request patching with official report context.
- [ ] Replace MLSuite report-context normalized-id lookup with MLForm helper.
- [ ] Replace MLSuite mounted after-submit raw reconstruction with mounted pipeline result.
- [ ] Keep MLSuite analyzer API transport code in MLSuite unless MLForm gets schema-aware multi-backend.

### Docs And Compatibility

- [ ] Document `mappedTo` vs `displayKey` vs `id`.
- [ ] Document migration from id-keyed display/persistence to display/model snapshots.
- [ ] Document one-hot snapshot shape.
- [ ] Document mounted pipeline/report fetch modes.
- [ ] Add breaking-change migration guide for renamed payload fields.
- [ ] Update examples to avoid ids as data keys unless demonstrating runtime handles.

### Verification

- [ ] Run focused runtime tests for submission snapshots.
- [ ] Run report fetch tests.
- [x] Run mounted kit/browser tests for pipeline mode.
- [x] Run `vp check`.
- [x] Run `vp test`.
- [x] Run line-cap scan for changed source files.
- [x] Run `graphify update .`.
- [x] Update `DEBT.md` whenever debt is added, removed, or scoped.

## Submission Snapshot Todo

- [x] Add an official submission input snapshot that separates runtime ids from mapped data keys.
- [x] Preserve existing `values`, `fieldValues`, `serializedValues`, and `serializedFieldValues` contracts.
- [x] Include one-hot display value plus mapped model values in the snapshot.
- [x] Expose snapshot data through submit result, submit request, hooks, and report fetch request.
- [x] Add focused runtime coverage and update debt ledger.

## Submission Snapshot Review

- Added optional field `displayKey` and submission snapshot records.
- Runtime now fills `inputs`, `displayValues`, and `modelValues`; legacy keyed records remain.
- Report fetch request creation forwards snapshot data.
- Validated stream report updates no longer use report id as an external payload key when `mappedTo` is absent.
- Runtime id boundary regression tests now prove field/report id changes affect runtime handles only, while `displayKey`/`mappedTo` external contracts stay stable.
- Display key contract now trims explicit keys, rejects duplicate explicit display keys, and documents labels as copy instead of persistence/export keys.
- Transport default request keys now use resolved report `mappedTo` targets instead of report ids when a target exists, keeping dedup/cache behavior aligned with external contracts.
- Display snapshot removed the label fallback shim: fields without `displayKey` are omitted from `displayValues` instead of using label copy as a data key.
- Verification: `vp test run test/unit/submission-snapshot.test.ts`, `vp run typecheck`, focused `vp check --no-lint ...`, full `vp check`, full `vp test run`, and `graphify update .` passed.
- Latest verification: `vp test run test/unit/runtime-id-boundary.test.ts test/unit/submission-snapshot.test.ts test/unit/report-mapped-contract.test.ts`, `vp check`, `vp test run`, changed-source line-cap scan, and `graphify update .` passed.
- Display key verification: `vp test run test/unit/display-key-contract.test.ts test/unit/runtime-id-boundary.test.ts test/unit/submission-snapshot.test.ts`, `vp check`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- Id fallback verification: `vp test run test/unit/transport-request-key-contract.test.ts test/unit/transport.test.ts test/unit/runtime-id-boundary.test.ts`, `vp check`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- Breaking cleanup verification: `vp test run test/unit/display-key-contract.test.ts test/unit/submission-snapshot.test.ts test/unit/runtime-id-boundary.test.ts`, `vp check --fix`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- Missing contract verification: `vp test run test/unit/report-mapped-contract.test.ts test/unit/runtime.test.ts`, focused snapshot tests, `vp check`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- Snapshot helper verification: `vp test run test/unit/submission-snapshot.test.ts`, focused snapshot/id tests, `vp check --fix`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- One-hot reverse display verification: `vp test run test/unit/onehot-display.test.ts test/unit/submission-snapshot.test.ts`, `vp check --fix`, `vp test run`, `src`/docs line-cap scan, and `graphify update .` passed.
- Numeric/backend mapped snapshot verification: `vp test run test/unit/submission-snapshot.test.ts test/unit/onehot-display.test.ts` passed.
- One-hot inactive policy verification: visible one-hot snapshot coverage confirms option-level `mappedTo` needs no parent field `mappedTo`; hidden one-hot coverage confirms `include`, `omit`, and `reset-on-hide` submission behavior. `vp test run test/unit/onehot-inactive-policy.test.ts test/unit/submission-snapshot.test.ts test/unit/onehot-display.test.ts`, `vp check`, `vp test run`, and `graphify update .` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines.
- Mounted pipeline verification: `mountForm({ reportFetchMode: "all" })` now routes UI submit through `executeFormPipeline`, waits for async report fetches, and emits `pipelineResult`; `"none"` submits without report fetches; default `"lazy"` preserves renderer-driven behavior. `vp test run test/integration/kit-report-fetch-mode.integration.test.ts test/integration/kit.integration.test.ts`, `vp check`, and `vp test run` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines.
- Report context verification: submit results now expose `reportContexts`; `createReportFetchRequest` sends `reportContext`; `getReportContext` looks up by report id or resolved `mappedTo` target. Same-kind async report tests prove model-specific context without normalized-id lookup. `vp test run test/unit/report-context.test.ts test/unit/submission-snapshot.test.ts test/integration/kit-report-fetch-mode.integration.test.ts`, `vp check`, `vp test run`, and `graphify update .` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines.
- Report payload mapping verification: `resolveMappedReportPayload` now fails keyed backend `reports` without `mappedTo`, supports explicit aliases with `onAlias`, and schema normalization rejects duplicate resolved report targets. Existing id-boundary tests prove report id/label changes do not affect mapped output lookup. `vp test run test/unit/report-mapped-contract.test.ts test/unit/runtime-id-boundary.test.ts test/unit/report-context.test.ts`, `vp check`, `vp test run`, and `graphify update .` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines. Exact report-id fallback has been removed.
- Multi-backend verification: transport-only fanout cannot provide per-backend schema snapshots/report context, so runtime exposes `createMultiBackendSubmissionSnapshot` and `executeMultiBackendPipeline`. Per-backend runs include snapshot, submit result, report fetch outputs/errors, skipped report ids, and submit error. Focused coverage proves same field maps to different backend keys and partial backend failure keeps successful backend context intact. `vp test run test/unit/multi-backend.test.ts`, `vp test run test/unit/multi-backend.test.ts test/unit/submission-snapshot.test.ts test/unit/report-context.test.ts`, `vp check --fix`, `vp test run`, `vp check`, and `graphify update .` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines.
- Runtime id boundary verification: `getField(id)` and `getReport(id)` remain runtime-handle APIs for state/layout/validation/report states. `getFieldByDisplayKey(key)` and `getFieldByMappedTo(target, { backend })` now provide explicit external-contract lookup without label or id fallback. Coverage proves label/id changes do not change `displayValues`, `modelValues`, `serializedValues`, or report payload lookup. `vp test run test/unit/runtime-id-boundary.test.ts`, `vp check`, `vp test run test/unit/runtime-id-boundary.test.ts test/unit/submission-snapshot.test.ts test/unit/multi-backend.test.ts`, `vp test run`, and `graphify update .` passed. Line-cap scan is still blocked by pre-existing dirty `test/unit/runtime.test.ts` at 4459 lines.
- Backend-map snapshot verification: submit/snapshot without an explicit backend now writes all resolved `mappedTo` map targets into `modelValues`, covering MLSuite multi-model transport without id reconstruction. `vp test run test/unit/submission-snapshot.test.ts test/unit/multi-backend.test.ts` passed.
- MLSuite link verification: local MLSuite now consumes `mlform` through `file:../../mlform`; schema-run transport reads `modelValues`, `fieldValues`, and `displayValues` from MLForm instead of rebuilding payloads from ids. `vp check`, `vp test run`, `vp build`, and `graphify update .` passed in MLForm. MLSuite changed-file `vp check --fix`, `vp test run`, `vp build`, and `graphify update .` passed; full MLSuite `vp check` remains blocked by 150 pre-existing unrelated formatting issues.
- MLSuite display-data verification: saved/reviewed schema run inputs now render and prefill from `displayKey` data only. MLSuite no longer reconstructs visible inputs from field ids, labels, `mappedTo`, or model columns. `vp test run`, changed-file `vp check --fix`, and `vp build` passed in MLSuite.
- Playwright render verification: added Playwright dev dependency and real Chromium coverage for mounted rendering with custom field/report plugins, `onehot-category`, backend-map `mappedTo`, mapped report payload lookup without ids, async custom report context, and multi-backend fanout targets. `vp test run test/unit/report-mapped-contract.test.ts test/integration/playwright-render-matrix.test.ts`, `vp check`, `vp test run`, changed-file line-cap scan, and `graphify update .` passed.

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
