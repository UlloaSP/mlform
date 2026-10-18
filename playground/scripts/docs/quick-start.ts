import { mountForm } from "mlform";
import type { Transport } from "mlform/transport";

// A stand-in for your model. A real transport calls your backend and returns the same shape.
const transport: Transport = {
  async submit(request) {
    const temperature = Number(request.modelValues.temperature);
    const humidity = Number(request.modelValues.humidity);
    const estimate = temperature + (humidity > 70 ? -0.4 : 0.6);
    return {
      reports: [
        { backend: "default", mappedTo: "forecast", status: "ready", payload: { value: estimate } },
      ],
    };
  },
};

const container = document.querySelector<HTMLElement>("#forecast-form");
if (!container) throw new Error("Missing #forecast-form container.");

const mounted = mountForm(container, {
  schema: {
    fields: [
      {
        id: "temperature",
        kind: "number",
        label: "Temperature",
        unit: "°C",
        min: -40,
        max: 60,
        defaultValue: 21.5,
        required: true,
        mappedTo: "temperature",
      },
      {
        id: "humidity",
        kind: "number",
        label: "Humidity",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 58,
        required: true,
        mappedTo: "humidity",
      },
    ],
    reports: [
      {
        id: "forecast",
        kind: "regressor",
        label: "Next-hour estimate",
        unit: "°C",
        precision: 1,
        mappedTo: "forecast",
      },
    ],
  },
  transport,
  labels: { submit: "Run forecast" },
});

// Unmount when the page or component that owns the container goes away.
export const dispose = () => mounted.unmount();
