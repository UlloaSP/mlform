# Todo

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
