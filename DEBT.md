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

- Last reviewed: `2026-05-04`
- Current focus: remove old runtime compatibility surface

## Critical

### Oversized Source Files

None currently. Root `AGENTS.md` size debt is cleared in `src/` for now.

## High

### Runtime Still Owns Old Compatibility Surface

1. Old registry workflow still leaks in some APIs/docs
   - Scope:
     - `src/kit/defaults.ts`
     - `src/kit/view.ts`
     - docs
   - Problem: `createBuiltinRegistry` is gone, but docs/tests still lean on runtime-facing registry story instead of explicit schema + presentation + packs architecture
   - User impact: architecture still feels partly monolithic even after split
   - Exit condition: finish pack-based migration and remove remaining old registry ergonomics/copy

2. Runtime handles still expose `.descriptor`
   - Scope:
     - `src/runtime/fields/controller.ts`
     - `src/runtime/reports/controller.ts`
     - `src/runtime/explanations/controller.ts`
     - runtime types/tests using `form.fields[i].descriptor`
   - Problem: runtime still coupled to presentation
   - User impact: blocks final runtime/presentation separation
   - Exit condition: kit/primitives/tests fully use presenter/view snapshot path and runtime descriptor getters are removed

3. `runtime/builtins/*` still active
   - Scope:
     - `src/runtime/builtins/*`
     - `src/packs/default.ts`
     - `src/packs/ml.ts`
     - `src/builtins-ml/index.ts`
   - Problem: builtins not yet moved to `schema/presentation/builtins-ml` proper homes
   - User impact: keeps runtime impure
   - Exit condition: generic fields live in `schema` + `presentation`, ML reports live only in `builtins-ml`

4. `runtime/declarative/*` still active
   - Scope:
     - `src/runtime/declarative/*`
     - runtime exports/docs/tests
   - Problem: duplicate tree; runtime still owns declarative helpers
   - User impact: import confusion and mixed contracts
   - Exit condition: `presentation` owns all declarative builders and runtime copies are removed

## Medium

### View / Primitive Descriptor Flow Still Mixed

1. Plain primitives path still leans on controller descriptors
   - Scope:
     - `src/primitives/components/field-frame.ts`
     - `src/primitives/components/report-frame.ts`
     - `src/primitives/components/explanation-panel.ts`
     - `src/primitives/components/form-root-templates.ts`
   - Problem: kit roots now pass snapshot descriptors, but plain primitive form path still uses controller fallback for live behavior
   - User impact: prevents full deletion of runtime `.descriptor`
   - Exit condition: primitive root path gets stable presenter-driven snapshot or equivalent live descriptor refresh without runtime getter fallback

2. `kit/view-snapshot.ts` still falls back to runtime descriptors
   - Problem: compatibility for old custom kinds registered only in schema
   - User impact: custom declarative kinds can work without presenter registry in some old paths, but separation stays incomplete
   - Exit condition: tests/docs/custom kind setup require dual registration and runtime descriptor fallback is removed

### Docs / Tests Still Teach Old API

1. Old runtime imports remain in docs and tests
   - Examples:
     - `README.md`
     - `docs/src/content/docs/engine/*`
     - `docs/src/content/docs/es/engine/*`
     - `test/unit/engine.test.ts`
     - many integration tests
   - Problem: public story still leans on runtime `define*Kind` and runtime descriptors instead of final split
   - User impact: consumers learn obsolete API
   - Exit condition: docs/tests rewritten to `schema + presentation + packs`

2. `test/unit/engine.test.ts` still encodes old architecture
   - Problem: file name and assertions are tied to removed `engine` concept and runtime descriptors
   - Exit condition: split into `runtime`, `schema`, `presentation`, `behaviors`, `builtins-ml` suites

## Low

### Naming Debt

1. `cloneSchemaRegistry` still defaults to ML registry pack
   - Scope:
     - `src/kit/defaults.ts`
     - `src/kit/view.ts`
   - Problem: helper still hides pack composition behind registry cloning
   - Exit condition: default kit path uses explicit pack/presentation composition flow and helper surface is simplified

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
- `src/design-system/runtime/design-system-controller.ts` split
- `src/transport/internal.ts` split
- `createBuiltinRegistry` removed
- public `EngineRegistry` name removed

## Notes

- Do not add “future maybe” items here. Only active, concrete debt.
- If a debt item is intentionally accepted long-term, mark it explicitly as accepted and explain why.
