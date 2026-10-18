export const SERIES_CODE = `import { mountForm } from "mlform";

mountForm(document.querySelector<HTMLElement>("#form")!, {
  schema: {
    fields: [{
      id: "measurements", kind: "series", label: "Daily measurements",
      required: true, minPoints: 2, showAggregationSummary: true,
      columns: [
        { id: "date", kind: "date", label: "Date", required: true },
        { id: "value", kind: "number", label: "Weight", unit: "kg", min: 0, required: true },
      ],
      defaultValue: [
        { date: "2026-06-01", value: 70 },
        { date: "2026-06-02", value: 71 },
        { date: "2026-06-03", value: 69 },
      ],
      aggregations: [
        { label: "Mean", source: "value", operation: "mean", mappedTo: "mean" },
        { label: "Range", source: "value", operation: "range", mappedTo: "range" },
      ],
    }],
    reports: [
      { id: "average", kind: "regressor", label: "Average weight", mappedTo: "average", unit: "kg" },
      { id: "spread", kind: "regressor", label: "Weight range", mappedTo: "spread", unit: "kg" },
    ],
  },
  transport: {
    async submit({ modelValues }) {
      // MLForm produces these two aggregates from the original measurements.
      return { reports: [
        { backend: "default", mappedTo: "average", status: "ready", payload: { value: modelValues.mean } },
        { backend: "default", mappedTo: "spread", status: "ready", payload: { value: modelValues.range } },
      ] };
    },
  },
});
`;
