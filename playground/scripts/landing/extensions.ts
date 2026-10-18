import { readFileSync } from "node:fs";

// The landing shows these modules verbatim, so the capture runs exactly the code on the page.
const pluginFiles = ["wind-direction.ts", "forecast-chart.ts", "weather-plugin.ts"];
const source = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
// The code lab runs them as one script, where sibling modules are already in scope.
const localImport = /^import .*"\.\/[\w-]+\.ts";\n/gm;
const pluginSource = pluginFiles.map((file) => source(file).replace(localImport, "")).join("\n");

// Illustrative hourly values; the first one matches the hero's next-hour estimate.
const forecastValues = [22.7, 23.4, 24.1, 23.8, 23, 22.2];

export const pluginCode = `${pluginSource}
import { mountForm } from "mlform";
const container = document.querySelector<HTMLElement>("#form")!;
container.style.width = "560px";
const mounted = mountForm(container, {
  plugins: [weatherPlugin],
  primitiveRegistry,
  schema: {
    fields: [{ id: "wind", kind: "wind-direction", label: "Wind direction", defaultValue: "SW", mappedTo: "wind_direction" }],
    reports: [{ id: "trend", kind: "forecast-chart", label: "Next six hours", unit: "°C", mappedTo: "trend" }],
  },
  layout: { kind: "stacked", children: [
    { kind: "section", title: "Custom field", children: [{ kind: "field", field: "wind" }] },
    { kind: "section", title: "Custom report", children: [{ kind: "report", report: "trend" }] },
  ] },
  labels: { submit: "Run forecast" },
  transport: { async submit() { return { reports: [{ backend: "default", mappedTo: "trend", status: "ready", payload: ${JSON.stringify(forecastValues)} }] }; } },
});
await mounted.form.submit();`;

export const backendCode = `import { mountForm } from "mlform";
import { createFanoutTransport } from "mlform/transport";
const transport = createFanoutTransport({
  targets: ["forecast", "alerts"],
  // Illustrative local responses from two named transports.
  submit: async (backend) => ({ reports: [backend === "forecast"
    ? { backend, mappedTo: "estimate", status: "ready", payload: { value: 22.66 } }
    : { backend, mappedTo: "condition", status: "ready", payload: { prediction: "0", probabilities: [0.96, 0.04] } }
  ] }),
  merge: outcomes => ({ reports: outcomes.flatMap(outcome => outcome.status === "fulfilled" ? outcome.value.reports : []) }),
});
const container = document.querySelector<HTMLElement>("#form")!;
container.style.width = "560px";
const mounted = mountForm(container, {
  schema: {
    fields: [
      { id: "temperature", kind: "number", label: "Temperature", unit: "°C", defaultValue: 21.5, mappedTo: "temperature" },
      { id: "humidity", kind: "number", label: "Humidity", unit: "%", defaultValue: 58, mappedTo: "humidity" },
    ],
    reports: [
      { id: "forecast", kind: "regressor", label: "Forecast model", unit: "°C", mappedTo: { forecast: "estimate" } },
      { id: "alert", kind: "classifier", label: "Alert model", labels: ["Normal", "Alert"], showClassProbabilities: true, mappedTo: { alerts: "condition" } },
    ],
  },
  layout: { kind: "stacked", children: [
    { kind: "section", title: "Shared inputs", children: [{ kind: "group", columns: 2, children: ["temperature", "humidity"].map(field => ({ kind: "field", field })) }] },
    { kind: "section", title: "Two backends · two reports", children: ["forecast", "alert"].map(report => ({ kind: "report", report })) },
  ] },
  labels: { submit: "Run both models" }, transport,
});
await mounted.form.submit();`;
