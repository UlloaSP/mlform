import type { FormSchema } from "mlform/schema";
import { location, temperature } from "../landing/weather.ts";

const schema: FormSchema = {
  fields: [temperature, location],
  reports: [
    {
      id: "condition",
      kind: "classifier",
      label: "Expected conditions",
      labels: ["Stable", "Changing"],
      mappedTo: "condition",
    },
  ],
};
const results = `[{ backend: "default", mappedTo: "condition", status: "ready", payload: { prediction: "Stable", probabilities: [0.92, 0.08] } }]`;

// One labelled mount per design option, so a single capture compares them on equal terms.
const gridCode = (option: "theme" | "recipe", values: readonly string[], columns: number) =>
  `import { mountForm } from "mlform";
const root = document.querySelector<HTMLElement>("#form")!;
root.style.cssText = "display: grid; grid-template-columns: repeat(${columns}, 340px); gap: 28px 24px; align-items: start; width: max-content";
for (const value of ${JSON.stringify(values)}) {
  const cell = root.appendChild(document.createElement("section"));
  const title = cell.appendChild(document.createElement("p"));
  title.textContent = value;
  title.style.cssText = "margin: 0 0 10px; font: 600 15px/1 var(--brand-font-mono); color: var(--mlf-color-text-muted)";
  const mounted = mountForm(cell.appendChild(document.createElement("div")), {
    schema: ${JSON.stringify(schema)},
    designSystem: { ${option}: value },
    transport: { async submit() { return { reports: ${results} }; } },
  });
  await mounted.form.submit();
}`;

export const themes = ["eshkra", "neutral", "cobalt", "graphite", "sage", "sunset"] as const;
export const recipes = ["default", "minimal", "soft", "contrast"] as const;
export const themesCode = gridCode("theme", themes, 3);
export const recipesCode = gridCode("recipe", recipes, 4);
