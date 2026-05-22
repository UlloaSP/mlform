---
title: Package Exports
description: Public import paths exposed by MLForm.
---

| Export                 | Use                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mlform/kit`           | Application-facing kit exports, including `mountForm`, layout helpers, labels, design defaults, and `createFormView`. |
| `mlform/runtime`       | Core form controller, validation, hooks, conditions, and submission orchestration.                                      |
| `mlform/schema`        | Schema types, normalization, registry helpers, and backend request contracts.                                            |
| `mlform/presentation`  | Declarative field/report kind definition and presentation registry APIs.                                                 |
| `mlform/builtins-ml`   | Built-in ML fields, reports, presenters, and default ML registry pack.                                                   |
| `mlform/transport`     | Transport adapters, middleware, resilience policies, and orchestration helpers.                                          |
| `mlform/primitives`    | Primitive Web Components and renderer registry.                                                                                        |
| `mlform/design-system` | Theme, recipe, token, and runtime design system APIs.                                                                                  |

Import from explicit subpaths. The package has no root module export.
