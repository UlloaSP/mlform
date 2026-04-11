---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
---

Exports:

- `mountForm(container, options)`
- `unmountForm(mounted)`
- `createJsonTransport(options)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Tipos:

- `MountFormOptions`
- `MountedForm`
- `JsonTransportOptions`
- `JsonTransportMethod`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requiere `schema` y tambien `endpoint` o `transport`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
