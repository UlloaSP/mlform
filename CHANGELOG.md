# Changelog

## 0.2.0 — 2026-10-19

### Upgrade from 0.1.x

- Explicit field and report ids now stay exactly as declared. An id such as `customer_age`
  is accessed with `getField("customer_age")`, and the same string is used in initial values,
  conditions, mapped-category targets, layout references, and snapshots. Remove code that
  converts explicit ids to kebab case. To retain existing stored drafts, keep the old runtime
  id explicitly in the schema or migrate the draft at the application boundary. Blank ids,
  whitespace, and the reserved keys `__proto__`, `constructor`, and `prototype` are rejected.
  Generated ids still use kebab case and now avoid explicit ids regardless of declaration order.
- `MultiBackendRunResult.skippedReportIds` is renamed to `skippedReportFetchIds`.
  It identifies reports for which no additional fetch ran, including reports already returned
  ready by submission. Read `submitResult.reportStates` for report outcomes.
- Invalid `long-text` length bounds and `rating` ranges fail during schema normalization,
  before any values are validated.
- Removed unused `builtinValidationMessages.timestampsUnique`, `timestampsAscending`, and
  `timestampsDescending`. Series do not impose those ordering or uniqueness constraints.

### Added

- Per-form `formatValidationMessage` on the runtime, view, and kit. Stable message codes,
  arguments, and field context allow translating built-in validation, required checks, and
  series diagnostics. Custom validators receive the same resolver as `context.formatMessage`.
- `field.formatValidationMessage` and presenter `context.formatMessage` keep custom diagnostics
  consistent with runtime validation.
- `executePrimitiveSubmit` for application-owned submit controls that need the built-in DOM
  event lifecycle.

### Fixed

- Built-in submit controls emit one `mlf-submit-start` followed by success, error, or abort
  across default, explicit stacked/split, tabs, and wizard layouts. Non-lazy submissions include
  their pipeline result. Programmatic submissions remain observable through hooks and transitions.
- Section footers omit the count when no sections exist and use `1 section open` for one section.
- Layout group columns and split panels adapt to the form container width rather than the viewport.
- Regressor interval labels reserve their own space and wrap long values/units without clipping,
  and use the theme text color to stay readable in dark mode.
- `mounted.designSystemRegistry` exposes the registry used by the attached design controller,
  so registrations can be used by subsequent `updateDesignSystem` calls.

### Documentation

- Reorganized guides and references, added form captures and diagrams, and aligned documentation
  styling with the eshkra and MLForm landings.
- Updated identity, localization, layout, and multi-backend guides to the 0.2.0 contracts.
