---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `createFormView(options)`
- `mountForm(container, options)`
- `unmountForm(mounted)`
- `defineMLFormPlugin(plugin)`
- `walkLayoutNodes(layout, visitor)`
- `flattenLayoutNodes(layout)`
- `collectLayoutReferences(layout)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `CreateFormViewOptions`
- `MLFormPlugin`
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

Pass an application-owned transport into kit. `mlform/transport` provides fan-out for independent
named backends; protocol, authentication, retry, and caching remain application concerns.

Kit also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
