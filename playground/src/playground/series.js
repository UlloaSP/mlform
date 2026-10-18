import { mountForm } from "mlform/kit";
import { attachDesignSystem } from "mlform/design";
import { mountBiochemistryPaPlayground } from "./biochemistry-pa.js";
import { SERIES_SCHEMA } from "./series-schema.js";
import "./series.css";

export const mountSeriesPlayground = (container, designSystem) => {
  const page = document.createElement("div");
  page.className = "series-demo";
  page.innerHTML = `
    <header class="series-demo-heading">
      <h1>Series</h1>
      <p>Four examples with 1, 2, 3 and 4 columns. Edit the illustrative observations and submit to inspect their aggregates.</p>
    </header>
    <div class="series-demo-split">
      <div data-role="series-form"></div>
      <aside class="series-demo-inspector" aria-labelledby="series-contract-title">
        <h2 id="series-contract-title">Schema and model inputs</h2>
        <p>The form collects observations. Each numeric source can produce several model inputs; dates, notes and categories stay in the original rows.</p>
        <table class="series-demo-mappings">
          <caption>Aggregations by example</caption>
          <thead><tr><th scope="col">Columns</th><th scope="col">Operations</th></tr></thead>
          <tbody></tbody>
        </table>
        <details open>
          <summary>Schema with example values</summary>
          <pre data-role="series-schema" tabindex="0"></pre>
        </details>
        <details open>
          <summary>Values sent to the model</summary>
          <pre data-role="series-payload" tabindex="0">The form has not been submitted yet.</pre>
        </details>
        <details>
          <summary>Original observations from the last submission</summary>
          <pre data-role="series-observations" tabindex="0">The form has not been submitted yet.</pre>
        </details>
      </aside>
    </div>
    <details class="series-demo-clinical">
      <summary>Full clinical model · 114 inputs</summary>
      <div data-role="series-clinical"></div>
    </details>
  `;
  container.replaceChildren(page);
  const design = attachDesignSystem(page, { config: designSystem });
  page.querySelector('[data-role="series-schema"]').textContent = JSON.stringify(
    SERIES_SCHEMA,
    null,
    2,
  );
  const mappings = page.querySelector(".series-demo-mappings tbody");
  for (const field of SERIES_SCHEMA.fields) {
    const row = document.createElement("tr");
    const count = document.createElement("th");
    count.scope = "row";
    count.textContent = String(field.columns.length);
    const operations = document.createElement("td");
    operations.textContent = [
      ...new Set(field.aggregations.map(({ operation }) => operation)),
    ].join(", ");
    row.append(count, operations);
    mappings.append(row);
  }
  const mounted = mountForm(page.querySelector('[data-role="series-form"]'), {
    schema: SERIES_SCHEMA,
    designSystem,
    reportPane: "hidden",
    layout: { kind: "stacked" },
    labels: { form: "Series with 1, 2, 3 and 4 columns", submit: "Submit examples" },
    primitiveText: {
      seriesAddRow: "Add observation",
      seriesRemoveRow: "Remove observation",
      seriesEmpty: "Add observations.",
    },
    transport: {
      async submit(request) {
        page.querySelector('[data-role="series-payload"]').textContent = JSON.stringify(
          request.modelValues,
          null,
          2,
        );
        page.querySelector('[data-role="series-observations"]').textContent = JSON.stringify(
          request.displayValues,
          null,
          2,
        );
        return { reports: [] };
      },
    },
  });
  let clinical;
  const clinicalDetails = page.querySelector(".series-demo-clinical");
  const mountClinical = () => {
    if (clinicalDetails.open && !clinical) {
      clinical = mountBiochemistryPaPlayground(
        page.querySelector('[data-role="series-clinical"]'),
        designSystem,
      );
    }
  };
  clinicalDetails.addEventListener("toggle", mountClinical);
  return {
    form: mounted.form,
    updateDesignSystem(config) {
      designSystem = config;
      mounted.updateDesignSystem(config);
      clinical?.updateDesignSystem(config);
      design.update(config);
    },
    unmount() {
      clinicalDetails.removeEventListener("toggle", mountClinical);
      clinical?.unmount();
      mounted.unmount();
      design.disconnect();
      page.remove();
    },
  };
};
