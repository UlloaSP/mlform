---
title: Package Exports
description: Public import paths exposed by MLForm.
---

| Export                 | Use                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mlform`               | Application-facing alias of `mlform/kit` for the normal `mountForm` path.                                                             |
| `mlform/kit`           | Mounted interface, labels, design defaults, and lifecycle. |
| `mlform/view`          | Headless layout composition, navigation, descriptors, and declarative extensions. |
| `mlform/runtime`       | Core form controller, validation, hooks, conditions, and submission orchestration.                                      |
| `mlform/schema`        | Schema types, normalization, registry helpers, and backend request contracts.                                            |
| `mlform/builtins`   | Headless built-in ML field/report definitions and `createBuiltinMlRegistry`.                                             |
| `mlform/transport`     | Transport types, errors, request runner, and named-backend fan-out.                                                        |
| `mlform/primitives`    | Primitive Web Components and renderer registry.                                                                                        |
| `mlform/design` | Theme, recipe, token, and runtime design system APIs.                                                                                  |

Start from `mlform` for the complete kit. Import explicit subpaths when an application needs only one layer.
