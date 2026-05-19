---
title: Registries
description: Register built-in and custom field and report definitions.
---

The engine registry maps field/report `kind` values to definitions.

```ts
import { createMlRegistryPack } from "mlform/builtins-ml";
import { createRegistry } from "mlform/schema";

const empty = createRegistry();
const builtins = createMlRegistryPack().registry;
```

| Method                       | Purpose                      |
| ---------------------------- | ---------------------------- |
| `registerField(definition)`  | Add a field kind.            |
| `registerReport(definition)` | Add a report kind.           |
| `getField(kind)`             | Resolve a field definition.  |
| `getReport(kind)`            | Resolve a report definition. |
| `listFields()`               | List registered fields.      |
| `listReports()`              | List registered reports.     |

Duplicate registrations throw `RegistryError`. Register custom definitions once when the app starts, then reuse the registry.
