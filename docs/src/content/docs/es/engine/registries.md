---
title: Registries
description: Registra campos e informes integrados o personalizados.
---

```ts
import { createBuiltinRegistry, createRegistry } from "mlform/engine";

const empty = createRegistry();
const builtins = createBuiltinRegistry();
```

| Método                       | Propósito            |
| ---------------------------- | -------------------- |
| `registerField(definition)`  | Añade un campo.      |
| `registerReport(definition)` | Añade un informe.    |
| `getField(kind)`             | Resuelve un campo.   |
| `getReport(kind)`            | Resuelve un informe. |
| `listFields()`               | Lista campos.        |
| `listReports()`              | Lista informes.      |

Los registros duplicados lanzan `RegistryError`.
