---
title: Troubleshooting
description: Symptoms, causes, and fixes for the problems MLForm integrations run into most often.
---

## The form does not appear

| Symptom | Cause | Fix |
| --- | --- | --- |
| `mountForm` throws about the container | The element already has content. | Mount into an empty element, or pass `containerStrategy: "replace"`. |
| `Cannot read properties of null` | `querySelector` ran before the element existed. | Mount from a lifecycle hook or after the element is in the document. |
| `Unknown field kind "x".` | The kind is not registered. | Use a [built-in kind](/schema/fields/) or pass the [plugin](/extend/plugins/) that defines it. |
| `Duplicate explicit id "x" in schema.` | Two explicit ids are identical. | Give every field a distinct id; `max_temp` and `max-temp` are different ids. |
| `Layout references unknown field "customer_age".` | The reference does not match an exact runtime id. | Match the schema id exactly in layouts and code; see [Ids](/schema/overview/#ids). |
| `Field "x" is missing from layout.` | An explicit layout must place every field. | Add it, or place it in a `custom` node. See [Layout config](/view/layout-schema/#errors). |
| A custom field renders `Missing primitive mapping…` | The presenter names a component without an element. | Register it with `primitiveRegistry`; see [Registries and renderers](/extend/renderers/). |
| Fonts look different from these docs | MLForm does not load fonts. | Load the theme's fonts in your app; see [Themes](/design/themes-and-recipes/#themes). |

## Values and submission

| Symptom | Cause | Fix |
| --- | --- | --- |
| A model input is missing from the request | The field has no `mappedTo`, is hidden or disabled, or has `includeInSubmission: false`. | Add `mappedTo`; for inactive fields see [inactive field policy](/schema/conditions/#inactive-fields-and-submission). |
| `form.getField("x")` returns `undefined` | The id is missing or differs in spelling or case. | Explicit ids stay unchanged. Inspect `form.fields.map((field) => field.id)` for generated ids. |
| Loaded data shows errors immediately | Synchronous constraints run on initial values. | Fix the data or the constraints; errors for non-empty values do not wait for blur. |
| `Form submission is already in progress.` | `submit()` was called while another submission ran. | Wait for the first, or `abortSubmit()` it. |
| A field cannot be changed from code | Hidden, disabled, and read-only fields reject `setValue`. | Give them values through `defaultValue`, `initialValues`, or a mapped category. |

## Reports

| Symptom | Cause | Fix |
| --- | --- | --- |
| A report stays "Awaiting submission" after submitting | No envelope matched its `backend` and `mappedTo`. | Return `{ backend: "default", mappedTo: <report's mappedTo>, status: "ready", payload }`. Ids and labels are never used. |
| `Invalid report result at index n: …` | An envelope breaks the [contract](/guides/backend-contract/#envelopes). | Fix the shape the transport returns. |
| `Duplicate report result for backend…` | Two envelopes for one report. | Return one envelope per backend output. |
| Every report shows the same error | The transport threw. | See [Errors](/guides/error-handling/#transport-failures). |
| A per-backend report is idle after `executeMultiBackendPipeline` | The form shows the last run only. | Read `runs`, or use a [fan-out transport](/guides/multiple-backends/#one-submission-several-services). |

## Events and styling

| Symptom | Cause | Fix |
| --- | --- | --- |
| `mlf-submit-success` never fires | The submission was called programmatically rather than from a built-in submit control. | Use hooks or `subscribeTransitions` to observe both UI and programmatic submissions; see [Submit events](/primitives/overview/#submit-events). |
| The form ignores the page's dark mode | `mode` is `auto` or fixed. | Use `mode: "inherit"` and, if needed, `hostSchemeResolver`. |
| A custom theme does not apply | It was registered after mounting, or on a registry the form did not copy. | Register before mounting, or on `mounted.designSystem.registry`. |

When nothing here matches, check the browser console for the error MLForm threw and the network
panel for what your transport sent and received.
