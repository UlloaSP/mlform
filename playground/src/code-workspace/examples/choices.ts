export const CHOICES_CODE = `import { mountForm } from "mlform";

mountForm(document.querySelector<HTMLElement>("#form")!, {
  schema: {
    fields: [
      { id: "size", kind: "category", label: "Size", mappedTo: "size",
        options: ["small", "large"], defaultValue: "small" },
      { id: "speed", kind: "single-choice", label: "Delivery", mappedTo: "speed",
        layout: "horizontal", options: ["standard", "express"], defaultValue: "standard" },
      { id: "extras", kind: "multi-choice", label: "Extras", mappedTo: "extras",
        options: ["tracking", "insurance"], defaultValue: ["tracking"] },
      { id: "region", kind: "onehot-category", label: "Region", defaultValue: "local",
        options: [
          { label: "Local", value: "local", mappedTo: "is_local" },
          { label: "International", value: "international", mappedTo: "is_international" },
        ] },
      { id: "preset", kind: "mapped-category", label: "Package preset", defaultValue: "light",
        options: [
          { label: "Light · 1 kg", value: "light", mapping: { weight: 1 } },
          { label: "Heavy · 5 kg", value: "heavy", mapping: { weight: 5 } },
        ] },
      { id: "weight", kind: "number", label: "Package weight", mappedTo: "weight",
        defaultValue: 1, min: 0.1, unit: "kg" },
      { id: "customs", kind: "text", label: "Customs note", mappedTo: "customs",
        defaultValue: "Sample package", required: true,
        hiddenWhen: { kind: "field-value", field: "region", equals: "local" } },
    ],
    reports: [
      { id: "cost", kind: "regressor", label: "Estimated shipping", mappedTo: "cost", unit: "EUR" },
      { id: "route", kind: "classifier", label: "Route", mappedTo: "route", labels: ["Domestic", "International"] },
    ],
  },
  transport: {
    async submit({ modelValues: values }) {
      const cost = Number(values.weight) * 3 + (values.speed === "express" ? 10 : 0);
      return { reports: [
        { backend: "default", mappedTo: "cost", status: "ready", payload: { value: cost } },
        { backend: "default", mappedTo: "route", status: "ready", payload: { prediction: values.is_local ? "0" : "1" } },
      ] };
    },
  },
});
`;
