import type { FormSchema } from "mlform/schema";
import type { DesignSystemConfig } from "mlform/design";
import sourceSchema from "./lab2pressure-schema.json";
import { mountClinicalDemo } from "./mount.ts";
import { createBloodPressureTransport } from "./lab2pressure-model.ts";

export const BP_SCHEMA: FormSchema = {
  ...sourceSchema,
  fields: sourceSchema.fields.map((field) => ({ ...field, showAggregationSummary: false })),
};

export const BP_EXAMPLES = [
  {
    id: "example-1",
    label: "Example 1 · three measurements",
    values: {
      "urea-nitrogen": [{ value: 12 }, { value: 15 }, { value: 18 }],
      chloride: [{ value: 100 }, { value: 102 }, { value: 104 }],
      glucose: [{ value: 90 }, { value: 100 }, { value: 110 }],
      potassium: [{ value: 4 }, { value: 4.2 }, { value: 4.4 }],
      "blood-pressure": [
        { systolic: 120, diastolic: 70 },
        { systolic: 130, diastolic: 80 },
        { systolic: 140, diastolic: 90 },
      ],
    },
  },
  {
    id: "example-2",
    label: "Example 2 · one measurement",
    values: {
      "urea-nitrogen": [{ value: 24 }],
      chloride: [{ value: 98 }],
      glucose: [{ value: 142 }],
      potassium: [{ value: 3.7 }],
      "blood-pressure": [{ systolic: 150, diastolic: 95 }],
    },
  },
];

export const mountLab2Pressure = (container: HTMLElement, designSystem: DesignSystemConfig) =>
  mountClinicalDemo(
    container,
    {
      className: "lab2pressure",
      schema: BP_SCHEMA,
      transport: createBloodPressureTransport(),
      examples: BP_EXAMPLES,
      examplePlaceholder: "Select an example",
      submitLabel: "Predict blood pressure",
      submittingLabel: "Calculating prediction…",
      validationLabel: "Review the highlighted measurements before predicting.",
      failureLabel: "The model could not run. Please try again.",
      staleLabel: "Measurements have changed. Predict again to update the result.",
      emptyTitle: "Prediction pending",
      resultTitle: "Prediction",
      emptyBody: "Enter lab results and blood pressure to run Best BP Minimal.",
      primitiveText: {
        seriesEmpty: "Add at least one measurement.",
        reportStateTitle: (status) =>
          status === "idle"
            ? "Prediction pending"
            : status === "loading"
              ? "Calculating…"
              : "The prediction could not be calculated",
        reportStateMessage: (_status, error) =>
          error ?? "Enter measurements and select Predict blood pressure.",
      },
      getStatus: (snapshot) =>
        snapshot.form.submissionStatus === "succeeded"
          ? "Prediction calculated with Best BP Minimal in your browser."
          : "Local model · Best BP Minimal · 16 inputs",
      sections: [
        {
          title: "Lab results",
          columns: 2,
          fields: ["urea-nitrogen", "chloride", "glucose", "potassium"],
        },
        { title: "Blood pressure", columns: 1, fields: ["blood-pressure"] },
      ],
      shell: `
    <div class="clinical-container">
      <section class="clinical-card clinical-example-card">
        <header><h1>Lab2pressure/lite</h1><p>Lab results and blood pressure · Best BP Minimal</p></header>
        <div class="clinical-example-loader">
          <label for="bp-example">Select an example</label>
          <select id="bp-example" data-role="example-select"></select>
          <button type="button" data-role="load-example">Load measurements</button>
        </div>
      </section>
      <form class="clinical-card clinical-form" novalidate>
        <p class="clinical-intro">Add the original measurements. MLForm calculates the aggregates required by the model. One reading per series is supported.</p>
        <div data-role="fields"></div>
        <div class="clinical-errors" data-role="errors" role="alert" hidden></div>
        <div class="clinical-actions">
          <p data-role="status" aria-live="polite"></p>
          <button type="submit" data-role="submit"></button>
        </div>
        <p class="clinical-note">Inference from the supplied model; not a diagnosis. Measurements are processed in this browser.</p>
      </form>
    </div>`,
    },
    designSystem,
  );
