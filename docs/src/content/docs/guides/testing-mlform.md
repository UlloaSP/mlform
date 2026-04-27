---
title: Testing MLForm
description: Test transports, mounted forms, hooks, and custom definitions.
---

Test the engine when you need deterministic state. Test mounted primitives when you need DOM behavior.

Transport unit test pattern:

```ts
const transport = {
  submit: vi.fn().mockResolvedValue({
    reports: { prediction: { label: "approved" } },
  }),
};

const mounted = mountForm(container, { schema, transport });
await mounted.form.submit();

expect(transport.submit).toHaveBeenCalledWith(
  expect.objectContaining({ serializedValues: expect.any(Object) }),
);
```

Recommended coverage:

| Feature                | Test                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| Field constraints      | `form.validate()` returns expected field errors.                        |
| Cross-field validators | Invalid combinations block submit.                                      |
| Hooks                  | Hooks receive values, result, and submit count.                         |
| Custom fields          | Definition normalizes, serializes, validates, and describes.            |
| Custom renderers       | Primitive registry maps descriptor component to a valid custom element. |
