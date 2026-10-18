import type { FieldConfig, FormSchema } from "mlform/schema";
import { field, humidity, location, mountCode, temperature } from "../landing/weather.ts";

// The documentation reuses the landing's weather station, so both sites read as one product.
const station: FieldConfig = {
  id: "station",
  kind: "text",
  label: "Station name",
  description: "Shown in every forecast report.",
  showDescriptionInline: true,
  required: true,
  mappedTo: "station",
};

export const fieldStatesCode = mountCode({
  schema: {
    fields: [
      station,
      temperature,
      { ...humidity, defaultValue: 140 },
      {
        id: "offset",
        kind: "number",
        label: "Calibration offset",
        unit: "°C",
        defaultValue: 0.4,
        readOnly: true,
        mappedTo: "offset",
      },
      { ...location, disabled: true },
    ],
  },
  width: 440,
  // Validating shows the required error on the empty station name, as a submit attempt would.
  after: "await mounted.form.validate();",
});

export const wizardCode = mountCode({
  schema: {
    fields: [station, { ...location, defaultValue: undefined }, temperature, humidity],
  },
  layout: {
    kind: "wizard",
    steps: [
      { id: "station", title: "Station", children: [field("station"), field("location")] },
      {
        id: "measurements",
        title: "Measurements",
        children: [field("temperature"), field("humidity")],
      },
    ],
  },
  width: 560,
  submit: "Run prediction",
});

export const reportStatesSchema: FormSchema = {
  fields: [temperature],
  reports: [
    {
      id: "forecast",
      kind: "regressor",
      label: "Next-hour estimate",
      unit: "°C",
      precision: 1,
      mappedTo: "forecast",
    },
    {
      id: "frost",
      kind: "classifier",
      label: "Frost risk",
      labels: ["Low", "High"],
      mappedTo: "frost",
    },
    {
      id: "storm",
      kind: "classifier",
      label: "Storm warning",
      labels: ["None", "Warning"],
      mappedTo: "storm",
    },
  ],
};
// Ready, skipped, and no result at all: each report settles on its own.
export const reportStatesResults = `[
  { backend: "default", mappedTo: "forecast", status: "ready", payload: { value: 22.66 } },
  { backend: "default", mappedTo: "frost", status: "skipped", reason: "Above freezing" },
]`;
export const reportStatesCode = mountCode({
  schema: reportStatesSchema,
  width: 520,
  submit: "Run prediction",
  results: reportStatesResults,
});

// A transport that throws fails the submission; every report shows the failure.
export const submitErrorCode = `import { mountForm } from "mlform";
const container = document.querySelector<HTMLElement>("#form")!;
container.style.width = "520px";
const mounted = mountForm(container, {
  schema: ${JSON.stringify({ ...reportStatesSchema, reports: reportStatesSchema.reports?.slice(0, 2) })},
  labels: { submit: "Run prediction" },
  transport: {
    async submit() {
      throw new Error("The model is warming up. Try again in a few seconds.");
    },
  },
});
await mounted.form.submit().catch(() => {});`;

// Two mounts of one schema: the condition hides the offset until the toggle is on.
const conditionsSchema: FormSchema = {
  fields: [
    {
      id: "advanced",
      kind: "boolean",
      label: "Manual calibration",
      trueLabel: "On",
      falseLabel: "Off",
      includeInSubmission: false,
    },
    {
      id: "offset",
      kind: "number",
      label: "Calibration offset",
      unit: "°C",
      defaultValue: 0.4,
      min: -5,
      max: 5,
      step: 0.1,
      mappedTo: "offset",
      hiddenWhen: { kind: "field-value", field: "advanced", notEquals: true },
    },
    temperature,
  ],
};
export const conditionsCode = `import { mountForm } from "mlform";
const root = document.querySelector<HTMLElement>("#form")!;
root.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 880px; align-items: start";
const schema = ${JSON.stringify(conditionsSchema)};
for (const advanced of [false, true]) {
  const container = root.appendChild(document.createElement("div"));
  mountForm(container, {
    schema,
    initialValues: { advanced },
    transport: { async submit() { return { reports: [] }; } },
  });
}`;
