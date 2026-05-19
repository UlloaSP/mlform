---
title: createFormView
description: Guia de la API headless orientada a aplicaciones.
---

```ts
const view = createFormView(options);
```

Devuelve:

- `form`
- `engineRegistry`
- `presentationRegistry`
- `state`
- `getSnapshot()`
- `validate()`
- `submit()`
- `reset()`
- `subscribe()`
- `nextStep()`, `prevStep()`, `goToStep()`
- `setActiveTab()`, `nextTab()`, `prevTab()`
- `toggleSection()`, `openSection()`, `closeSection()`
- `openAllSections()`, `closeAllSections()`

`wizard` en el snapshot solo existe cuando `layout.kind === "wizard"`.

`tabs` en el snapshot solo existe cuando `layout.kind === "tabs"`.

`accordion` en el snapshot solo existe cuando `layout.kind === "accordion"`.

Cada item de `fields` y `reports` expone:

- `controller`
- `state`
- `descriptor`
- `stepId`
- `tabId`
- `visibleInLayout`
