---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `createFormView(options)`
- `mountForm(container, options)`
- `unmountForm(mounted)`
- `walkLayoutNodes(layout, visitor)`
- `flattenLayoutNodes(layout)`
- `collectLayoutReferences(layout)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `CreateFormViewOptions`
- `FormLayoutConfig`
- `FormLayoutNode`
- `FormLayoutSectionNode`
- `FormLayoutGroupNode`
- `FormLayoutFieldNode`
- `FormLayoutReportNode`
- `FormViewController`
- `FormViewSnapshot`
- `FormViewState`
- `WizardLayoutConfig`
- `WizardStepConfig`
- `WizardState`
- `TabsLayoutConfig`
- `TabLayoutConfig`
- `TabsState`
- `DisclosureState`
- `MountFormOptions`
- `MountedForm`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requires `schema` and one `transport`.

`createFormView()` uses the same schema and transport inputs, but returns a headless snapshot API instead of mounting DOM.

`mountForm()` renders the built-in stacked, split, wizard, tabs, and disclosure layouts from the same layout contract.

Compose routing, fan-out, fallback, auth, retries, streaming, and transforms through `mlform/transport`, then pass the resulting transport into kit.

Kit also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
