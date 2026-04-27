---
title: Errores de servidor
description: Mensajes backend útiles y recuperación en UI.
---

Devuelve JSON con `message` cuando el backend responde con estado no exitoso.

```json
{
  "message": "The model is warming up. Try again in a few seconds."
}
```

```ts
hooks: {
  onSubmitError({ error }) {
    console.error("Prediction failed", error);
  }
}
```

Usa validación de MLForm para errores conocidos antes del submit y errores de servidor para disponibilidad, permisos o fallos del modelo.
