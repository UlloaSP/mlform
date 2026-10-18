import type { FieldConfig } from "mlform/schema";
import { field, mountCode } from "./weather.ts";

// Ids are required here because each one names a capture.
export const overviewFields: (FieldConfig & { id: string })[] = [
  {
    id: "text",
    kind: "text",
    label: "Station name",
    defaultValue: "North station",
    required: true,
  },
  {
    id: "long-text",
    kind: "long-text",
    label: "Observation notes",
    defaultValue: "Clear sky. Readings collected in the shade.",
    rows: 3,
  },
  {
    id: "range",
    kind: "number",
    label: "Confidence threshold",
    unit: "%",
    defaultValue: 75,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "invalid",
    kind: "number",
    label: "Humidity",
    unit: "%",
    defaultValue: 58,
    min: 0,
    max: 100,
    required: true,
  },
  {
    id: "boolean",
    kind: "boolean",
    label: "Enable alerts",
    defaultValue: true,
    trueLabel: "Enabled",
    falseLabel: "Disabled",
  },
  {
    id: "category",
    kind: "category",
    label: "Sensor location",
    options: ["Indoor", "Outdoor", "Greenhouse"],
    defaultValue: "Outdoor",
  },
  {
    id: "single-choice",
    kind: "single-choice",
    label: "Prediction window",
    options: ["Next hour", "Next day", "Next week"],
    defaultValue: "Next day",
  },
  {
    id: "multi-choice",
    kind: "multi-choice",
    label: "Signals to include",
    options: ["Temperature", "Humidity", "Wind"],
    defaultValue: ["Temperature", "Humidity"],
  },
  { id: "rating", kind: "rating", label: "Observation quality", max: 5, defaultValue: 4 },
  { id: "date", kind: "date", label: "Observation date", defaultValue: "2026-06-15" },
  {
    id: "mapped-category",
    kind: "mapped-category",
    label: "Sampling preset",
    defaultValue: "detailed",
    options: [
      { label: "Quick · 10 readings", value: "quick", mapping: { readings: 10 } },
      { label: "Detailed · 30 readings", value: "detailed", mapping: { readings: 30 } },
    ],
  },
  { id: "readings", kind: "number", label: "Readings per hour", defaultValue: 30, readOnly: true },
];

// A select for people, one 0/1 column per option for the model.
export const onehotField = {
  id: "weather",
  kind: "onehot-category",
  label: "Weather condition",
  defaultValue: "rain",
  required: true,
  options: [
    { label: "Clear", value: "clear", mappedTo: "weather_clear" },
    { label: "Cloudy", value: "cloudy", mappedTo: "weather_cloudy" },
    { label: "Rain", value: "rain", mappedTo: "weather_rain" },
  ],
} satisfies FieldConfig;

// The transport records the request so the landing can print the columns the model receives.
export const onehotCode = `import { mountForm } from "mlform";
const container = document.querySelector<HTMLElement>("#form")!;
container.style.width = "480px";
const mounted = mountForm(container, {
  schema: { fields: [${JSON.stringify(onehotField)}] },
  transport: {
    async submit(request) {
      document.body.dataset.payload = JSON.stringify(request.modelValues);
      return { reports: [] };
    },
  },
});
await mounted.form.submit();`;

// Captured after typing this value, so one specimen shows the built-in validation message.
export const invalidValue = "140";

export const fieldOverviewCode = mountCode({
  schema: { fields: overviewFields },
  layout: { kind: "stacked", children: overviewFields.map(({ id }) => field(id)) },
  width: 400,
});

export const seriesCode = mountCode({
  schema: {
    fields: [
      {
        id: "readings",
        kind: "series",
        label: "Temperature history",
        required: true,
        minPoints: 2,
        showAggregationSummary: true,
        columns: [
          { id: "date", kind: "date", label: "Date", required: true },
          { id: "value", kind: "number", label: "Temperature", unit: "°C", required: true },
        ],
        defaultValue: [
          { date: "2026-06-01", value: 21 },
          { date: "2026-06-02", value: 22 },
          { date: "2026-06-03", value: 23 },
        ],
        aggregations: [
          { label: "Mean", source: "value", operation: "mean", mappedTo: "mean" },
          { label: "Minimum", source: "value", operation: "min", mappedTo: "minimum" },
          { label: "Maximum", source: "value", operation: "max", mappedTo: "maximum" },
        ],
      },
    ],
  },
  width: 640,
});
