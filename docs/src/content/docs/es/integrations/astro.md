---
title: Astro
description: Usa un script de cliente o un island para montar MLForm.
---

```astro
<div id="prediction-form"></div>

<script>
  import { mountForm } from "mlform/kit";
  import { createJsonTransport } from "mlform/transport";

  const container = document.querySelector("#prediction-form");
  if (container) {
    mountForm(container, { transport: createJsonTransport({ endpoint: "/api/predict" }), schema });
  }
</script>
```

Si el formulario vive dentro de un componente hidratado, monta en el lifecycle del framework del island y desmonta al limpiar.
