import { attachDesignSystem } from "mlform/design";
import { createPrimitiveAdapter } from "mlform/kit";
import { createFormView } from "mlform/view";

// The application owns this markup; MLForm only fills the three slots.
const host = document.querySelector<HTMLElement>("#form")!;
host.innerHTML = `
  <article class="station-card">
    <header>
      <h2>North station</h2>
      <p>Live readings · updated 09:40</p>
    </header>
    <div class="readings">
      <div data-slot="temperature"></div>
      <div data-slot="humidity"></div>
    </div>
    <aside data-slot="forecast"></aside>
    <footer><button type="button">Run forecast</button></footer>
  </article>`;
const slot = (name: string) => host.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

const view = createFormView({
  schema: {
    fields: [
      {
        id: "temperature",
        kind: "number",
        label: "Temperature",
        unit: "°C",
        defaultValue: 21.5,
        mappedTo: "temperature",
      },
      {
        id: "humidity",
        kind: "number",
        label: "Humidity",
        unit: "%",
        defaultValue: 58,
        mappedTo: "humidity",
      },
    ],
    reports: [
      {
        id: "forecast",
        kind: "regressor",
        label: "Next-hour estimate",
        unit: "°C",
        mappedTo: "forecast",
      },
    ],
  },
  transport: {
    async submit() {
      return {
        reports: [
          { backend: "default", mappedTo: "forecast", status: "ready", payload: { value: 22.66 } },
        ],
      };
    },
  },
});
// Built-in controls need MLForm's tokens; the adapter leaves styling to the host.
const design = attachDesignSystem(host, { config: { theme: "eshkra" } });
const ui = createPrimitiveAdapter(view);
ui.mountField(slot("temperature"), "temperature");
ui.mountField(slot("humidity"), "humidity");
ui.mountReport(slot("forecast"), "forecast");
host.querySelector("button")!.addEventListener("click", () => void view.submit());

// Call these when the host view is removed.
export const dispose = () => {
  ui.dispose();
  view.dispose();
  design.disconnect();
};
