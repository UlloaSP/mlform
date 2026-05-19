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

- Last reviewed: `2026-05-19`
- Current focus: no active debt recorded

## Active Debt

- None.

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
- primitive form root now refreshes report/explanation descriptors when their live state changes
- public runtime re-exports for `define*Kind`, presentation descriptor types, schema registry helpers, and builtin definitions removed
- `src/runtime/declarative/*` removed; declarative builders now live only under `presentation`
- kit no longer auto-registers presenters from schema-only registries; custom declarative kinds require explicit schema + presentation registration
- `src/primitives/components/form-root-styles.ts` split below the 300-line cap
- built-in series field definition split below the 300-line cap
- Remaining oversized source files split below the 300-line cap:
  - `src/design-system/runtime/design-system-controller.ts`
  - `src/primitives/fields/series-field.ts`
  - `src/runtime/submission/create-submitter.ts`
  - `src/runtime/create-runtime.ts`
  - `src/transport/composition/fanout.ts`
- Runtime definition aliases no longer accept presentation `describe` functions.
- Runtime-owned builtins moved under `src/builtins-ml/definitions`; packs and tests import them from the builtins package boundary.
- Docs/tests old `engine` section paths moved to `runtime`.
- `cloneSchemaRegistry` now only clones explicit registries; default kit pack composition stays in `createFormView`.
- explanations collapsed into reports; explanation top-level API removed.
- report fetch request construction and async transport lifecycle deduplicated.

## Notes

- Do not add “future maybe” items here. Only active, concrete debt.
- If a debt item is intentionally accepted long-term, mark it explicitly as accepted and explain why.
