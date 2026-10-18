---
title: Primitives and events
description: Reference for MLForm's Web Components, low-level mounting with mountPrimitiveForm, and the submit events of mlf-form.
---

`mlform/primitives` contains the Web Components every built-in control is made of. The kit and the
primitive adapter use them for you; this page is for code that mounts them directly or listens to
their events.

## Elements

| Element | Renders |
| --- | --- |
| `mlf-form` | The default form: inputs panel, reports panel, submit button. |
| `mlf-field-frame`, `mlf-report-frame` | The frame around one field or report: label, help, feedback, report states. |
| `mlf-submit-button`, `mlf-form-errors` | Submit control and form-level errors. |
| `mlf-text-field`, `mlf-long-text-field`, `mlf-number-field`, `mlf-boolean-field`, `mlf-category-field`, `mlf-single-choice-field`, `mlf-multi-choice-field`, `mlf-rating-field`, `mlf-date-field`, `mlf-series-field` | Built-in field controls. `mapped-category` and `onehot-category` use `mlf-category-field`. |
| `mlf-classifier-report`, `mlf-regressor-report` | Built-in reports. |
| `mlf-declarative-field`, `mlf-declarative-report`, `mlf-mounted-report` | Renderers for `defineFieldKind` and `defineReportKind` kinds. |
| `mlf-unsupported-component` | Placeholder naming a descriptor component without a registered element. |

`primitiveTagNames` exports these names. The elements register themselves when `mlform` or
`mlform/primitives` is imported.

## Mount a runtime form

`mountPrimitiveForm` renders a [runtime form](/runtime/overview/) with `mlf-form`, for code that
creates the form itself:

```ts
import { createBuiltinMlRegistry } from "mlform/builtins";
import { mountPrimitiveForm } from "mlform/primitives";
import { createForm } from "mlform/runtime";
import { createBuiltinDescriptorRegistry } from "mlform/view";

const form = createForm({ schema, transport, registry: createBuiltinMlRegistry() });
const mounted = mountPrimitiveForm(container, form, {
  descriptorRegistry: createBuiltinDescriptorRegistry(),
  layout: "split",
  submitLabel: "Run forecast",
});

// later
mounted.unmount();
form.dispose();
```

Options: `descriptorRegistry` (required to render the built-in kinds), `registry` (a primitive
registry), `layout` (`"stacked"` or `"split"`), `reportPane`, `containerStrategy`, the labels
`formLabel`, `reportsLabel`, `submitLabel`, `validatingLabel`, `submittingLabel`, `text`
(primitive text), `reportTransport`, and `reportFetchMode`. It does not attach a design system; use
[`attachDesignSystem`](/design/tokens/#without-the-kit). Prefer `mountForm` unless you need this
level of control.

## Submit events

Built-in submit controls dispatch these events from their form host in every layout: default,
explicit stacked or split, tabs, and wizard. They bubble and cross shadow boundaries.

| Event | Detail |
| --- | --- |
| `mlf-submit-request` | None. Sent by `mlf-submit-button` when clicked. |
| `mlf-submit-start` | `{ form, state }` |
| `mlf-submit-success` | `{ form, state, result, pipelineResult? }` |
| `mlf-submit-error` | `{ form, state, error, status }` |
| `mlf-submit-abort` | `{ form, state, error, status }` |

```ts
import type { PrimitiveSubmitSuccessDetail } from "mlform/primitives";

mounted.host.addEventListener("mlf-submit-success", (event) => {
  const { result } = (event as CustomEvent<PrimitiveSubmitSuccessDetail>).detail;
  console.log(result.reportStates);
});
```

A UI submission emits one start event, followed by success, error, or abort. Validation failures
emit error without calling the transport. Programmatic calls to `form.submit()` or
`mounted.submit()` do not dispatch DOM events; use [hooks](/guides/hooks-and-lifecycle/#hooks) or
`form.subscribeTransitions()` to observe every submission.

Application-owned submit controls can call `executePrimitiveSubmit(host, form)` from
`mlform/primitives` to emit the same lifecycle. An optional third argument supplies an async
execution function returning `{ result, pipelineResult? }`; errors are emitted and rethrown.

## Report frames

While every report is idle or loading, `mlf-form` shows one summary for the report area. Once
reports settle, each `mlf-report-frame` shows its own skipped or error state, or mounts the
report's renderer. The texts come from primitive text (`reportsEmptyTitle`, `reportsEmptyBody`,
`reportStateTitle`, `reportStateMessage`).
