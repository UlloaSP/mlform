---
title: Overview de primitives
description: Capa DOM que conecta descriptors del engine con Web Components.
---

Primitives renderiza campos, informes, layout, errores y submit a partir de descriptores del engine.

Úsalo directamente cuando quieras un wrapper propio, renderers personalizados o integración DOM de bajo nivel. Para la mayoría de apps, usa `mountForm`.

`mountForm` espera un contenedor vacio por defecto. Usa `containerStrategy: "replace"` solo cuando quieras reemplazar contenido existente y restaurarlo al desmontar.
