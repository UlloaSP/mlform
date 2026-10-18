---
title: Review before submit
description: End a wizard with a review step that summarizes the answers, then show the model's reports after submission.
---

A wizard can end with a step that shows what will be sent. Put the reports in the same final step
so the outcome appears where the user confirmed it.

```ts
import { createSubmissionSnapshot } from "mlform/runtime";

const mounted = mountForm(container, {
  schema: {
    fields: [
      { id: "station", kind: "text", label: "Station", displayKey: "Station", required: true, mappedTo: "station" },
      { id: "temperature", kind: "number", label: "Temperature", unit: "°C", displayKey: "Temperature (°C)", mappedTo: "temperature" },
      { id: "humidity", kind: "number", label: "Humidity", unit: "%", displayKey: "Humidity (%)", mappedTo: "humidity" },
    ],
    reports: [{ id: "forecast", kind: "regressor", label: "Next-hour estimate", unit: "°C", mappedTo: "forecast" }],
  },
  layout: {
    kind: "wizard",
    steps: [
      { id: "station", title: "Station", children: [{ kind: "field", field: "station" }] },
      {
        id: "readings",
        title: "Readings",
        children: [{ kind: "group", columns: 2, children: [{ kind: "field", field: "temperature" }, { kind: "field", field: "humidity" }] }],
      },
      { id: "review", title: "Review and run", children: [{ kind: "report", report: "forecast" }] },
    ],
  },
  transport,
  labels: { submit: "Run forecast" },
});

// Keep a host-rendered summary next to the form in sync with the answers.
mounted.form.subscribeSelector(
  (state) => state.values,
  () => renderSummary(createSubmissionSnapshot(mounted.form).displayValues),
  { emitInitial: true },
);
```

- `displayKey` gives each value the name the summary shows; fields without one stay out of
  `displayValues`.
- The wizard validates each step on **Next**, so the review step only appears once the answers are
  valid.
- Every field must appear in exactly one step, so the review step holds the report rather than the
  fields again. Render the summary in your page, as above, or with a
  [custom node](/kit/primitive-adapter/#regions-you-render-entirely) in a headless view.
