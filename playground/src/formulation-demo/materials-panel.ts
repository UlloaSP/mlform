import type { FormViewController, FormViewSnapshot } from "mlform/view";
import {
  MATERIAL_CATALOG,
  getMaterialFieldId,
  getMaterialOptionLabel,
} from "./material-catalog.ts";
import { MATERIAL_FIELD_IDS, getMaterialTotal, getActiveMaterials } from "./materials.ts";
import { FORM_LABELS } from "./config.ts";
import "./materials-panel.css";

const escapeHtml = (value: unknown) =>
  String(
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? value
      : "",
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderMaterialOptions = (materials: { id: string; value?: unknown }[]) =>
  materials.length === 0
    ? '<option value="">No more materials</option>'
    : materials
        .map(
          (material) =>
            `<option value="${escapeHtml(material.id)}">${escapeHtml(getMaterialOptionLabel(material.id))}</option>`,
        )
        .join("");

const renderMaterialRows = (materials: { id: string; value?: unknown }[]) =>
  materials.length === 0
    ? '<div class="fd-material-empty">All materials currently at 0% w/w.</div>'
    : materials
        .map(
          (material) => `
            <article class="fd-material-row" data-material-id="${escapeHtml(material.id)}">
              <div class="fd-material-top">
                <div class="fd-material-name">${escapeHtml(getMaterialOptionLabel(material.id))}</div>
                <button class="fd-material-remove" type="button" aria-label="Remove ${escapeHtml(getMaterialOptionLabel(material.id))}" data-role="remove-material" data-material-id="${escapeHtml(material.id)}">Remove</button>
              </div>
              <div class="fd-material-controls">
                <input class="fd-material-range" aria-label="${escapeHtml(getMaterialOptionLabel(material.id))} proportion" name="${escapeHtml(material.id)}-range" type="range" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-range" data-material-id="${escapeHtml(material.id)}" />
                <div class="fd-material-mini">
                  <input aria-label="${escapeHtml(getMaterialOptionLabel(material.id))} percentage" name="${escapeHtml(material.id)}-percentage" autocomplete="off" type="number" min="0" max="100" step="1" value="${escapeHtml(material.value)}" data-role="material-number" data-material-id="${escapeHtml(material.id)}" />
                  <span>% w/w</span>
                </div>
              </div>
              <p class="fd-material-error" data-role="material-error" role="status" hidden></p>
            </article>
          `,
        )
        .join("");

export const createMaterialsPanel = (
  snapshot: FormViewSnapshot,
  view: FormViewController,
  submitPrediction: () => Promise<void>,
) => {
  const panel = document.createElement("section");
  panel.className = "fd-materials-panel";

  const values = snapshot.form.values;
  const activeMaterials = getActiveMaterials(values);
  const selectedIds = new Set(activeMaterials.map(({ id }) => id));
  const availableMaterials = MATERIAL_CATALOG.filter(
    (material) => !activeMaterials.some((entry) => entry.id === material.id),
  );
  const total = getMaterialTotal(values);
  const totalClass = Math.abs(total - 100) < 0.001 ? "good" : total > 100 ? "bad" : "warn";

  panel.innerHTML = `

    <div class="fd-materials-split">
      <section class="fd-material-card current">
        <h3 class="fd-material-heading">Materials</h3>
        <p class="fd-material-sub">Select a material</p>
        <div class="fd-material-grid">
          <label class="fd-material-label">
            <span>Select a material</span>
              <select name="material" autocomplete="off" data-role="material-select">
              ${renderMaterialOptions(availableMaterials)}
            </select>
          </label>
          <label class="fd-material-label">
            <span>Proportion (w/w)</span>
            <input aria-label="Draft material proportion" name="draft-proportion" autocomplete="off" data-role="draft-proportion" type="number" min="0" max="100" step="1" value="0" />
          </label>
        </div>
        <button class="fd-material-add" type="button" data-role="add-material"${
          availableMaterials.length === 0 ? " disabled" : ""
        }>Add material <strong>+</strong></button>
      </section>
      <section class="fd-material-card">
        <div class="fd-material-toolbar">
          <button class="fd-submit-button" type="button" data-role="submit-inline"></button>
          <h3 class="fd-material-heading">Current Materials</h3>
          <div class="fd-material-badge ${totalClass}">Current % (w/w): ${escapeHtml(total.toFixed(2))}</div>
          <button class="fd-material-danger" type="button" data-role="remove-all"${
            activeMaterials.length === 0 ? " disabled" : ""
          }>Remove All</button>
        </div>
        <div class="fd-material-list">
          ${renderMaterialRows(activeMaterials)}
        </div>
      </section>
    </div>
  `;

  const setMaterialValue = (materialId: string, value: unknown) => {
    view.form.getField(getMaterialFieldId(materialId))?.setValue(value);
  };

  panel
    .querySelector<HTMLButtonElement>('[data-role="add-material"]')
    ?.addEventListener("click", () => {
      const select = panel.querySelector<HTMLSelectElement>('[data-role="material-select"]')!;
      const draft = panel.querySelector<HTMLInputElement>('[data-role="draft-proportion"]')!;
      const materialId = select instanceof HTMLSelectElement ? select.value : "";
      const proportion = draft instanceof HTMLInputElement ? draft.value : "0";
      if (materialId) {
        selectedIds.add(materialId);
        setMaterialValue(materialId, proportion);
      }
    });

  panel
    .querySelector<HTMLButtonElement>('[data-role="remove-all"]')
    ?.addEventListener("click", () => {
      selectedIds.clear();
      view.form.setValues(Object.fromEntries(MATERIAL_FIELD_IDS.map((fieldId) => [fieldId, 0])));
    });

  panel
    .querySelector<HTMLButtonElement>('[data-role="submit-inline"]')
    ?.addEventListener("click", () => {
      void submitPrediction();
    });

  panel.addEventListener("click", (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-role="remove-material"]')
        : null;
    if (target) {
      selectedIds.delete(target.dataset.materialId!);
      setMaterialValue(target.dataset.materialId!, 0);
      panel.querySelector<HTMLSelectElement>('[data-role="material-select"]')!.focus();
    }
  });
  panel.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.role === "material-range" || target.dataset.role === "material-number") {
      setMaterialValue(target.dataset.materialId!, target.value);
    }
  });

  let activeIds = activeMaterials.map((material) => material.id).join("|");
  const sync = (nextSnapshot: FormViewSnapshot, busy = false) => {
    for (const material of getActiveMaterials(nextSnapshot.form.values))
      selectedIds.add(material.id);
    const nextActive = MATERIAL_CATALOG.filter(({ id }) => selectedIds.has(id)).map((material) => ({
      ...material,
      value: nextSnapshot.form.values[getMaterialFieldId(material.id)] ?? "",
    }));
    const nextIds = nextActive.map((material) => material.id).join("|");
    const list = panel.querySelector<HTMLElement>(".fd-material-list")!;
    if (nextIds !== activeIds) {
      activeIds = nextIds;
      list.innerHTML = renderMaterialRows(nextActive);
      const available = MATERIAL_CATALOG.filter(
        (material) => !nextActive.some((entry) => entry.id === material.id),
      );
      const select = panel.querySelector<HTMLSelectElement>('[data-role="material-select"]')!;
      select.innerHTML = renderMaterialOptions(available);
      panel.querySelector<HTMLButtonElement>('[data-role="add-material"]')!.disabled =
        available.length === 0;
    } else {
      for (const material of nextActive) {
        const row = Array.from(list.querySelectorAll<HTMLElement>("[data-material-id]")).find(
          (entry) =>
            entry.classList.contains("fd-material-row") && entry.dataset.materialId === material.id,
        );
        row?.querySelectorAll("input").forEach((input) => {
          if (input !== panel.ownerDocument.activeElement)
            input.value =
              typeof material.value === "string" || typeof material.value === "number"
                ? String(material.value)
                : "";
        });
      }
    }
    for (const row of list.querySelectorAll<HTMLElement>(".fd-material-row")) {
      const field = view.form.getField(getMaterialFieldId(row.dataset.materialId!));
      const errors = field!.state.errors;
      const message = row.querySelector<HTMLElement>('[data-role="material-error"]')!;
      message.textContent = errors.join(" ");
      message.hidden = errors.length === 0;
      row
        .querySelectorAll("input")
        .forEach((input) => input.setAttribute("aria-invalid", String(errors.length > 0)));
    }
    const nextTotal = getMaterialTotal(nextSnapshot.form.values);
    const badge = panel.querySelector<HTMLElement>(".fd-material-badge")!;
    badge.className = `fd-material-badge ${Math.abs(nextTotal - 100) < 0.001 ? "good" : nextTotal > 100 ? "bad" : "warn"}`;
    badge.textContent = Number.isFinite(nextTotal)
      ? `Current % (w/w): ${nextTotal.toFixed(2)}`
      : "Correct the invalid percentages";
    panel.querySelector<HTMLButtonElement>('[data-role="remove-all"]')!.disabled =
      nextActive.length === 0;
    const operation = nextSnapshot.form.operation;
    const inlineSubmit = panel.querySelector<HTMLButtonElement>('[data-role="submit-inline"]')!;
    inlineSubmit.disabled =
      busy ||
      nextSnapshot.form.lifecycle !== "active" ||
      operation === "validating" ||
      operation === "submitting";
    inlineSubmit.textContent =
      operation === "validating"
        ? FORM_LABELS.validating
        : busy || operation === "submitting"
          ? FORM_LABELS.submitting
          : FORM_LABELS.submit;
  };
  sync(snapshot);
  return {
    element: panel,
    sync,
    captureState: () => [...selectedIds],
    restoreState(ids: string[] | undefined) {
      if (!ids) return;
      selectedIds.clear();
      for (const id of ids) {
        if (MATERIAL_CATALOG.some((material) => material.id === id)) selectedIds.add(id);
      }
      sync(view.getSnapshot());
    },
  };
};
