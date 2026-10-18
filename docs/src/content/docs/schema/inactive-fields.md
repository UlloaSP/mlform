---
title: Inactive Fields
description: Submission behavior for hidden, disabled, and read-only fields.
---

Fields can be inactive through static flags or dynamic conditions.

```ts
import { predictionTransport } from "./prediction-transport";

{
  id: "admin_notes",
  kind: "text",
  label: "Admin notes",
  hiddenWhen: { kind: "field-value", field: "mode", notEquals: "review" }
}
```

## State Meaning

| State      | User can see it | User can edit it | Default submission behavior              |
| ---------- | --------------- | ---------------- | ---------------------------------------- |
| `hidden`   | No              | No               | Omitted when inactive.                   |
| `disabled` | Usually yes     | No               | Omitted when inactive.                   |
| `readOnly` | Yes             | No               | Included unless also hidden or disabled. |

The kit default is `inactiveFieldPolicy: "omit"`. That keeps backend payloads focused on active user choices.

Use `inactiveFieldPolicy: "include"` to retain mapped hidden or disabled values in submission.
It does not add missing mappings or override `includeInSubmission: false`. Hidden and disabled
fields skip field validation even under this policy; the backend must validate values it receives.

Read-only and disabled controls use muted text and backgrounds and hide the editing caret.
Read-only text and numeric controls remain focusable so users can select and copy their values.
Hidden fields occupy no layout space. Read-only fields remain subject to validation.

```ts
mountForm(container, {
  transport: predictionTransport,
  schema,
  inactiveFieldPolicy: "include",
});
```

## Practical Guidance

- Use `hiddenWhen` for branch-specific fields.
- Use `disabledWhen` when the user should understand why a value is unavailable.
- Use `readOnlyWhen` for review mode or locked data.
- Keep backend validation aligned with the chosen inactive field policy.
