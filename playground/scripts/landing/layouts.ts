import type { FormSchema } from "mlform/schema";
import type { FormLayoutConfig, FormLayoutNode } from "mlform/view";
import {
  field,
  humidity,
  location,
  mountCode,
  report,
  temperature,
  weatherResults,
  weatherSchema,
  wind,
} from "./weather.ts";

const measurements: FormLayoutNode = {
  kind: "group",
  columns: 2,
  children: [field("temperature"), field("humidity")],
};
const results: FormLayoutNode = {
  kind: "group",
  columns: 2,
  children: [report("forecast"), report("condition")],
};
export const layouts: Record<string, FormLayoutConfig> = {
  stacked: {
    kind: "stacked",
    children: [
      { kind: "section", title: "Measurements", children: [measurements, field("location")] },
      { kind: "section", title: "Results", children: [results] },
    ],
  },
  split: { kind: "split" },
  wizard: {
    kind: "wizard",
    steps: [
      { id: "location", title: "Location", children: [field("location")] },
      { id: "measurements", title: "Measurements", children: [measurements] },
      { id: "results", title: "Results", children: [results] },
    ],
  },
  tabs: {
    kind: "tabs",
    tabs: [
      { id: "measurements", title: "Measurements", children: [measurements] },
      { id: "location", title: "Location", children: [field("location")] },
      { id: "results", title: "Results", children: [results] },
    ],
  },
};
// Captured at natural height. Split spans the landing's full bento row, so it gets the wider frame.
const widths: Record<string, number> = { stacked: 600, split: 1120, wizard: 600, tabs: 600 };
// Every layout uses the same schema, so the four captures compare directly.
export const layoutExamples = Object.entries(layouts).map(([name, layout]) => ({
  name: `layout-${name}`,
  code: mountCode({
    schema: weatherSchema,
    layout,
    width: widths[name],
    submit: "Run prediction",
    results: weatherResults,
  }),
}));

export const heroCode = mountCode({
  schema: { ...weatherSchema, fields: [temperature, humidity, wind, location] },
  layout: {
    kind: "stacked",
    children: [
      {
        kind: "section",
        title: "Sensor readings",
        children: [
          {
            kind: "group",
            columns: 3,
            children: [field("temperature"), field("humidity"), field("wind")],
          },
          field("location"),
        ],
      },
      { kind: "section", title: "Forecast", children: [results] },
    ],
  },
  width: 1120,
  submit: "Run prediction",
  results: weatherResults,
});

const sectionsSchema: FormSchema = {
  fields: [
    { id: "station", kind: "text", label: "Station name", defaultValue: "North station" },
    { id: "observed", kind: "date", label: "Observed on", defaultValue: "2026-06-15" },
    temperature,
    humidity,
    wind,
    { id: "notes", kind: "long-text", label: "Notes", defaultValue: "" },
    { id: "calibrated", kind: "boolean", label: "Calibrated", defaultValue: true },
  ],
};
export const sectionsLayout: FormLayoutConfig = {
  kind: "stacked",
  children: [
    {
      kind: "section",
      title: "Station",
      children: [{ kind: "group", columns: 2, children: [field("station"), field("observed")] }],
    },
    {
      kind: "section",
      title: "Measurements",
      children: [
        {
          kind: "group",
          columns: 3,
          children: [field("temperature"), field("humidity"), field("wind")],
        },
      ],
    },
    {
      kind: "section",
      title: "Maintenance",
      defaultOpen: false,
      children: [field("notes"), field("calibrated")],
    },
  ],
};
export const sectionsCode = mountCode({
  schema: sectionsSchema,
  layout: sectionsLayout,
  width: 760,
  submit: "Save observation",
});
