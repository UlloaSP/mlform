import type { PrimitiveAdapter } from "mlform/kit";
import type { PrimitiveRegistry } from "mlform/primitives";
import type { FormViewController, FormViewSnapshot, ResolvedFormLayoutNode } from "mlform/view";
import { createPrimitiveAdapter } from "mlform/kit";
import { FORM_LABELS, PRIMITIVE_TEXT } from "./config.ts";
import { getMaterialTotal } from "./materials.ts";
import { createMaterialsPanel } from "./materials-panel.ts";

const renderNode = (
  node: ResolvedFormLayoutNode,
  snapshot: FormViewSnapshot,
  view: FormViewController,
  ui: PrimitiveAdapter,
  materialSyncs: ReturnType<typeof createMaterialsPanel>[],
  submitPrediction: () => Promise<void>,
): HTMLElement => {
  if (node.kind === "section") {
    const section = document.createElement("section");
    section.className = "fd-layout-section";
    section.dataset.sectionId = node.id;

    if (node.title || node.description) {
      const copy = document.createElement("div");
      copy.className = "fd-layout-copy";

      if (node.title) {
        const title = document.createElement("h2");
        title.className = "fd-layout-title";
        title.textContent = node.title;
        copy.append(title);
      }

      if (node.description) {
        const description = document.createElement("p");
        description.className = "fd-layout-description";
        description.textContent = node.description;
        copy.append(description);
      }

      section.append(copy);
    }

    const children = document.createElement("div");
    children.className = "fd-layout-children";

    node.children.forEach((child) => {
      children.append(renderNode(child, snapshot, view, ui, materialSyncs, submitPrediction));
    });

    section.append(children);
    return section;
  }

  if (node.kind === "group") {
    const group = document.createElement("div");
    group.className = `fd-layout-group${node.columns ? ` fd-columns-${node.columns}` : ""}`;
    group.dataset.groupId = node.id;
    node.children.forEach((child) => {
      group.append(renderNode(child, snapshot, view, ui, materialSyncs, submitPrediction));
    });
    return group;
  }

  if (node.kind === "field") {
    const slot = document.createElement("div");
    slot.className = "fd-control-slot";
    ui.mountField(slot, node.field);
    return slot;
  }

  if (node.kind === "report") {
    const slot = document.createElement("div");
    slot.className = "fd-control-slot";
    ui.mountReport(slot, node.report);
    return slot;
  }

  if (node.kind === "custom" && node.id === "materials") {
    const panel = createMaterialsPanel(snapshot, view, submitPrediction);
    materialSyncs.push(panel);
    return panel.element;
  }

  throw new TypeError(`Unknown layout node "${node.kind}".`);
};

export const createViewShell = (
  view: FormViewController,
  host: HTMLElement,
  primitiveRegistry: PrimitiveRegistry,
  setBusy: (busy: boolean) => void,
) => {
  const ui = createPrimitiveAdapter(view, { primitiveRegistry, primitiveText: PRIMITIVE_TEXT });
  const snapshot = view.getSnapshot();
  const materialSyncs: ReturnType<typeof createMaterialsPanel>[] = [];
  const root = document.createElement("div");
  root.className = "fd-layout-root";
  let pending: { controller: AbortController; valuesKey: string; edited: boolean } | null = null;
  let disposed = false;
  let successfulSubmitCount = 0;
  let successfulValues: string | null = null;
  let resultInvalidated = false;
  const submitPrediction = async () => {
    if (pending || disposed) return;
    const submission = {
      controller: new AbortController(),
      valuesKey: JSON.stringify(view.form.state.values),
      edited: false,
    };
    pending = submission;
    sync(view.getSnapshot());
    try {
      await view.submit({ signal: submission.controller.signal });
    } catch (error) {
      if (
        !disposed &&
        !submission.edited &&
        error instanceof Error &&
        error.name !== "AbortError" &&
        view.form.state.errors.form.length === 0
      ) {
        view.form.setExternalErrors({ form: [error.message] });
      }
    } finally {
      if (pending === submission) pending = null;
      if (!disposed) sync(view.getSnapshot());
    }
  };
  try {
    if (snapshot.layout.kind !== "stacked" && snapshot.layout.kind !== "split")
      throw new Error("Formulation requires a single-page layout.");
    snapshot.layout.children.forEach((node) => {
      root.append(renderNode(node, snapshot, view, ui, materialSyncs, submitPrediction));
    });
  } catch (error) {
    ui.dispose();
    throw error;
  }

  const formColumn = root.querySelector<HTMLElement>('[data-group-id="form-column"]')!;
  const errors = document.createElement("div");
  errors.className = "fd-form-errors";
  errors.setAttribute("role", "alert");
  errors.dataset.role = "form-errors";
  const actions = document.createElement("div");
  actions.className = "fd-form-actions";
  actions.innerHTML = `
    <div class="fd-form-status" data-role="form-status" aria-live="polite"></div>
    <button class="fd-submit-button" type="button" data-role="submit-button"></button>
  `;
  formColumn?.append(errors, actions);
  host.replaceChildren(root);

  const submitButton = actions.querySelector<HTMLButtonElement>('[data-role="submit-button"]')!;
  submitButton?.addEventListener("click", () => {
    void submitPrediction();
  });
  const statusNode = actions.querySelector<HTMLElement>('[data-role="form-status"]')!;
  const results = root.querySelector<HTMLElement>('[data-section-id="prediction-section"]')!;
  const sync = (nextSnapshot: FormViewSnapshot) => {
    const valuesKey = JSON.stringify(nextSnapshot.form.values);
    if (pending && !pending.edited && valuesKey !== pending.valuesKey) {
      pending.edited = true;
      resultInvalidated = true;
      pending.controller.abort();
    }
    const operation = nextSnapshot.form.operation;
    const busy = Boolean(pending) || operation === "validating" || operation === "submitting";
    if (
      !busy &&
      nextSnapshot.form.submissionStatus === "succeeded" &&
      nextSnapshot.form.submitCount !== successfulSubmitCount
    ) {
      successfulSubmitCount = nextSnapshot.form.submitCount;
      successfulValues = valuesKey;
      resultInvalidated = false;
    }
    const stale = successfulValues !== null && valuesKey !== successfulValues;
    results.hidden =
      resultInvalidated ||
      (successfulValues !== null &&
        (busy || stale || nextSnapshot.form.submissionStatus !== "succeeded"));
    materialSyncs.forEach((panel) => panel.sync(nextSnapshot, busy));
    setBusy(busy);
    const formErrors = nextSnapshot.form.errors.form ?? [];
    errors.hidden = formErrors.length === 0;
    errors.replaceChildren(
      ...formErrors.map((message) => {
        const item = document.createElement("p");
        item.textContent = message;
        return item;
      }),
    );
    submitButton.disabled = busy || nextSnapshot.form.lifecycle !== "active";
    submitButton.textContent =
      operation === "validating"
        ? FORM_LABELS.validating
        : busy
          ? FORM_LABELS.submitting
          : FORM_LABELS.submit;
    const total = getMaterialTotal(nextSnapshot.form.values);
    const totalLabel = Number.isFinite(total)
      ? `Total ${total.toFixed(2)}/100`
      : "Correct the invalid percentages";
    statusNode.textContent =
      stale || resultInvalidated
        ? `Parameters changed. Complete Prediction to run again. | ${totalLabel}`
        : `Status ${PRIMITIVE_TEXT.formStateLabel(operation, nextSnapshot.form.submissionStatus)} | ${totalLabel}`;
  };
  sync(snapshot);
  return {
    sync,
    capturePresentationState: () => materialSyncs.map((panel) => panel.captureState()),
    restorePresentationState: (state: string[][] | undefined) =>
      materialSyncs.forEach((panel, index) => panel.restoreState(state?.[index])),
    dispose: () => {
      disposed = true;
      pending?.controller.abort();
      ui.dispose();
    },
  };
};
