import type { FieldConfig, FormSchema } from "mlform/schema";
import type { FormLayoutConfig, FormLayoutNode } from "mlform/view";

// One weather-station story runs through every landing capture so the screenshots read as a set.
export const field = (id: string): FormLayoutNode => ({ kind: "field", field: id });
export const report = (id: string): FormLayoutNode => ({ kind: "report", report: id });

export const temperature: FieldConfig = {
  id: "temperature",
  kind: "number",
  label: "Temperature",
  unit: "°C",
  defaultValue: 21.5,
  min: -40,
  max: 60,
  required: true,
  mappedTo: "temperature",
};
export const humidity: FieldConfig = {
  id: "humidity",
  kind: "number",
  label: "Humidity",
  unit: "%",
  defaultValue: 58,
  min: 0,
  max: 100,
  required: true,
  mappedTo: "humidity",
};
export const wind: FieldConfig = {
  id: "wind",
  kind: "number",
  label: "Wind speed",
  unit: "km/h",
  defaultValue: 12,
  min: 0,
  max: 150,
  required: true,
  mappedTo: "wind",
};
export const location: FieldConfig = {
  id: "location",
  kind: "category",
  label: "Sensor location",
  options: ["Indoor", "Outdoor", "Greenhouse"],
  defaultValue: "Outdoor",
  required: true,
  mappedTo: "location",
};

export const weatherSchema: FormSchema = {
  fields: [temperature, humidity, location],
  reports: [
    {
      id: "forecast",
      kind: "regressor",
      label: "Next-hour estimate",
      description:
        "Air temperature expected at this station one hour from now, estimated from the readings above.",
      unit: "°C",
      mappedTo: "forecast",
    },
    {
      id: "condition",
      kind: "classifier",
      label: "Expected conditions",
      description: "Whether the weather is likely to change within the hour.",
      labels: ["Stable", "Changing"],
      showClassProbabilities: true,
      mappedTo: "condition",
    },
  ],
};

// Illustrative local responses: the captures show real components, not a trained model.
export const weatherResults = `[
  { backend: "default", mappedTo: "forecast", status: "ready", payload: { value: 22.66 } },
  { backend: "default", mappedTo: "condition", status: "ready", payload: { prediction: "0", probabilities: [0.92, 0.08] } },
]`;

interface MountOptions {
  schema: FormSchema;
  layout?: FormLayoutConfig;
  width: number;
  height?: number;
  submit?: string;
  results?: string;
}
export const mountCode = ({ schema, layout, width, height, submit, results }: MountOptions) =>
  `import { mountForm } from "mlform";
const container = document.querySelector<HTMLElement>("#form")!;
container.style.width = "${width}px";
${height ? `container.style.height = "${height}px";` : ""}
const mounted = mountForm(container, {
  schema: ${JSON.stringify(schema)},
  ${layout ? `layout: ${JSON.stringify(layout)},` : ""}
  ${submit ? `labels: { submit: ${JSON.stringify(submit)} },` : ""}
  transport: { async submit() { return { reports: ${results ?? "[]"} }; } },
});
${results ? "await mounted.form.submit();" : ""}`;
