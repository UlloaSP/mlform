---
title: Mental Model
description: The core ideas behind MLForm before reading the API reference.
---

MLForm has one job: keep form UI, validation state, submitted payloads, and model reports consistent.

| Concept        | Role                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------- |
| Schema         | Describes fields, reports, labels, validation limits, and conditional behavior.               |
| Engine         | Owns normalized ids, current values, field state, report state, validation, and submit state. |
| Transport      | Sends serialized values to a backend or local model.                                          |
| Primitives     | Render engine descriptors as Web Components.                                                  |
| Design system  | Resolves themes, recipes, density, motion, and CSS tokens.                                    |
| Mounted handle | Owns cleanup, design updates, and access to the underlying form controller.                   |

Most applications should start at the kit layer:

```ts
import { mountForm } from "mlform";
```

Use the engine directly when you want headless state without the built-in UI. Use primitives directly when you want MLForm's Web Components but your own application shell.
