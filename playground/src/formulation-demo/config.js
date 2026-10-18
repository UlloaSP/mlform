import { defaultKitLabels } from "mlform/kit";
import { primitiveStaticText } from "mlform/primitives";
import { createFormView } from "mlform/view";
import { MATERIAL_FIELD_IDS, getMaterialTotal, getActiveMaterials } from "./materials.js";
import { FORMULATION_PLUGIN } from "./registry.js";
import { createFormulationSchema } from "./schema.js";
import { createFormulationTransport } from "./transport.js";

export const PRIMITIVE_TEXT = {
  ...primitiveStaticText,
  formEyebrow: "Formulation",
  reportEyebrow: "Prediction",
  reportsEmptyTitle: "Prediction pending",
  reportsEmptyBody: "Complete formulation and submit to generate prediction.",
  formErrorsTitle: "Validation issues",
  formStateLabel: (operation, submissionStatus) =>
    primitiveStaticText.formStateLabel(operation, submissionStatus).toUpperCase(),
  reportStatusLabel: (status) => status.toUpperCase(),
  categoryPlaceholder: "Select an option",
};

export const FORM_LABELS = {
  ...defaultKitLabels,
  submit: "Complete Prediction",
  validating: "Validating…",
  submitting: "Running prediction…",
};

const createValidators = () => [
  ({ values }) => {
    const total = getMaterialTotal(values);
    const activeCount = getActiveMaterials(values).length;

    if (activeCount === 0) {
      return { form: ["Add at least one material before prediction."] };
    }

    if (Math.abs(total - 100) > 0.001) {
      return {
        form: [
          `Current materials must total exactly 100% w/w before prediction. Current total ${total.toFixed(2)}.`,
        ],
      };
    }

    return undefined;
  },
];

const createLayout = () => ({
  kind: "stacked",
  children: [
    {
      kind: "group",
      id: "form-column",
      children: [
        {
          kind: "section",
          id: "materials-section",
          title: "Materials",
          description:
            "Model uses all possible materials. Every material starts at 0 and total must sum 100% w/w.",
          children: [{ kind: "custom", id: "materials", fields: MATERIAL_FIELD_IDS }],
        },
        {
          kind: "section",
          id: "params-section",
          title: "Other parameters",
          description: "Extrusion & printing",
          children: [
            {
              kind: "group",
              id: "params-grid",
              columns: 3,
              children: [
                { kind: "field", field: "extruderbrand" },
                { kind: "field", field: "extrusionspeed" },
                { kind: "field", field: "printerbrand" },
                { kind: "field", field: "platetemperature" },
                { kind: "field", field: "printingspeed" },
                { kind: "field", field: "objecttype" },
                { kind: "field", field: "shape" },
                { kind: "field", field: "surfacearea" },
                { kind: "field", field: "volume" },
                { kind: "field", field: "mediavolume" },
                { kind: "field", field: "mediaph" },
              ],
            },
          ],
        },
        {
          kind: "section",
          id: "prediction-section",
          title: "Prediction",
          children: [{ kind: "report", report: "prediction" }],
        },
      ],
    },
  ],
});

export const createView = (initialValues) => {
  return createFormView({
    schema: createFormulationSchema(),
    transport: createFormulationTransport(),
    plugins: [FORMULATION_PLUGIN],
    initialValues,
    validators: createValidators(),
    layout: createLayout(),
    reportFetchMode: "all",
  });
};
