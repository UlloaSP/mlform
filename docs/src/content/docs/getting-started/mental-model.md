---
title: Mental Model
description: The core ideas behind MLForm before reading the API reference.
---

MLForm has one job: keep form UI, validation state, submitted payloads, and model reports consistent.

| Concept        | Role                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------- |
| Schema         | Describes fields, reports, labels, validation limits, and conditional behavior.               |
| Runtime        | Owns current values, field state, report state, validation, and submission. |
| View           | Combines runtime state with layout, navigation, and render descriptors. |
| Transport      | Sends serialized values to a backend or local model.                                          |
| Primitives     | Render view descriptors as Web Components. |
| Design system  | Resolves themes, recipes, density, motion, and CSS tokens.                                    |
| Mounted handle | Owns cleanup, design updates, and access to the underlying form controller.                   |

Most applications should start at the kit layer:

```ts
import { mountForm } from "mlform/kit";
```

Use the runtime directly when you want headless state without the built-in UI. Use the view layer
for headless layout and navigation, and primitives when you want MLForm's Web Components in your
own application shell.
