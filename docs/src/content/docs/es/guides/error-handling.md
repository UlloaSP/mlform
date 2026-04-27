---
title: Manejo de errores
description: ValidationError, SubmitError, SubmissionAbortedError y patrones de recuperación.
---

| Error                    | Significado                                         |
| ------------------------ | --------------------------------------------------- |
| `ValidationError`        | El submit no pasó validación. Incluye `result`.     |
| `SubmitError`            | Falló transporte, parse o backend. Incluye `cause`. |
| `SubmissionAbortedError` | El submit se canceló.                               |

```ts
try {
  await mounted.form.submit();
} catch (error) {
  console.error(error);
}
```

Devuelve mensajes backend claros con JSON, por ejemplo `{ "message": "Model unavailable" }`. Para errores por informe, marca solo ese informe como error cuando uses `resolvePayload`.
