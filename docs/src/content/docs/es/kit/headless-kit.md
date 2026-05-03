---
title: Kit Headless
description: Usa createFormView para controlar layouts personalizados sin bajar a engine puro.
---

`createFormView()` vive entre `mountForm()` y `mlform/runtime`.

Te da:

- `FormController`
- registries clonados
- layout validado y normalizado
- colecciones render-ready
- helpers de navegacion para `wizard` y `tabs`

Usalo cuando el host necesita UI propia, pero no quieres reconstruir estado, validacion y submit desde cero.
