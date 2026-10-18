import { mountForm } from "mlform/kit";
import { attachDesignSystem } from "mlform/design";
import {
  BIOCHEMISTRY_PA_MODEL,
  BIOCHEMISTRY_PA_SCHEMA,
  BIOCHEMISTRY_PA_FEATURES,
  BIOCHEMISTRY_PA_LAYOUT,
} from "./biochemistry-pa-schema.js";
import "./series.css";

export const mountBiochemistryPaPlayground = (container, designSystem) => {
  const page = document.createElement("div");
  page.className = "series-demo clinical-demo";
  page.innerHTML = `
    <p class="clinical-demo-intro">Example measurements and classification. Enter at least two values per lab test. Blood pressure measurements include an optional date, systolic and diastolic values.</p>
    <div data-role="clinical-form"></div>
    <section class="series-demo-payload" aria-labelledby="clinical-contract-title">
      <h2 id="clinical-contract-title">Model contract · 114 inputs</h2>
      <p>18 series produce the original 114 features. Sample standard deviation (ddof: 1) and linear quartiles. The classification in the Result tab is simulated.</p>
      <details>
        <summary>View transformed schema</summary>
        <pre data-role="clinical-schema" tabindex="0"></pre>
      </details>
      <details>
        <summary>View feature names and positions</summary>
        <pre data-role="clinical-features" tabindex="0"></pre>
      </details>
      <details open>
        <summary>Values sent to the model</summary>
        <pre data-role="clinical-payload" tabindex="0">The form has not been submitted yet.</pre>
      </details>
      <details>
        <summary>Original measurements from the last submission</summary>
        <pre data-role="clinical-observations" tabindex="0">The form has not been submitted yet.</pre>
      </details>
    </section>
  `;
  container.replaceChildren(page);
  const design = attachDesignSystem(page, { config: designSystem });
  page.querySelector('[data-role="clinical-schema"]').textContent = JSON.stringify(
    BIOCHEMISTRY_PA_SCHEMA,
    null,
    2,
  );
  page.querySelector('[data-role="clinical-features"]').textContent = BIOCHEMISTRY_PA_FEATURES.map(
    ({ index, label }) => `${index}: ${label}`,
  ).join("\n");
  const mounted = mountForm(page.querySelector('[data-role="clinical-form"]'), {
    schema: BIOCHEMISTRY_PA_SCHEMA,
    designSystem,
    layout: BIOCHEMISTRY_PA_LAYOUT,
    reportFetchMode: "none",
    labels: {
      form: "Lab tests and blood pressure",
      tabs: "Measurement sections",
      submit: "Submit measurements",
    },
    primitiveText: {
      seriesAddRow: "Add measurement",
      seriesRemoveRow: "Remove measurement",
      seriesEmpty: "Add measurements.",
      formEyebrow: "Measurements",
    },
    transport: {
      async submit(request) {
        page.querySelector('[data-role="clinical-payload"]').textContent = JSON.stringify(
          {
            backend: BIOCHEMISTRY_PA_MODEL,
            modelValues: request.modelValues,
          },
          null,
          2,
        );
        page.querySelector('[data-role="clinical-observations"]').textContent = JSON.stringify(
          request.displayValues,
          null,
          2,
        );
        return {
          reports: [
            {
              backend: BIOCHEMISTRY_PA_MODEL,
              mappedTo: "classifier",
              status: "ready",
              payload: { prediction: "1", probabilities: [0.35, 0.65] },
            },
          ],
          meta: { demo: true },
        };
      },
    },
  });
  return {
    form: mounted.form,
    updateDesignSystem(config) {
      mounted.updateDesignSystem(config);
      design.update(config);
    },
    unmount() {
      mounted.unmount();
      design.disconnect();
      page.remove();
    },
  };
};
