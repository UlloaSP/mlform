import assert from "node:assert/strict";
import type { SubmitRequest } from "mlform/transport";
import type { FormulationPrediction } from "../src/formulation-demo/transport.ts";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', {
  url: "http://localhost/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  customElements: dom.window.customElements,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
});

const { createFormView } = await import("mlform/view");
const { FORMULATION_PLUGIN } = await import("../src/formulation-demo/registry.ts");
const { createFormulationSchema } = await import("../src/formulation-demo/schema.ts");
const { createFormulationTransport } = await import("../src/formulation-demo/transport.ts");
const { FORMULATION_EXAMPLES } = await import("../src/formulation-demo/examples.ts");
const { FORM_SCHEMA } = await import("../src/playground/schema.ts");
const { PLAYGROUND_SECTIONED_LAYOUT } = await import("../src/playground/section-layouts.ts");
const { createAggregateTransport } = await import("../src/playground/transport.ts");
const { BACKEND_COMPARE_PLUGIN } = await import("../src/playground/report-definition.ts");

const formulationSchema = createFormulationSchema();
const formulationTransport = createFormulationTransport();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const endpoint = (url instanceof Request ? url.url : url.toString()).split("/").at(-1);
  const predictions: Record<string, unknown> = {
    filament_mechanical_characteristics: "Good",
    extrusion_temp: 110,
    printability: "yes",
    printing_temp: 180,
    dissolution: [62, 210, 290],
  };
  assert(endpoint && endpoint in predictions, `unexpected formulation endpoint ${endpoint}`);
  return Response.json({ prediction: predictions[endpoint] });
};
let formulationRequest: SubmitRequest | undefined;
let formulationResponse: Awaited<ReturnType<typeof formulationTransport.submit>> | undefined;
const formulationView = createFormView({
  schema: formulationSchema,
  initialValues: FORMULATION_EXAMPLES[1].values,
  transport: {
    async submit(request) {
      formulationRequest = request;
      formulationResponse = await formulationTransport.submit(request);
      return formulationResponse;
    },
  },
  plugins: [FORMULATION_PLUGIN],
  reportFetchMode: "all",
});
await formulationView.submitPipeline();
assert(formulationRequest && formulationResponse);
globalThis.fetch = originalFetch;
assert.equal(formulationView.form.state.lifecycle, "active", "formulation view is not active");
assert(formulationView.form.state.operation === "idle", "formulation operation did not settle");
assert(
  formulationView.form.state.submissionStatus === "succeeded",
  "formulation submission did not succeed",
);
const formulationPrediction = formulationView
  .getSnapshot()
  .reports.find((report) => report.id === "prediction");
assert(
  Object.keys(formulationRequest.displayValues).length > 0,
  "missing formulation displayValues",
);
assert("aqoat-as-hg" in formulationRequest.modelValues, "missing formulation modelValues");
assert(
  formulationRequest.inputs.some((input) => input.fieldId === "material-aqoat-as-hg"),
  "missing formulation input record",
);
assert(Array.isArray(formulationResponse.reports), "formulation reports must be an array");
assert(
  formulationResponse.reports.some(
    (report) =>
      report.backend === "default" && report.mappedTo === "prediction" && report.status === "ready",
  ),
  "missing formulation prediction report",
);
assert(formulationPrediction?.state.status === "ready", "formulation prediction report not ready");
assert(
  (formulationPrediction.state.payload as FormulationPrediction)?.summary
    ?.mechanicalCharacteristics,
  "formulation prediction payload missing",
);

const aggregateTransport = createAggregateTransport();
let playgroundRequest: SubmitRequest | undefined;
let playgroundResponse: Awaited<ReturnType<typeof aggregateTransport.submit>> | undefined;
const playgroundView = createFormView({
  schema: FORM_SCHEMA,
  transport: {
    async submit(request) {
      playgroundRequest = request;
      playgroundResponse = await aggregateTransport.submit(request);
      return playgroundResponse;
    },
  },
  plugins: [BACKEND_COMPARE_PLUGIN],
  layout: PLAYGROUND_SECTIONED_LAYOUT,
  reportFetchMode: "all",
});
await playgroundView.submitPipeline();
assert(playgroundRequest && playgroundResponse);
assert.equal(playgroundView.form.state.lifecycle, "active", "playground view is not active");
assert(playgroundView.form.state.operation === "idle", "playground operation did not settle");
assert(
  playgroundView.form.state.submissionStatus === "succeeded",
  "playground submission did not succeed",
);

const playgroundReports = playgroundView.getSnapshot().reports;
const backendCompare = playgroundReports.find((report) => report.id === "backend-compare");
const standardReports = playgroundReports.filter((report) => report.id !== "backend-compare");
assert(backendCompare?.state.status === "ready", "backend compare report not ready");
assert(
  (backendCompare.state.payload as { items: unknown[] })?.items?.length === 3,
  "backend compare report missing backend items",
);
assert(
  standardReports.every((report) => report.state.status === "ready"),
  `standard reports not ready: ${standardReports
    .filter((report) => report.state.status !== "ready")
    .map((report) => report.id)
    .join(", ")}`,
);
assert(Array.isArray(playgroundResponse.reports), "playground reports must be an array");
assert(playgroundResponse.reports.length === 9, "playground report count mismatch");
assert(
  playgroundResponse.reports.every(
    (report) =>
      typeof report.backend === "string" &&
      report.backend.length > 0 &&
      typeof report.mappedTo === "string" &&
      report.mappedTo.length > 0 &&
      report.status === "ready" &&
      "payload" in report,
  ),
  "playground reports must use explicit report result envelopes",
);
assert(
  new Set(playgroundResponse.reports.map((report) => `${report.backend}:${report.mappedTo}`))
    .size === playgroundResponse.reports.length,
  "playground report routes must be unique",
);
assert(Object.keys(playgroundRequest.displayValues).length > 0, "missing playground displayValues");
assert("release_name" in playgroundRequest.modelValues, "missing playground modelValues");
assert(
  playgroundRequest.inputs.some((input) => input.fieldId === "release-name"),
  "missing playground input record",
);
assert(playgroundRequest.displayValues["Risk tier"] === "medium", "missing onehot display value");
assert("Evaluation date" in playgroundRequest.displayValues, "missing date display value");
assert("Version scores" in playgroundRequest.displayValues, "missing series display value");
assert(
  Object.keys(playgroundRequest.displayValues).length ===
    FORM_SCHEMA.fields.filter((field) => !field.hidden).length,
  `playground displayValues are incomplete: ${Object.keys(playgroundRequest.displayValues).join(", ")}`,
);
assert(playgroundRequest.modelValues.risk_medium === 1, "missing selected onehot model value");
assert(playgroundRequest.modelValues.risk_low === 0, "missing inactive onehot model value");
assert(
  playgroundRequest.inputs.some(
    (input) => input.fieldId === "risk-tier" && input.value === "medium",
  ),
  "missing onehot input value",
);

formulationView.dispose();
playgroundView.dispose();
assert.equal(formulationView.form.state.lifecycle, "disposed", "formulation view was not disposed");
assert.equal(playgroundView.form.state.lifecycle, "disposed", "playground view was not disposed");

console.log("mlform api smoke ok");
