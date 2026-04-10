---
title: Package Exports
description: Public import paths exposed by MLForm.
---

| Export                 | Use                                                           |
| ---------------------- | ------------------------------------------------------------- |
| `mlform`               | Application-facing kit exports.                               |
| `mlform/kit`           | Same kit surface with explicit import path.                   |
| `mlform/engine`        | Core form controller, registry, schema, transport, and types. |
| `mlform/primitives`    | Primitive Web Components and renderer registry.               |
| `mlform/design-system` | Theme, recipe, token, and runtime design system APIs.         |

Prefer `mlform` for application mounts. Use subpaths for advanced integrations.
