---
title: Schema
description: El contrato del formulario compartido por UI, runtime y backend.
---

`FormSchema` nombra los inputs que MLForm recoge y los reports que espera recibir.

```ts
import type { FormSchema } from "mlform/schema";

const schema: FormSchema = {
  fields: [
    { id: "age", kind: "number", label: "Age", min: 0, max: 120, required: true },
  ],
  reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
};
```

Usa `id` estables en produccion. MLForm puede derivar ids desde labels, pero ids explicitos mantienen predecibles payloads backend, tests, analytics y datos guardados.

Terminos base:

| Termino | Significado |
| --- | --- |
| field | Un valor que el usuario introduce. |
| report | Una salida de modelo mostrada despues de submit o fetch. |
| kind | Clave de registry que selecciona validacion y descriptor UI. |
| condition | Regla como `hiddenWhen`, `disabledWhen` o `readOnlyWhen`. |
| normalized schema | Schema listo para runtime tras resolver ids, defaults, reports y registry checks. |
| inactive field | Campo hidden, disabled o read-only. Su envio depende de policy. |

Schema describe significado, no colocacion en pantalla. Grupos, pasos, tabs y review screens van en layout.
