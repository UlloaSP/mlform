---
title: Presentation
description: Como campos y reports se convierten en UI visible.
---

Schema define tipos de campo y report. Presentation decide como se renderizan.

El flujo:

```txt
schema field/report -> estado runtime normalizado -> descriptor de presentation -> primitive renderer
```

Terminos comunes:

| Termino | Significado |
| --- | --- |
| descriptor | Descripcion lista para render de un campo o report. |
| presenter | Funcion que convierte schema mas estado en descriptor. |
| primitive | Web Component que renderiza un descriptor. |
| registry | Lugar donde se registran field kinds, report kinds, presenters y primitive renderers. |
| pack | Bundle reutilizable de registros de schema y presentation. |

Los campos y reports ML integrados vienen del pack ML integrado. Los tipos custom necesitan una definicion de schema y una de presentation. Asi las reglas de datos y las reglas de UI quedan separadas sin obligar a cada app a escribir DOM de bajo nivel.

Usa primitives directamente solo cuando kit es demasiado alto nivel. Para la mayoria de UI custom, empieza con `createFormView()`.
