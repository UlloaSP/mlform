import { attachDesignSystem } from "mlform/design";
import { createPrimitiveAdapter } from "mlform/kit";
import { createFormView } from "mlform/view";
import { createDemoTransport, layouts, schema, type Cleanup } from "./layout-showcase-config";

// The page's own tabs and footer around MLForm's controls: the shell is built once, and the
// adapter keeps each control in its slot and hides the ones outside the active tab.
export const mountCustomHeadless = (host: HTMLElement): Cleanup => {
  const view = createFormView({ schema, transport: createDemoTransport(), layout: layouts.tabs });
  const design = attachDesignSystem(host, { config: { theme: "eshkra" } });
  const ui = createPrimitiveAdapter(view);

  host.innerHTML = `
    <div class="custom-shell">
      <nav class="custom-nav" aria-label="Application sections"></nav>
      <div class="custom-main">
        <div class="custom-slots"></div>
        <footer class="custom-footer">
          <span class="custom-status" role="status"></span>
          <button type="button" class="custom-submit">Assess risk</button>
        </footer>
      </div>
    </div>`;
  const nav = host.querySelector<HTMLElement>(".custom-nav")!;
  const slots = host.querySelector<HTMLElement>(".custom-slots")!;
  const status = host.querySelector<HTMLElement>(".custom-status")!;
  const submit = host.querySelector<HTMLButtonElement>(".custom-submit")!;

  const tabButtons = layouts.tabs.tabs.map((tab) => {
    const button = nav.appendChild(document.createElement("button"));
    button.type = "button";
    button.textContent = tab.title;
    button.addEventListener("click", () => void view.navigation.activate(tab.id));
    return button;
  });
  for (const field of schema.fields) ui.mountField(slots.appendChild(document.createElement("div")), field.id!);
  ui.mountReport(slots.appendChild(document.createElement("div")), "risk");
  submit.addEventListener("click", () => void view.submit().catch(() => {}));

  const update = () => {
    const { tabs, form } = view.state;
    tabButtons.forEach((button, index) =>
      button.setAttribute("aria-current", String(index === tabs?.activeTabIndex)),
    );
    const busy = form.operation !== "idle";
    submit.disabled = busy;
    status.textContent = busy ? "Working…" : form.submissionStatus === "succeeded" ? "Assessed" : "";
  };
  update();
  const unsubscribe = view.subscribe(update);

  return () => {
    unsubscribe();
    ui.dispose();
    view.dispose();
    design.disconnect();
    host.replaceChildren();
  };
};
