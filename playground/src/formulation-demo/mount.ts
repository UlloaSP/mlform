import type { PresentationState } from "../demo-types.ts";
import type { DesignSystemConfig } from "mlform/design";
import { attachDesignSystem } from "mlform/design";
import { FORMULATION_EXAMPLES, getExampleById } from "./examples.ts";
import { createFormulationPrimitiveRegistry } from "./primitive-registry.ts";
import { createView } from "./config.ts";
import { createViewShell } from "./view-shell.ts";

const createShell = () => {
  const page = document.createElement("main");
  page.className = "fd-shell";
  page.innerHTML = `
    <div class="fd-page">
      <section class="fd-card fd-top-card">
        <h1 class="fd-top-heading">
          <button class="fd-top-toggle" type="button" aria-label="Toggle example loader" aria-expanded="true" aria-controls="fd-example-loader">
            <span>Load an example</span>
            <svg class="fd-top-caret is-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </h1>
        <div class="fd-top-body" id="fd-example-loader">
          <div class="fd-top-form">
            <div class="fd-host-field">
              <select name="example" aria-label="Select an example" autocomplete="off" data-role="example-select"></select>
            </div>
            <button class="fd-host-button" type="button" data-role="load-example">
              Load materials
            </button>
          </div>
        </div>
      </section>
      <section class="fd-form-shell">
        <div class="fd-form-host" data-role="form-host"></div>
      </section>
    </div>
  `;
  return page;
};

const populateExampleSelect = (select: HTMLSelectElement, selectedId: string) => {
  select.replaceChildren(
    ...FORMULATION_EXAMPLES.map((example) => {
      const option = document.createElement("option");
      option.value = example.id;
      option.textContent = example.label;
      option.selected = example.id === selectedId;
      return option;
    }),
  );
};

export const mountFormulationDemo = (
  container: HTMLElement = document.body,
  designSystem: DesignSystemConfig,
) => {
  const shell = createShell();
  container.replaceChildren(shell);
  const attachedDesign = attachDesignSystem(shell, { config: designSystem });

  const select = shell.querySelector('[data-role="example-select"]');
  const loadButton = shell.querySelector('[data-role="load-example"]');
  const formHost = shell.querySelector('[data-role="form-host"]');
  const topToggle = shell.querySelector(".fd-top-toggle");
  const topBody = shell.querySelector(".fd-top-body");
  const caret = shell.querySelector(".fd-top-caret");

  if (
    !(select instanceof HTMLSelectElement) ||
    !(loadButton instanceof HTMLButtonElement) ||
    !(formHost instanceof HTMLElement)
  ) {
    throw new Error("Formulation demo shell failed to initialize.");
  }

  let selectedExampleId = "example-2";
  populateExampleSelect(select, selectedExampleId);

  let view: ReturnType<typeof createView>;
  let rendered: ReturnType<typeof createViewShell>;
  let unsubscribe = () => {};
  const primitiveRegistry = createFormulationPrimitiveRegistry();

  const mountView = (initialValues?: Record<string, unknown>) => {
    unsubscribe();
    rendered?.dispose();
    view?.dispose();
    view = createView(initialValues);
    rendered = createViewShell(view, formHost, primitiveRegistry, (busy) => {
      loadButton.disabled = busy;
      select.disabled = busy;
    });
    unsubscribe = view.subscribe((snapshot) => {
      rendered.sync(snapshot);
    });
  };

  mountView(getExampleById(selectedExampleId)?.values);

  select.addEventListener("change", () => {
    selectedExampleId = select.value;
  });

  loadButton.addEventListener("click", () => {
    if (loadButton.disabled) return;
    const example = getExampleById(selectedExampleId);
    if (!example) {
      return;
    }
    mountView(example.values);
  });

  topToggle?.addEventListener("click", () => {
    const expanded = topToggle.getAttribute("aria-expanded") !== "false";
    topToggle.setAttribute("aria-expanded", String(!expanded));
    if (topBody instanceof HTMLElement) {
      topBody.hidden = expanded;
    }
    caret?.classList.toggle("is-open", !expanded);
  });

  return {
    get form() {
      return view.form;
    },
    capturePresentationState: () => ({
      materials: rendered.capturePresentationState(),
      example: selectedExampleId,
    }),
    restorePresentationState(state: PresentationState | undefined) {
      if (!state || !("materials" in state)) return;
      rendered.restorePresentationState(state.materials);
      selectedExampleId = state.example;
      select.value = selectedExampleId;
    },
    updateDesignSystem(config: DesignSystemConfig) {
      attachedDesign.update(config);
    },
    unmount() {
      unsubscribe();
      rendered?.dispose();
      view?.dispose();
      attachedDesign.disconnect();
      shell.remove();
    },
  };
};
