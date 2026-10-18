---
title: Read-only review
description: Lock a form after submission, or show saved answers for review without letting them change.
---

## Lock after a successful submission

A declarative condition locks every field once the latest submission succeeded:

```ts
const locked = { kind: "submission-status", equals: "succeeded" } as const;

const schema = {
  fields: [
    { id: "station", kind: "text", label: "Station", mappedTo: "station", readOnlyWhen: locked },
    { id: "temperature", kind: "number", label: "Temperature", mappedTo: "temperature", readOnlyWhen: locked },
  ],
};
```

Calling `mounted.form.reset()` clears the submission outcome and unlocks the fields.

## Review saved answers

Load the answers as initial values and make every field read-only:

```ts
import { mountForm } from "mlform";
import type { FormSchema } from "mlform/schema";

const review = (schema: FormSchema): FormSchema => ({
  ...schema,
  fields: schema.fields.map((field) => ({ ...field, readOnly: true })),
});

mountForm(container, {
  schema: review(schema),
  initialValues: savedAnswers,
  transport,
  reportPane: "hidden",
});
```

Read-only fields stay visible, focusable, and selectable, and they are still validated and
submitted. Use `disabled` instead when a value should not be sent at all; see
[Conditions](/schema/conditions/#states).
