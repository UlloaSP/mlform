---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
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

Tipos:

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

`MountFormOptions` requiere `schema` y un `transport`.

`createFormView()` usa los mismos inputs de schema y transport, pero devuelve una API headless.

`mountForm()` renderiza layouts stacked, split, wizard, tabs y disclosure desde el mismo contrato de layout.

Compón routing, fan-out, fallback, auth, retries, streaming y transforms con `mlform/transport`, luego pasa el transport resultante al kit.

Kit tambien propaga opciones del engine como `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy` y `onListenerError`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
