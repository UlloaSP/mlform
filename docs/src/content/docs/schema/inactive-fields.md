---
title: Inactive Fields
description: Submission behavior for hidden, disabled, and read-only fields.
---

Fields can be inactive through static flags or dynamic conditions.

```ts
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

Use `inactiveFieldPolicy: "include"` when the backend must receive the full state snapshot.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  inactiveFieldPolicy: "include",
});
```

## Practical Guidance

- Use `hiddenWhen` for branch-specific fields.
- Use `disabledWhen` when the user should understand why a value is unavailable.
- Use `readOnlyWhen` for review mode or locked data.
- Keep backend validation aligned with the chosen inactive field policy.
