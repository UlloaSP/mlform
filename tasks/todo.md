# Todo

## Old Compatibility Debt Todo

- [x] Read `AGENTS.md`, graph report, architecture skill, and `DEBT.md`.
- [x] Map runtime compatibility exports, runtime-owned builtins/declarative modules, descriptor fallback paths, docs/tests references.
- [ ] Move runtime-owned builtin imports behind schema/presentation pack seams.
- [ ] Remove runtime re-exports of presentation/declarative helpers and presentation descriptor types.
- [ ] Remove presenter fallback paths that preserve schema-only custom UI compatibility.
- [ ] Update docs/tests/imports to current schema + presentation + packs story.
- [ ] Update `DEBT.md`; run typecheck/tests/check/graph update.

## Old Compatibility Debt Review

- Pending.

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
