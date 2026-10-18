---
title: createFormView
description: Reference for createFormView options, the FormViewController, and the snapshot it produces.
---

```ts
import { createFormView } from "mlform/view";

const view = createFormView(options);
```

Creates the runtime form, resolves registries, plugins, and layout, and returns a controller with
render descriptors and navigation. It creates no DOM and attaches no styles. The guide is
[Headless view](/view/overview/).

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `schema` | required | [Form schema](/schema/overview/). |
| `transport` | required | [Transport](/guides/transports/). |
| `layout` | stacked | [Layout config](/view/layout-schema/). |
| `plugins` | none | [Plugins](/extend/plugins/): kinds and behaviors registered together. |
| `initialValues` | none | Values by runtime id. |
| `initialSnapshot` | none | A draft from `createSnapshot()`, restored before the first state. |
| `validators` | none | [Form validators](/guides/validation/#cross-field-rules). |
| `hooks` | none | [Hooks](/guides/hooks-and-lifecycle/#hooks). |
| `hookFailurePolicy` | fail | `{ afterSubmit: "preserve-success" }` keeps a success when `afterSubmit` throws. |
| `inactiveFieldPolicy` | `"omit"` | `"omit"`, `"include"`, or `"reset-on-hide"`. |
| `reportFetchMode` | `"lazy"` | `"lazy"`, `"all"`, or `"none"`; see [Report fetches](/guides/report-fetches/). |
| `listenerErrorPolicy` | `"ignore"` | `"ignore"` or `"throw-aggregate"` for throwing listeners. |
| `onListenerError` | none | Receives listener and observer-hook errors. |
| `registry` | built-ins | Engine registry; copied. |
| `descriptorRegistry` | built-ins | Presenter registry; copied. |
| `behaviors` | none | [Runtime behaviors](/extend/plugins/#behaviors). |

## Controller

| Member | Purpose |
| --- | --- |
| `form` | The [form controller](/runtime/form-controller/). |
| `state` | `{ form, wizard, tabs, disclosure }`. |
| `getSnapshot()` | The current snapshot; the same object until something changes. |
| `subscribe(listener)` | Called with each new snapshot. Returns an unsubscribe function. |
| `navigation` | `next()`, `previous()`, `activate(id)`, `getActiveNodes()`, `kind`, and `disclosure` with `toggle`, `open`, `close`, `openAll`, `closeAll`. See [Navigation](/view/overview/#navigation). |
| `getField(id)`, `getReport(id)` | One item from the snapshot. |
| `getVisibleFields()`, `getVisibleReports()` | Items visible by condition and layout position. |
| `getNodeById(id)` | A resolved layout node. |
| `getLayoutReferences()` | Which fields and reports each step, tab, and section contains. |
| `validate()`, `submit(options?)`, `submitPipeline(options?)` | Validation and submission; `submit` honors `reportFetchMode`. |
| `reset()`, `suspend(reason?)`, `resume()`, `dispose()` | Forwarded to the form; `dispose` also releases view subscriptions. |
| `engineRegistry`, `descriptorRegistry`, `reportFetchMode` | What this view resolved. |

## Snapshot

| Property | Contents |
| --- | --- |
| `form` | The form state. |
| `layout` | The resolved layout: `kind` plus `children`, `steps`, or `tabs`, with every node id filled in. |
| `fields`, `reports` | One item per field or report. |
| `wizard` | `{ stepIndex, stepCount, currentStepId, canNext, canPrev, isLastStep }`, or `null` unless the layout is a wizard. |
| `tabs` | `{ activeTabIndex, tabCount, currentTabId, canGoNext, canGoPrev }`, or `null` unless the layout is tabs. |
| `disclosure` | `{ openSectionIds, sectionCount }`, or `null` when the layout has no sections. |

Each field item has `id`, `kind`, `config`, `controller`, `state`, `descriptor`, `stepId`, `tabId`,
`sectionId` (innermost), `sectionIds` (outermost first), and `visibleInLayout`. Report items have
the same, with a `descriptor` that is `null` while the kind has nothing to show.
