import sourceSchema from "./lab2pressure-schema.json";
import { mountClinicalDemo } from "./mount.js";
import { createBloodPressureTransport } from "./lab2pressure-model.js";

export const BP_SCHEMA = {
  ...sourceSchema,
  fields: sourceSchema.fields.map((field) => ({ ...field, showAggregationSummary: false })),
};

export const BP_EXAMPLES = [
  {
    id: "example-1",
    label: "Ejemplo 1 · tres mediciones",
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
    label: "Ejemplo 2 · una medición",
    values: {
      "urea-nitrogen": [{ value: 24 }],
      chloride: [{ value: 98 }],
      glucose: [{ value: 142 }],
      potassium: [{ value: 3.7 }],
      "blood-pressure": [{ systolic: 150, diastolic: 95 }],
    },
  },
];

export const mountLab2Pressure = (container, designSystem) =>
  mountClinicalDemo(
    container,
    {
      className: "lab2pressure",
      schema: BP_SCHEMA,
      transport: createBloodPressureTransport(),
      examples: BP_EXAMPLES,
      examplePlaceholder: "Selecciona un ejemplo",
      submitLabel: "Predecir presión arterial",
      submittingLabel: "Calculando predicción…",
      validationLabel: "Revisa las mediciones marcadas antes de predecir.",
      failureLabel: "No se ha podido ejecutar el modelo. Vuelve a intentarlo.",
      staleLabel: "Has cambiado las mediciones. Vuelve a predecir para actualizar el resultado.",
      emptyTitle: "Predicción pendiente",
      resultTitle: "Predicción",
      emptyBody: "Introduce las analíticas y la presión arterial para ejecutar Best BP Minimal.",
      primitiveText: {
        seriesEmpty: "Añade al menos una medición.",
        reportStateTitle: (status) =>
          status === "idle"
            ? "Predicción pendiente"
            : status === "loading"
              ? "Calculando…"
              : "No se ha podido calcular la predicción",
        reportStateMessage: (_status, error) =>
          error ?? "Introduce las mediciones y pulsa Predecir presión arterial.",
      },
      getStatus: (snapshot) =>
        snapshot.form.submissionStatus === "succeeded"
          ? "Predicción calculada con Best BP Minimal en tu navegador."
          : "Modelo local · Best BP Minimal · 16 entradas",
      sections: [
        {
          title: "Analíticas",
          columns: 2,
          fields: ["urea-nitrogen", "chloride", "glucose", "potassium"],
        },
        { title: "Presión arterial", columns: 1, fields: ["blood-pressure"] },
      ],
      shell: `
    <div class="clinical-container">
      <section class="clinical-card clinical-example-card">
        <header><h1>Lab2pressure/lite</h1><p>Analíticas y presión arterial · Best BP Minimal</p></header>
        <div class="clinical-example-loader">
          <label for="bp-example">Selecciona un ejemplo</label>
          <select id="bp-example" data-role="example-select"></select>
          <button type="button" data-role="load-example">Cargar mediciones</button>
        </div>
      </section>
      <form class="clinical-card clinical-form" novalidate>
        <p class="clinical-intro">Añade las mediciones originales. MLForm calcula automáticamente los agregados que necesita el modelo. Se admite una lectura por serie.</p>
        <div data-role="fields"></div>
        <div class="clinical-errors" data-role="errors" role="alert" hidden></div>
        <div class="clinical-actions">
          <p data-role="status" aria-live="polite"></p>
          <button type="submit" data-role="submit"></button>
        </div>
        <p class="clinical-note">Inferencia del modelo proporcionado; no constituye un diagnóstico. Las mediciones se procesan en este navegador.</p>
      </form>
    </div>`,
    },
    designSystem,
  );
