import { createBuiltinPrimitiveRegistry } from "mlform/primitives";
import { defineMLFormPlugin } from "mlform/view";
import { forecastChart } from "./forecast-chart.ts";
import { windDirection } from "./wind-direction.ts";

export const weatherPlugin = defineMLFormPlugin({
  fields: [windDirection],
  reports: [forecastChart],
});

// The plugin registers the kinds; this maps the custom field's element for mountForm.
export const primitiveRegistry = createBuiltinPrimitiveRegistry().registerField(
  "wind-direction-field",
  "wind-direction-field",
);
