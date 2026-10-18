import { attachDesignSystem } from "mlform/design";
import { FORMULATION_EXAMPLES, getExampleById } from "./examples.js";
import { createFormulationPrimitiveRegistry } from "./primitive-registry.js";
import { createView } from "./config.js";
import { createViewShell } from "./view-shell.js";

const createShell = () => {
  const page = document.createElement("main");
  page.className = "fd-shell";
  page.innerHTML = `
    <div class="fd-page">
      <section class="fd-card fd-top-card">
        <button class="fd-top-toggle" type="button" aria-label="Toggle example loader" aria-expanded="true">
          <div>
            <h1>Load an example</h1>
            <p>Select an example</p>
          </div>
          <span class="fd-top-caret is-open" aria-hidden="true">^</span>
        </button>
        <div class="fd-top-body">
          <div class="fd-top-form">
            <label class="fd-host-field">
              <span>Select an example</span>
              <select name="example" autocomplete="off" data-role="example-select"></select>
            </label>
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

const populateExampleSelect = (select, selectedId) => {
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

export const mountFormulationDemo = (container = document.body, designSystem) => {
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

  let view = null;
  let rendered = null;
  let unsubscribe = () => {};
  const primitiveRegistry = createFormulationPrimitiveRegistry();

  const mountView = (initialValues) => {
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
    updateDesignSystem(config) {
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
