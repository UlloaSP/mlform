---
title: Categoria OneHot
description: Campo compacto para inputs de modelo con one-hot estricto.
---

`onehot-category` se renderiza como categoria y envia una columna 0/1 por opcion. La opcion seleccionada vale `1`; las demas valen `0`.

```ts
const schema = {
  fields: [
    {
      kind: "onehot-category",
      id: "color",
      label: "Color",
      required: true,
      options: [
        { label: "Red", value: "red", mappedTo: "is_red" },
        { label: "Green", value: "green", mappedTo: "is_green" },
        { label: "Blue", value: "blue", mappedTo: "is_blue" },
      ],
    },
  ],
};
```

Seleccionar `green` envia:

```json
{ "is_red": 0, "is_green": 1, "is_blue": 0 }
```

No hacen falta campos hidden subordinados.

Reglas:

- `mappedTo` acepta clave, posicion numerica o mapa por backend.
- targets `mappedTo` duplicados fallan.
- targets sin resolucion para el backend fallan.
- usa `mapped-category` solo para mappings arbitrarios.
