---
title: Runtime without UI
description: Use createForm for schema-driven state, validation, and submission with no DOM, in a browser, a worker, Node.js, or tests.
---

`createForm` from `mlform/runtime` is the core every other layer wraps. It has no layout, no
descriptors, and no DOM, so it runs anywhere JavaScript does: a custom renderer, a web worker, a
Node.js script, or a test.

```ts
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createForm } from "mlform/runtime";

const form = createForm({
  schema: {
    fields: [
      { id: "temperature", kind: "number", label: "Temperature", min: -40, max: 60, required: true, mappedTo: "temperature" },
      { id: "humidity", kind: "number", label: "Humidity", min: 0, max: 100, required: true, mappedTo: "humidity" },
    ],
    reports: [{ id: "forecast", kind: "regressor", label: "Next-hour estimate", mappedTo: "forecast" }],
  },
  registry: createBuiltinMlRegistry(),
  transport: {
    async submit(request) {
      const estimate = Number(request.modelValues.temperature) + 0.6;
      return { reports: [{ backend: "default", mappedTo: "forecast", status: "ready", payload: { value: estimate } }] };
    },
  },
});

form.setValues({ temperature: 21.5, humidity: 58 });
const result = await form.submit();
console.log(result.reportStates.forecast); // { payload: { value: 22.1 }, error: null, status: "ready" }

form.dispose();
```

Unlike `createFormView` and `mountForm`, `createForm` needs an explicit `registry`.
`createBuiltinMlRegistry()` contains the twelve built-in field kinds and two report kinds; add
custom definitions with `registerField` and `registerReport`
([Registries and renderers](/extend/renderers/)). Plugins are a view feature; with the runtime
alone, register their definitions and pass their behaviors as `behaviors`.

## What it gives you

- **State.** `form.state` holds values, errors, `valid`, `dirty`, `touched`, the lifecycle axes,
  report states, and the last result. `subscribe` and `subscribeSelector` notify on changes.
- **Fields and reports.** `form.getField(id)` and `form.getReport(id)` return controllers with their
  own state and methods.
- **Validation and submission.** `form.validate()` and `form.submit()` behave exactly as they do
  under the kit, minus focus handling.
- **Drafts and previews.** `createSnapshot()`, `restoreSnapshot()`, and `createSubmissionSnapshot()`.
- **Pipelines.** `executeFormPipeline` adds report fetches after a submission;
  `executeMultiBackendPipeline` submits to several backends in turn.

The options of `createForm` are those of `createFormView` without the view-only ones (`layout`,
`plugins`, `descriptorRegistry`, `reportFetchMode`): `schema`, `registry`, `transport`, `behaviors`,
`initialValues`, `initialSnapshot`, `validators`, `hooks`, `hookFailurePolicy`,
`inactiveFieldPolicy`, `listenerErrorPolicy`, and `onListenerError`.

Read on:

- [Form controller](/runtime/form-controller/) for every method and the state axes.
- [Field and report controllers](/runtime/field-controller/).
- [Lifecycle and hooks](/guides/hooks-and-lifecycle/).
- [Testing](/guides/testing-mlform/) for using the runtime in unit tests.

To render the runtime with MLForm's Web Components but your own mounting code, see
[Primitives and events](/primitives/overview/).
