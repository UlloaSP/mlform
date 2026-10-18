import { STARTER_CODE } from "./example.ts";
import { LAYOUT_EXAMPLES } from "./examples/layouts.ts";
import { SERIES_CODE } from "./examples/series.ts";
import { CHOICES_CODE } from "./examples/choices.ts";

export const CODE_EXAMPLES = [
  { id: "basic", label: "Basic · number and prediction", code: STARTER_CODE },
  ...LAYOUT_EXAMPLES,
  { id: "series", label: "Series · live aggregates", code: SERIES_CODE },
  { id: "choices", label: "Choices · mappings and conditions", code: CHOICES_CODE },
];
export const getCodeExample = (id: unknown) =>
  CODE_EXAMPLES.find((example) => example.id === id) ?? CODE_EXAMPLES[0];
