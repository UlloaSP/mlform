import { mountClinicalDemo } from "./mount.js";
import {
  DOSETAILOR_SCHEMA,
  DOSETAILOR_EXAMPLES,
  DOSETAILOR_LAYOUT,
  toDoseTailorFormValues,
} from "./dosetailor-schema.js";
import { createDoseTailorTransport, hasLabs, hasValue } from "./dosetailor-transport.js";
import { DOSETAILOR_PLUGIN, createDoseTailorPrimitives } from "./dosetailor-report.js";

export const mountDoseTailor = (container, designSystem) =>
  mountClinicalDemo(
    container,
    {
      className: "dosetailor",
      schema: DOSETAILOR_SCHEMA,
      transport: createDoseTailorTransport(),
      plugins: [DOSETAILOR_PLUGIN],
      primitiveRegistry: createDoseTailorPrimitives(),
      examples: DOSETAILOR_EXAMPLES,
      toFormValues: toDoseTailorFormValues,
      layout: DOSETAILOR_LAYOUT,
      examplePlaceholder: "Select an example",
      submitLabel: "Predict",
      submittingLabel: "Predicting…",
      validationLabel:
        "Please complete the required fields marked with an asterisk and review the highlighted values.",
      failureLabel: "Could not get a prediction. Please review the form and try again.",
      emptyTitle: "Prediction pending",
      emptyBody: "Complete the patient parameters and select Predict.",
      getStatus: (snapshot) => {
        const fields = snapshot.fields.filter(
          (field) => field.id !== "predict-with" && field.state.visible,
        );
        const filled = fields.filter((field) => hasValue(field.state.value)).length;
        const ready = fields
          .filter((field) => field.config.required)
          .every((field) => hasValue(field.state.value) && field.state.valid);
        const modelValues = Object.fromEntries(
          fields.map((field) => [field.config.mappedTo, field.state.value]),
        );
        return `Current parameters: ${filled} || Model type: ${ready ? (hasLabs(modelValues) ? "Labs Model" : "No Labs Model") : "Model Not Available"}`;
      },
      onSnapshot(page, snapshot) {
        const fields = snapshot.fields.filter(
          (field) => field.id !== "predict-with" && field.state.visible,
        );
        const filled = fields.filter((field) => hasValue(field.state.value)).length;
        const progress = page.querySelector("progress");
        progress.max = fields.length;
        progress.value = filled;
      },
      shell: `
    <div class="clinical-container">
      <section class="clinical-card clinical-example-card">
        <h1>Load Example</h1>
        <div class="clinical-example-loader">
          <label for="dt-example">Select an example</label><select id="dt-example" data-role="example-select"></select>
          <button type="button" data-role="load-example">Load Example</button>
        </div>
      </section>
      <form class="clinical-card clinical-form" novalidate>
        <div data-role="fields"></div>
        <div class="dt-prediction-panel">
          <progress value="0" max="28" aria-label="Completed patient parameters"></progress>
          <div class="clinical-errors" data-role="errors" role="alert" hidden></div>
          <div class="clinical-actions"><p data-role="status" aria-live="polite"></p><button type="submit" data-role="submit">Predict</button></div>
          <p class="clinical-note">Predict sends these parameters to the public DoseTailor API. For research use; not a prescribing instruction.</p>
        </div>
      </form>
    </div>`,
    },
    designSystem,
  );
