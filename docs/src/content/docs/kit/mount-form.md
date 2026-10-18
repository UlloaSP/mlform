---
title: mountForm
description: Reference for mountForm, its options, and the MountedForm handle it returns.
---

```ts
import { mountForm, unmountForm } from "mlform";

const mounted = mountForm(container, options);
```

`mountForm` creates a [view](/view/create-form-view/) from the options, renders it with the
built-in Web Components inside `container`, attaches the design system, and returns a handle.
Setup errors (an invalid schema or layout, a non-empty container) throw before anything is shown.

## Options

`MountFormOptions` accepts every [createFormView option](/view/create-form-view/#options) plus
the rendering options below.

| Option | Default | Purpose |
| --- | --- | --- |
| `schema` | required | The [form schema](/schema/overview/). |
| `transport` | required | The [transport](/guides/transports/). |
| `layout` | stacked | [Layout config](/view/layouts/). Custom nodes are rejected. |
| `plugins` | none | [Plugins](/extend/plugins/) with custom kinds and behaviors. |
| `initialValues`, `initialSnapshot` | none | [Starting values or a draft](/schema/initial-values/). |
| `validators`, `hooks`, `hookFailurePolicy` | none | [Validation](/guides/validation/) and [hooks](/guides/hooks-and-lifecycle/). |
| `inactiveFieldPolicy` | `"omit"` | [Submission of hidden and disabled fields](/schema/conditions/#inactive-fields-and-submission). |
| `reportFetchMode` | `"lazy"` | When [report fetches](/guides/report-fetches/) run. |
| `designSystem` | `neutral`, `default`, `auto` | [Theme, recipe, mode, overrides](/design/themes-and-recipes/). |
| `designSystemRegistry` | built-ins | Registry with [custom themes and recipes](/design/custom-themes/). |
| `onDesignSystemChange` | none | Called with each resolved design system. |
| `labels` | English defaults | [Shell labels](/kit/labels/). |
| `primitiveText` | English defaults | [Control text](/kit/labels/#control-text). |
| `primitiveRegistry` | built-ins | Custom elements for [custom kinds](/extend/renderers/). |
| `reportPane` | `"auto"` | `"hidden"` hides reports in every layout. In the default stacked and split layouts, `"always"` shows the report area before the first submission. |
| `reportTransport` | none | Adds the [Details panel](/schema/reports/#details-panel) to built-in reports. |
| `containerStrategy` | `"error"` | `"replace"` mounts over existing content and restores it on unmount. |
| `hostLifecycle` | `"manual"` | `"document"` suspends while the page is hidden. |
| `registry`, `descriptorRegistry`, `behaviors`, `listenerErrorPolicy`, `onListenerError` | | Lower-level options, as in `createFormView`. |

Without `layout`, or with a stacked or split layout without `children`, the form renders as an
inputs panel and a reports panel. With `children`, a wizard, or tabs, it renders the layout's nodes
with a footer that holds navigation and the submit button.

## The handle

| Member | Purpose |
| --- | --- |
| `form` | The [form controller](/runtime/form-controller/): values, state, validation, subscriptions. |
| `host` | The element MLForm inserted into the container. |
| `submit(options?)` | Validates and submits with the form's `reportFetchMode`. On invalid input it reveals and focuses the first invalid field, then rejects with `ValidationError`. |
| `updateDesignSystem(config)` | Merges a design change. |
| `replaceDesignSystem(config)` | Replaces the design config; requires `mode`, `theme`, and `recipe`. |
| `resetDesignSystem()` | Returns to the design system given at mount. |
| `designSystem` | The attachment: current `config`, `resolved` values, and its `registry`. |
| `engineRegistry`, `descriptorRegistry`, `primitiveRegistry`, `designSystemRegistry` | The registries this form uses. |
| `suspend(reason?)`, `resume()` | Pause and continue; see [Lifecycle and hooks](/guides/hooks-and-lifecycle/#suspend-and-resume). |
| `unmount()` | Disposes the form, aborts pending work, disconnects the design system, removes the host, and restores replaced content. |

`mounted.form.submit()` runs the same submission without moving focus and without the view's report
fetch mode; prefer `mounted.submit()` from UI code.

## Containers

- The container must be empty unless `containerStrategy: "replace"` is set.
- Mounting again into a container that holds an MLForm form keeps the old form until the new one is
  ready, then replaces it. If the new setup fails, the old form stays.
- `unmountForm(mounted)` is the same as `mounted.unmount()`, for code that prefers a function.
- To mount inside an iframe, load MLForm in the iframe first; see
  [Frameworks](/integrations/frameworks/#iframes).
