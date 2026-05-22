---
title: Presentation
description: How fields and reports become visible UI.
---

Schema defines field and report kinds. Presentation decides how those kinds render.

The flow is:

```txt
schema field/report -> normalized runtime state -> presentation descriptor -> primitive renderer
```

Common terms:

| Term | Meaning |
| --- | --- |
| descriptor | Render-ready description for a field or report. |
| presenter | Function that turns schema plus state into a descriptor. |
| primitive | Web Component that renders a descriptor. |
| registry | Place where field kinds, report kinds, presenters, and primitive renderers are registered. |
| pack | Reusable bundle of schema and presentation registrations. |

Built-in ML fields and reports come from the built-in ML pack. Custom kinds need a schema definition and a presentation definition. That keeps data rules and UI rules separate without forcing every app to write low-level DOM code.

Use primitives directly only when the kit is too high-level. Most custom UI should start with `createFormView()`.
