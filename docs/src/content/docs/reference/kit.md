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
