---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `mountForm(container, options)`
- `unmountForm(mounted)`
- `createJsonTransport(options)`
- `createRoutingTransport(options)`
- `createFanoutTransport(options)`
- `createFallbackTransport(options)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `MountFormOptions`
- `MountedForm`
- `JsonTransportOptions`
- `JsonTransportMethod`
- `RoutingTransportOptions`
- `FanoutTransportOptions`
- `FanoutTransportResult`
- `FallbackTransportOptions`
- `FallbackTransportFailure`
- `TransportCollection`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requires `schema` and exactly one transport strategy:

- `endpoint`
- `transport`

Advanced routing, fan-out, and fallback behavior should be composed inside `transport`.

It also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
