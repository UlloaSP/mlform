import type { KitDesignSystemSnapshot } from "mlform/kit";
import type { PrimitiveTextOverrides } from "mlform/primitives";
import { defaultKitDesignSystem, defaultKitLabels } from "mlform/kit";
import { primitiveStaticText } from "mlform/primitives";

export const PLAYGROUND_DESIGN_SYSTEM: KitDesignSystemSnapshot = {
  ...defaultKitDesignSystem,
  recipe: "default",
  theme: "eshkra",
  mode: "auto",
};

export const PLAYGROUND_LABELS = {
  ...defaultKitLabels,
  form: "Multi backend inputs",
  reports: "Combined backend reports",
  submit: "Run Multi-backend Inference",
};

export const PRIMITIVE_TEXT: PrimitiveTextOverrides = {
  formEyebrow: "Multi backend",
  reportEyebrow: "Aggregated reports",
  formErrorsTitle: "Validation issues",
  helpActionGlyph: "?",
  categoryPlaceholder: "Choose a deployment channel",
  booleanTrue: "Approved",
  booleanFalse: "Blocked",
  reportsEmptyTitle: "Backend results",
  reportsEmptyBody: "Submit form to query all configured backends and compare outputs.",
  formStateLabel: (operation, submissionStatus) =>
    primitiveStaticText.formStateLabel(operation, submissionStatus).toUpperCase(),
  reportStatusLabel: (status) => status.toUpperCase(),
  seriesAddRow: "Add sample",
  seriesRemoveRow: "Remove sample",
  seriesTimestamp: "Observed at",
  seriesValue: "Measured value",
  seriesEmpty: "No samples yet. Add the first one above.",
};
