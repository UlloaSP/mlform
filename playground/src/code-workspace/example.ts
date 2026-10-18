export const STARTER_CODE = `import { mountForm } from "mlform";

mountForm(document.querySelector<HTMLElement>("#form")!, {
  schema: {
    fields: [
      {
        id: "hours",
        kind: "number",
        label: "Hours per week",
        mappedTo: "hours",
        min: 0,
        max: 40,
        defaultValue: 5,
        required: true,
      },
    ],
    reports: [
      {
        id: "total",
        kind: "regressor",
        label: "Hours in four weeks",
        mappedTo: "total",
        unit: "h",
      },
    ],
  },
  transport: {
    async submit({ modelValues }) {
      // A local calculation: no backend is needed for this example.
      return {
        reports: [{
          backend: "default",
          mappedTo: "total",
          status: "ready",
          payload: { value: Number(modelValues.hours) * 4 },
        }],
      };
    },
  },
});
`;
