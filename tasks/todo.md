# Todo

## Root Module Removal Todo

- [x] Remove root package module export (`.`), root build entry, and `src/index.ts`.
- [x] Rewrite internal/docs/examples imports from `mlform` or `@/index` to subpath modules.
- [x] Keep package subpath modules as only public API.
- [x] Update `DEBT.md`; verify typecheck/tests/docs/build/graph.

## Root Module Removal Review

- Deleted `src/index.ts` and removed package export `"."`, root `types`, root build entry, and root Vite alias.
- Rewrote README/docs/examples/internal docs imports to explicit subpaths: `mlform/kit`, `mlform/transport`, and `mlform/schema`.
- Updated package export docs to state there is no root module export.
- Verification: root import scan, source line cap, `vp run typecheck`, boundary test, `vp build`, focused runtime/kit/primitives tests, `vp check`, `vp test`, docs `vp run build`, src-only graph update/recluster, graph source path scan, and dist root artifact scan passed.

## Public Module API Enforcement Todo

- [x] Find every cross-module import/export not written as `@/module`.
- [x] Promote needed symbols to module root `index.ts`.
- [x] Rewrite cross-module imports to root APIs only.
- [x] Remove module subpath aliases in source, tests, and docs.
- [x] Verify no cross-module internal specs remain, no feature regressions, update graph.

## Public Module API Enforcement Review

- Exported needed primitive/builtins/design-system symbols from module root APIs.
- Rewrote test/docs imports to module roots.
- Rewrote builtins internal absolute subpath imports to relative internal imports.
- Added `test/unit/module-boundaries.test.ts` to reject module subpath aliases and cross-module internal imports.
- Verification: boundary test, `rg "@/module/subpath"` scan, `vp run typecheck`, focused runtime/kit/primitives tests, `vp check`, `vp test`, source line cap, docs `vp run build`, src-only graph update/recluster, graph path scan, and graph explanation scan passed.

## Module Interface Debt Closure Todo

- [x] Move report fetch request builder out of `shared` to schema-owned contract seam.
- [x] Remove upward `runtime -> builtins-ml` constants dependency.
- [x] Break `builtins-ml <-> packs` composition cycle.
- [x] Route kit primitive usage through public primitive API, not internal files.
- [x] Route UI default ML composition through public pack seam.
- [x] Replace `behaviors -> runtime/types` with runtime public API.
- [x] Clear `DEBT.md`, verify imports/tests/check/graph.

## Module Interface Debt Closure Review

- Moved `createReportFetchRequest()` to `schema` and removed `shared -> schema`.
- Deleted runtime built-in constants facade.
- Moved ML pack construction into `builtins-ml`; `packs/ml` now points one way to built-ins.
- Routed kit primitive constants/types/registration through public `@/primitives`; moved fallback descriptor policy into kit snapshot code.
- Kept default ML behavior through public `@/packs` seam for kit/primitives, preserving existing tests while avoiding direct UI -> builtins coupling.
- Verification: `vp run typecheck`, focused runtime/kit/primitives tests, source line cap, import seam scanner, `vp check`, `vp test`, src-only graph update/recluster, graph source path scan, and graph explanation scan passed.

## Module Interface Graph Audit Todo

- [x] Build module-to-module edge matrix from `graphify-out/graph.json`.
- [x] Confirm suspicious cross-module calls/imports against source.
- [x] Classify true seam leaks vs acceptable adapter use.
- [x] Report findings and add debt only if real.

## Module Interface Graph Audit Review

- Graph top cross-module edges: `kit -> primitives` 26, `builtins-ml -> schema` 16, `primitives -> runtime` 16, `primitives -> presentation` 11, `kit -> runtime` 8.
- Confirmed real seam debt: `shared <-> schema`, `runtime -> builtins-ml`, `builtins-ml <-> packs`, kit importing primitive internals, generic UI entrypoints creating ML packs, and `behaviors` importing `runtime/types`.
- Added active debt entries to `DEBT.md` with scope, reason, impact, and exit condition.
- Verification: graph matrix script plus source import scan.

## Src-Only Graph Rebuild Todo

- [x] Read `AGENTS.md`, graph report, graphify skill, caveman skill.
- [x] Delete existing root `graphify-out` after path verification.
- [x] Generate fresh graph from `src/` only.
- [x] Verify graph contains only `src/` sources and no stale explanation nodes.

## Src-Only Graph Rebuild Review

- Deleted stale root `graphify-out` after verifying resolved path.
- Full semantic extract from `src/` was blocked by missing LLM API key.
- Generated AST-only graph from `src/`, moved it to root `graphify-out`, normalized `source_file` paths to `src/*`, then reclustered.
- Result: 1409 nodes, 3103 edges, 95 communities.
- Verification: all graph source paths are `src/*`; graph/report scan has zero `Explanation|explanation|explanations` matches.

## Module Debt Closure Todo

- [x] Read `AGENTS.md`, graph report, dirty status, and `DEBT.md`.
- [x] Move neutral submit result/report fetch request contracts below runtime.
- [x] Split headless kit view contract from mounted UI registries.
- [x] Add kit focus adapter seam and remove primitive DOM import from kit logic.
- [x] Move built-in ML constants/guards out of runtime.
- [x] Clear `DEBT.md`, verify no seam regressions, run tests/check, update graph.

## Module Debt Closure Review

- Added schema-owned neutral `SubmitResult` and shared report fetch request builder.
- Removed primitive/design-system registries from `createFormView`; mounted adapters own UI registries.
- Replaced kit error-navigation primitive DOM import with a focus adapter.
- Moved built-in ML constants to `builtins-ml` and date/report helpers to shared/schema-facing modules.
- Pruned stale explanation nodes from graphify output after `graphify update --force` still preserved deleted nodes, then reclustered graph.
- Verification: `vp run typecheck`, focused runtime/kit/primitives tests, full `vp check`, full `vp test`, docs `vp run build`, source line cap, source/grafo explanation scans.

## Module Seam Debt Analysis Todo

- [x] Read `AGENTS.md`, caveman skill, graph report, architecture skill, and `DEBT.md`.
- [x] Compare graph communities against real source imports.
- [x] Identify non-agnostic module seams and stale graph artifacts.
- [x] Add concrete active debt entries with scope, impact, and exit condition.
- [x] Run lightweight verification for docs-only debt update.

## Module Seam Debt Analysis Review

- Found real module seam debt in schema/presentation report contracts, kit headless/UI coupling, kit primitive DOM focus coupling, primitive report request construction, and built-in ML runtime helper imports.
- Also found graphify stale nodes for deleted explanation files after incremental update; source search still has zero explanation domain/API matches.
- Updated `DEBT.md` and `tasks/lessons.md`.
- Verification: `git diff --check` passed; `rg "Explanation|explanation|explanations" src test README.md docs/src/content/docs docs/astro.config.mjs` returned no matches.
- Blocker: `vp check` still reports formatting issues across 65 existing dirty `src/test` files; not auto-fixed here because request was debt analysis only.

## Report Fetch Debt Closure Todo

- [x] Read `AGENTS.md`, graph report, and `DEBT.md`.
- [x] Extract shared report fetch request builder.
- [x] Extract shared async request runner.
- [x] Remove active debt entries and update review notes.
- [x] Run focused tests, `vp check`, `vp test`, and `graphify update .`.

## Report Fetch Debt Closure Review

- Added shared `createReportFetchRequest()` for pipeline + primitive report frame.
- Added shared async request runner for runtime report fetch + renderer details fetch.
- Cleared active `DEBT.md` entries.
- Verification: `vp run typecheck`, focused runtime/kit/primitives tests, source line cap check, `vp check`, full `vp test`, and `graphify update .` passed.

## Explanations As Reports Todo

- [x] Read `AGENTS.md`, graph report, existing debt, package scripts, and relevant exports.
- [x] Remove explanation schema/runtime/presentation APIs.
- [x] Fold explanation rendering/fetch lifecycle into reports.
- [x] Update kit layout/view APIs to reports-only outputs.
- [x] Update tests, docs, README, and `DEBT.md`.
- [x] Run focused verification, broad verification, and graph update.

## Explanations As Reports Review

- Removed top-level explanation schema/runtime/presentation/primitive/kit APIs.
- Added report fetch lifecycle and pipeline `reportFetch*` outputs.
- Migrated docs/tests/examples to reports-only contracts.
- Verification: focused runtime/kit/primitives tests passed, `vp check` passed, full `vp test` passed, docs `vp run build` passed, `rg` found zero explanation API/domain references, and `graphify update .` passed.

## Full Debt Closure Todo

- [x] Read caveman skill, `AGENTS.md`, graph report, dirty status, and `DEBT.md`.
- [x] Split remaining oversized source files below 300 lines.
- [x] Remove runtime definition aliases that permit presentation `describe`.
- [x] Move/rename docs/tests away from old engine naming.
- [x] Clear `DEBT.md`; run `vp check`, tests, typecheck, graph update.

## Full Debt Closure Review

- Closed all active `DEBT.md` entries.
- Split remaining oversized source files and kept every `src/**/*.ts` file at or below 300 lines.
- Moved runtime-owned builtins under `builtins-ml/definitions`, removed `describe` from runtime definition aliases, renamed docs/tests from engine paths to runtime paths, and simplified `cloneSchemaRegistry`.
- Fixed design-system fallback drift so full tests pass with neutral defaults.
- Verification: `vp check`, `vp run typecheck`, focused debt tests, and full `vp test` passed.

## Debt Continuation Todo

- [x] Read `AGENTS.md`, graph report, dirty status, and `DEBT.md`.
- [x] Split `src/primitives/components/form-root-styles.ts` below 300 lines.
- [x] Split built-in series field definition below 300 lines.
- [x] Update `DEBT.md` and run focused verification plus graph update.

## Debt Continuation Review

- Split stacked/split form root CSS into `form-root-styles.ts` + `form-root-split-styles.ts`.
- Split series builtin helpers into `series-helpers.ts`; public `seriesFieldDefinition` unchanged.
- Verification: `vp check --fix`, `vp run typecheck`, focused primitives/builtins tests, and `graphify update .` passed.
- Remaining oversized source files: `design-system-controller.ts`, primitive `series-field.ts`, `create-submitter.ts`, `create-runtime.ts`, `fanout.ts`.

## Old Compatibility Debt Todo

- [x] Read `AGENTS.md`, graph report, architecture skill, and `DEBT.md`.
- [x] Map runtime compatibility exports, runtime-owned builtins/declarative modules, descriptor fallback paths, docs/tests references.
- [ ] Move runtime-owned builtin imports behind schema/presentation pack seams.
- [x] Remove runtime re-exports of presentation/declarative helpers and presentation descriptor types.
- [x] Remove presenter fallback paths that preserve schema-only custom UI compatibility.
- [x] Update docs/tests/imports to current schema + presentation + packs story.
- [x] Update `DEBT.md`; run typecheck/tests/check/graph update.

## Old Compatibility Debt Review

- Removed public runtime compatibility exports for presentation helpers/types, schema registry helpers, and builtin definitions.
- Deleted `src/runtime/declarative/*`; declarative helpers now live under `presentation`.
- Removed kit auto-promotion from schema registry `describe` functions into presentation registry.
- Updated custom-kind tests/docs to use explicit schema + presentation registration.
- Verification: `vp check`, `vp run typecheck`, focused kit/builtins tests, and `graphify update .` passed. Full `vp test` still fails 3 existing design-system default-theme tests expecting `neutral` while dirty state resolves `cobalt`.

## Error Navigation Todo

- [x] Read `AGENTS.md`, diagnose skill, and graph report.
- [x] Locate submit/validation paths for primitive, wizard, tabs, accordion.
- [x] Add first-invalid-field reveal + scroll/focus behavior.
- [x] Add focused regression tests.
- [x] Run focused verification plus graph update.

## Error Navigation Review

- Added `data-field-id` on rendered field frames so shells can target invalid controls.
- Added primitive error focus helper to scroll/focus first visible invalid field after submit validation failure.
- Added kit error navigation for wizard/tabs/accordion: reveal invalid step/tab/section, then scroll/focus field.
- Added single-file regression suite covering stacked primitive, wizard, tabs, and accordion error navigation.
- Verification: focused error-navigation test passed; existing kit/primitives integration tests passed; `vp run typecheck` passed; graph updated.
- Blockers: `vp check` still fails formatting in existing dirty design-system files `src/design-system/registry/builtins.ts` and `src/design-system/themes/clickhouse.ts`; full `vp test` still fails 3 design-system default-theme tests expecting `neutral` while current dirty state resolves `cobalt`.

## Dark Layout Color Todo

- [x] Read `AGENTS.md`, caveman skill, frontend-design skill, and graph report.
- [x] Locate built-in wizard/tabs/accordion dark-mode shell styles.
- [x] Replace light-only header/footer/tab/button fallbacks with semantic tokens.
- [x] Run focused verification plus graph update.

## Dark Layout Color Review

- Replaced light-only panel/header/footer fallbacks in built-in wizard, tabs, accordion, and stacked form styles with semantic shell tokens.
- Replaced tabs/accordion plain button `#fff` backgrounds with input surface tokens.
- Updated `DEBT.md` to remove stale `form-root-styles.ts` oversized entry; file is 271 lines after this change.
- Verification: `git diff --check` passed; graph updated.
- Blockers: `vp check` fails existing formatting in `src/design-system/themes/clickhouse.ts`; `vp run typecheck` fails existing missing exports from design-system index files; `vp test` fails existing design-system resolver errors from that same dirty design-system state.

- [x] Read `AGENTS.md` and graph report.
- [x] Find classifier report `details` root usage.
- [x] Rename classifier report config prop to `showClassProbabilities`.
- [x] Update tests and docs, no alias.
- [x] Run focused verification plus graph update.

## Review

- Renamed classifier report schema/descriptor prop from `details` to `showClassProbabilities`.
- Updated primitive renderer to read only `showClassProbabilities`.
- Updated tests/docs to use new breaking name.
- Verification: classifier-filter test passed; typecheck passed; graph updated.
- Blockers: `vp check` fails on pre-existing formatting issues in `.claude/`, `.codex/`, `.opencode/`, `AGENTS.md`, `CLAUDE.md`; `vp test` fails existing non-classifier field/custom-renderer tests.

## Description Visibility Todo

- [x] Read `AGENTS.md` and graph report.
- [x] Locate field description/help rendering.
- [x] Add shared `showDescriptionInline` field option defaulting to false.
- [x] Update docs and add focused test.
- [x] Run verification and graph update.

## Description Visibility Review

- Added shared field option `showDescriptionInline?: boolean`.
- Built-in field schemas default it to `false`.
- Built-in and declarative field descriptors pass it to primitives.
- Field frame starts descriptions visible when true, but help button can still collapse/expand.
- Verification: focused test passed; classifier-filter test still passed; typecheck passed; graph updated.
- Blockers unchanged: `vp check` fails pre-existing formatting in agent config/docs files; full `vp test` fails existing non-description field/custom-renderer tests.

## Biome To Oxc Todo

- [x] Read `AGENTS.md` and graph report.
- [x] Inspect Biome config and Vite+ Oxc docs.
- [x] Move formatter options to Vite+ `fmt`.
- [x] Move linter rules to Vite+ `lint`.
- [x] Remove Biome config/references.
- [x] Verify `vp fmt`, `vp lint`, `vp check`.

## Biome To Oxc Review

- Migrated Biome lint/format policy into Vite+ `lint` and `fmt` Oxc config.
- Removed `biome.json` and non-task Biome references.
- Replaced lint-blocking `any` helper contracts with typed schema/presentation contracts.
- Split view snapshot caching into `src/kit/view-snapshot-cache.ts`; `src/kit/view.ts` is now under 300 lines.
- Verification: focused `vp lint` passed; full `vp check` passed; graph updated.
- Blocker unchanged: full `vp test` still fails 7 existing field/custom-renderer tests.

## Presenter Test Fix Todo

- [x] Re-read `AGENTS.md` and graph report.
- [x] Reproduce failing tests and identify presenter registry gap.
- [x] Derive/preserve presentation registry for custom definitions.
- [x] Update tests using primitive mount custom presenters.
- [x] Verify focused tests, full `vp check`, full `vp test`.

## Presenter Test Fix Review

- Fixed schema-only custom definition UI path by deriving presenters from registry definitions with `describe`.
- Exposed/passed kit `presentationRegistry` into primitive mount.
- Suppressed empty report frames when descriptor is null.
- Refreshed primitive root when report/explanation state changes so async explanation content renders.
- Verification: focused 3-file run passed; `vp check` passed; full `vp test` passed; graph updated.
