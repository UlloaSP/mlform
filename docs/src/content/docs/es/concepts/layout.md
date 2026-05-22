---
title: Layout
description: Como MLForm separa significado de campo y estructura de pantalla.
---

`schema` no es layout. Un campo puede conservar id, validacion, default value y significado backend aunque se mueva entre una pagina, tabs, pasos de wizard o una shell propia.

`layout` controla la estructura visual:

| Idea | Significado |
| --- | --- |
| `stacked` | Campos y reports en orden. |
| `split` | Layout primitivo integrado con dos areas. |
| `wizard` | Navegacion paso a paso sobre nodos de layout. |
| `tabs` | Navegacion por tabs sobre nodos de layout. |
| `section` | Nodo de grupo; tambien puede funcionar como disclosure. |
| layout headless | `createFormView()` devuelve nodos listos para render y estado de navegacion. |

El mismo config de layout puede ir por mounts integrados o por un host custom. Las rutas integradas usan `mountForm()`. Los hosts custom usan `createFormView()`.

Mantén la semantica de campos fuera del layout. Labels, validacion, ids y claves backend van en schema. Grupos, orden, pasos, tabs y pantallas de review van en layout.
