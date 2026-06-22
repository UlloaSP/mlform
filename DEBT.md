# DEBT.md

This file is the required ledger for active technical debt, known bugs, architectural compromises, and incomplete migrations in this repository.

## Update Rule

- Any change touching `src/`, `test/`, `docs/`, or `README.md` must review this file.
- If repo debt changes, update this file in the same change.
- If debt is removed, remove the entry or move it to a lower-severity section.
- If a temporary compromise is introduced, add it here with:
  - scope
  - reason
  - user impact
  - exit condition

## Status

- Last reviewed: `2026-06-22`
- Current focus: MLSuite local integration

## Active Debt

No active debt.

## Recent Progress

- `src/runtime/form.ts` split
- `src/runtime/submission/submitter.ts` split
- `src/runtime/validation/field.ts` split
- `src/runtime/fields/controller.ts` split
- `src/kit/view.ts` split
- `src/primitives/components/field-frame.ts` split
- `src/primitives/components/form-root.ts` split
- `src/kit/tabs-root.ts` split
- `src/kit/accordion-root.ts` split
- `src/kit/wizard-root.ts` split
- `src/kit/types.ts` split
- `src/kit/layout.ts` split
- `src/primitives/fields/series-field.ts` split
- `src/transport/types/options.ts` split
- `src/transport/composition/fanout.ts` split
- `src/design/runtime/design-controller.ts` split
- `src/transport/internal.ts` split
- `createBuiltinRegistry` removed
- public `EngineRegistry` name removed
- primitive form root now refreshes report/explanation descriptors when their live state changes
- public runtime re-exports for `define*Kind`, presentation descriptor types, schema registry helpers, and builtin definitions removed
- `src/runtime/declarative/*` removed; declarative builders now live only under `presentation`
- kit no longer auto-registers presenters from schema-only registries; custom declarative kinds require explicit schema + presentation registration
- `src/primitives/components/form-root-styles.ts` split below the 300-line cap
- built-in series field definition split below the 300-line cap
- Remaining oversized source files split below the 300-line cap:
  - `src/design/runtime/design-controller.ts`
  - `src/primitives/fields/series-field.ts`
  - `src/runtime/submission/create-submitter.ts`
  - `src/runtime/create-runtime.ts`
  - `src/transport/composition/fanout.ts`
- Runtime definition aliases no longer accept presentation `describe` functions.
- Runtime-owned builtins moved under `src/builtins/definitions`; packs and tests import them from the builtins package boundary.
- Docs/tests old `engine` section paths moved to `runtime`.
- `cloneSchemaRegistry` now only clones explicit registries; default kit pack composition stays in `createFormView`.
- explanations collapsed into reports; explanation top-level API removed.
- report fetch request construction and async transport lifecycle deduplicated.
- module seam debt closed:
  - report context submit result moved to schema-owned neutral DTO
  - report fetch request builder moved to shared
  - `createFormView` split from primitive/design registry ownership
  - kit error navigation now uses a focus adapter seam
  - built-in ML constants/guards moved out of runtime internals
  - graphify output pruned of stale deleted explanation nodes and reclustered
- module interface seam debt closed:
  - report fetch request builder moved from the old shared bucket to schema-owned contract API
  - runtime built-in ML constants facade removed
  - ML pack factory moved out of its old composition cycle and exposed through built-ins
  - kit primitive imports routed through public `@/primitives`
  - default ML composition moved to `@/builtins`
  - behavior contracts imported through public `@/runtime`
- module root API enforcement added:
  - cross-module source imports use only `@/module` root index APIs
  - module subpath aliases removed from source, tests, and docs
- root `mlform` module removed; package public API is now explicit subpath exports only
- layout mount API unified:
  - `mountForm` is the only public kit mount helper
  - wizard/tabs render from `layout.kind`
  - disclosure sections replace the former accordion layout kind
  - architecture test guards against future `@/module/subpath` and cross-module internal imports
- docs concept map added and stale docs copy corrected:
  - concepts sidebar now covers architecture, schema, layout, transport, presentation, and lifecycle
  - mapped-category docs reduced below the 300-line cap
- module-domain debt closed:
  - public `behaviors` module removed; mapped-category behavior now belongs to `builtins`
  - internal `packs` module removed; ML default registry pack now lives in `builtins`
  - `shared` and the temporary `foundation` bucket removed; helpers moved to schema, transport, or built-in field ownership
  - runtime schema normalization now uses schema-owned `normalizeSchema`
  - kit no longer reexports transport helpers or transport option types
  - primitives no longer create ML registry packs by default
- public `mlform/presentation` module removed; descriptor contracts moved into `primitives`, and declarative custom kind helpers moved into `kit`
- `primitives` no longer imports runtime, schema, transport, kit, builtins, or design; runtime compatibility uses local structural controller/request contracts
- public package paths renamed to `mlform/design` and `mlform/builtins`; source modules now live under `src/design` and `src/builtins`
- Boolean built-in required validation no longer models acceptance; `false` is treated as a present boolean value.
- Primitive field frames now refresh descriptors from the descriptor registry when field state changes, preventing valid number values from rendering as blank after blur.
- Boolean fields now distinguish unset (`null`) from explicit `false`; no default value leaves both primitive radio options unselected.
- Field/report backend mapping now uses explicit `mappedTo`; report `source` and report-id backend fallback were removed from active schema contracts.
- `onehot-category` now covers strict 0/1 encoded inputs without hidden subordinate schema fields.
- Package export type paths now point at emitted `dist/types/src/*` declarations.
- Submission results and requests now expose `inputs`, `displayValues`, and `modelValues` so consumers can use `mappedTo`/`displayKey` contracts instead of field ids for external data.
- Validated streaming report updates no longer fall back to report id as an external payload key when `mappedTo` is missing.
- Runtime id boundary now has regression coverage: changing field/report ids changes runtime handles only, not `displayKey`/`mappedTo` external contracts.
- Explicit `displayKey` values are now normalized and duplicate explicit display keys fail before display data can be overwritten; docs now distinguish `id`, `mappedTo`, `displayKey`, and `label`.
- Transport default dedup/cache keys now prefer resolved report `mappedTo` targets over report ids when the mapped target exists.
- Display values no longer use labels as fallback data keys; fields without `displayKey` are omitted from `displayValues`.
- Validated streamed report updates now fail submit when the target report lacks a resolved `mappedTo`, instead of silently ignoring the payload or forcing consumers to infer report ids.
- Public `createSubmissionSnapshot(form, options)` exposes the same submission records before submit so consumers no longer need a transport call to inspect review/export/model payloads.
- Public `resolveOneHotDisplayValue(field, modelValues, options)` restores selected one-hot UI values from saved model columns, including backend-specific targets.
- Submission snapshot coverage now proves backend-specific and numeric `mappedTo` targets produce stable display/model records without consumer-side reconstruction.
- One-hot inactive policy coverage now proves hidden `onehot-category` fields follow `include`, `omit`, and `reset-on-hide` submission behavior without parent field `mappedTo`.
- Mounted kit submit now supports `reportFetchMode: "lazy" | "all" | "none"`; `"all"` exposes full pipeline report fetch results in success events and `"none"` prevents renderer-driven async report fetches.
- Submit results and report fetch requests now expose official report context keyed by runtime report id, with helper lookup by id or resolved `mappedTo` target, removing consumer-side normalized-id report context lookups.
- Report payload lookup now uses only `reports[]` items matched by explicit `mappedTo`, rejects duplicate resolved report targets, strips envelope metadata from payloads, and no longer supports keyed reports, report-id fallback, or alias migration.
- Runtime now exposes schema-aware multi-backend snapshots and pipeline execution. `createFanoutTransport` remains transport-only fanout; multi-model form runs use `executeMultiBackendPipeline` to preserve per-backend mappings, results, errors, skipped reports, and report contexts.
- Runtime id boundaries are explicit: `getField(id)`/`getReport(id)` remain runtime-handle lookups, while `getFieldByDisplayKey` and `getFieldByMappedTo` support external-contract field lookup without label or id fallback.
- Exact report-id payload fallback, keyed report payload maps, and legacy `outputs` fallbacks removed from `resolveMappedReportPayload` and built-in report definitions.
- Submission snapshots without an explicit backend now emit every target in a backend map, so multi-model consumers can use `modelValues` directly without reconstructing from field ids.
- MLSuite local integration now renders, saves, and prefills schema-run visible inputs from MLForm `displayValues`/`displayKey` data instead of reconstructing from field ids, labels, `mappedTo`, or model columns.
- Playwright is now a dev dependency and browser render coverage exercises real mounted UI with custom field/report plugins, `onehot-category`, backend-map `mappedTo`, mapped report payload lookup, and multi-backend report context targets.
- Report payload lookup now resolves backend-map `mappedTo` targets when no single backend is selected, so mounted/fanout-like report arrays bind by external report target without report-id fallback.
- Trusted report plugins can now render custom DOM through `render.mount` while declarative report descriptors remain the default.

## Notes

- Do not add “future maybe” items here. Only active, concrete debt.
- If a debt item is intentionally accepted long-term, mark it explicitly as accepted and explain why.
