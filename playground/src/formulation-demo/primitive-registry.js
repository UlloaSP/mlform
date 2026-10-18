import { createBuiltinPrimitiveRegistry } from "mlform/primitives";
import { FORMULATION_PREDICTION_REPORT_TAG } from "./primitives/formulation-prediction-report.js";

export const createFormulationPrimitiveRegistry = () =>
  createBuiltinPrimitiveRegistry().registerReport(
    "formulation-prediction-report",
    FORMULATION_PREDICTION_REPORT_TAG,
  );
