---
title: Testing
description: Test schemas, transports, and custom kinds with the headless runtime, and keep DOM tests for rendering and focus.
---

Most behavior that matters to your application, such as what is valid, what is submitted, and which
report gets which result, lives in the runtime. Test it without a DOM, and keep browser tests for
what only rendering can show.

## Schema and submission

```ts
import { describe, expect, it, vi } from "vitest";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createForm, ValidationError } from "mlform/runtime";
import { schema } from "./forecast-schema";

const ready = { backend: "default", mappedTo: "forecast", status: "ready", payload: { value: 22.1 } };

describe("forecast form", () => {
  it("sends mapped values and routes the result", async () => {
    const transport = { submit: vi.fn().mockResolvedValue({ reports: [ready] }) };
    const form = createForm({ schema, transport, registry: createBuiltinMlRegistry() });

    form.setValues({ temperature: 21.5, humidity: 58 });
    const result = await form.submit();

    expect(transport.submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: { temperature: 21.5, humidity: 58 } }),
    );
    expect(result.reportStates.forecast).toMatchObject({ status: "ready", payload: { value: 22.1 } });
    form.dispose();
  });

  it("blocks out-of-range values before the transport", async () => {
    const transport = { submit: vi.fn() };
    const form = createForm({ schema, transport, registry: createBuiltinMlRegistry() });

    form.setValues({ temperature: 21.5, humidity: 140 });

    await expect(form.submit()).rejects.toBeInstanceOf(ValidationError);
    expect(form.state.errors.fields.humidity).toEqual(["Maximum value is 100."]);
    expect(transport.submit).not.toHaveBeenCalled();
    form.dispose();
  });
});
```

`createSubmissionSnapshot(form)` returns the records without submitting, which is handy for asserting
`modelValues` of complex schemas such as one-hot categories or series aggregations.

## Custom kinds

Register custom definitions on the registry you pass to `createForm`, then test normalization,
validation, and serialization through `form.setValues`, `field.state.errors`, and
`createSubmissionSnapshot`. For plugin kinds, create the form with `createFormView({ plugins })` and
use `view.form`. `validateSchema(schema, registry)` checks that your config schema accepts and
rejects what you expect.

## What needs a browser

| Behavior | Test with |
| --- | --- |
| Values, validation, conditions, submission, routing | `createForm` or `createFormView`, no DOM |
| Layout references and navigation | `createFormView`, no DOM |
| Rendering, focus on invalid submit, keyboard use | `mountForm` in a real browser |
| Custom elements and `render.mount` output | `mountForm` in a real browser |

Wait for observable completion: the promise from `submit()`, a state from `subscribeSelector`, or
an element's `updateComplete`. Avoid fixed sleeps.
