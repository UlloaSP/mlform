---
title: Layouts Personalizados
description: Construye wizard, tabs, accordion o shells propios sobre createFormView.
---

Patron base:

1. crear `view`
2. leer `snapshot.layout`
3. renderizar nodos recursivamente
4. usar `field.controller`, `report.controller` y `explanation.controller`
5. volver a renderizar con `subscribe()`

Recuerda:

- `state.visible` viene del engine
- `visibleInLayout` viene del layout activo

Si solo necesitas UI integrada, usa `mountForm()`, `mountWizardForm()` o `mountTabsForm()`.
