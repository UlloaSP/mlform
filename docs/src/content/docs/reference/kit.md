---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `mountForm(container, options)`
- `unmountForm(mounted)`
- `createJsonTransport(options)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `MountFormOptions`
- `MountedForm`
- `JsonTransportOptions`
- `JsonTransportMethod`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requires `schema` and either `endpoint` or `transport`.

It also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
