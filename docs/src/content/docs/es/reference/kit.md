---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
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

Tipos:

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

`MountFormOptions` requiere `schema` y exactamente una estrategia de transporte:

- `endpoint`
- `transport`

El comportamiento avanzado de routing, fan-out y fallback debe componerse dentro de `transport`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
