import {
  MATERIAL_CATALOG,
  getMaterialFieldId,
  getMaterialOptionLabel,
} from "./material-catalog.js";
import { MATERIAL_FIELD_IDS, getMaterialTotal, getActiveMaterials } from "./materials.js";
import { FORM_LABELS } from "./config.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderMaterialOptions = (materials) =>
  materials.length === 0
    ? '<option value="">No more materials</option>'
    : materials
        .map(
          (material) =>
            `<option value="${escapeHtml(material.id)}">${escapeHtml(getMaterialOptionLabel(material.id))}</option>`,
        )
        .join("");

const renderMaterialRows = (materials) =>
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
            </article>
          `,
        )
        .join("");

export const createMaterialsPanel = (snapshot, view, submitPrediction) => {
  const panel = document.createElement("section");
  panel.className = "fd-materials-panel";

  const values = snapshot.form.values;
  const activeMaterials = getActiveMaterials(values);
  const availableMaterials = MATERIAL_CATALOG.filter(
    (material) => !activeMaterials.some((entry) => entry.id === material.id),
  );
  const total = getMaterialTotal(values);
  const totalClass = Math.abs(total - 100) < 0.001 ? "good" : total > 100 ? "bad" : "warn";

  panel.innerHTML = `
    <style>
      .fd-materials-panel,.fd-materials-panel *{box-sizing:border-box}
      .fd-materials-panel{display:grid;gap:1rem}
      .fd-materials-split{display:grid;gap:1rem;grid-template-columns:minmax(260px,.78fr) minmax(360px,1.22fr);align-items:start}
      .fd-material-card{display:grid;gap:.9rem;padding:1rem;border:1px solid color-mix(in srgb,var(--mlf-color-border,#d9dce7) 88%,transparent);border-radius:1rem;background:color-mix(in srgb,var(--mlf-color-surface,#fff) 96%,transparent)}
      .fd-material-card.current{grid-template-rows:auto minmax(0,1fr);min-height:0}
      .fd-material-heading{margin:0;text-align:center;font-size:1.85rem;font-weight:500}
      .fd-material-sub{margin:0;text-align:center;color:var(--mlf-color-text-muted,#5f5a87)}
      .fd-material-grid{display:grid;gap:.9rem;grid-template-columns:1fr 140px}
      .fd-material-label{display:grid;gap:.35rem}
      .fd-material-label span{text-align:center;font-size:.95rem;color:var(--mlf-color-text,#2c2847)}
      .fd-material-label select,.fd-material-label input{width:100%;min-height:var(--mlf-control-height,3rem);padding:.7rem .95rem;border-radius:var(--mlf-input-radius,12px);border:1px solid var(--mlf-color-border,#d9dce7);background:var(--mlf-color-surface,#fff);color:var(--mlf-color-text,#2c2847);font:inherit}
      .fd-material-add{justify-self:center;display:inline-flex;align-items:center;gap:.65rem;padding:.72rem 1rem;border:0;border-radius:.45rem;background:var(--mlf-color-accent,#5f5f63);color:var(--mlf-color-text-inverse,#fff);cursor:pointer}
      .fd-material-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem}
      .fd-material-badge{display:inline-flex;align-items:center;justify-content:center;padding:.28rem .7rem;border-radius:999px;font-size:.92rem;font-weight:700}
      .fd-material-badge.good{background:var(--mlf-color-surface-muted,#e8f8e9);color:var(--mlf-color-success,#16702a)}
      .fd-material-badge.warn{background:var(--mlf-color-surface-muted,#fff4d7);color:var(--mlf-color-warning,#8f5a00)}
      .fd-material-badge.bad{background:var(--mlf-color-danger-soft,rgba(239,64,73,.16));color:var(--mlf-color-danger,#b21f28)}
      .fd-material-danger{border:0;border-radius:.4rem;background:var(--mlf-color-danger,#ef4049);color:var(--mlf-color-text-inverse,#fff);padding:.72rem .95rem;cursor:pointer}
      .fd-material-list{display:grid;gap:.8rem;max-height:34rem;overflow:auto;padding-right:.25rem}
      .fd-material-row{display:grid;gap:.8rem;padding:.9rem;border-radius:.8rem;border:1px solid color-mix(in srgb,var(--mlf-color-border,#d9dce7) 88%,transparent)}
      .fd-material-top{display:flex;align-items:center;justify-content:space-between;gap:.7rem}
      .fd-material-name{flex:1;text-align:center;color:var(--mlf-color-text,#2c2847)}
      .fd-material-remove{border:0;border-radius:.35rem;background:transparent;color:var(--mlf-color-text-muted,#5f5a87);cursor:pointer;font-size:.78rem;padding:.35rem .45rem}
      .fd-material-remove:hover{background:var(--mlf-color-hover-surface,rgba(95,90,135,.1));color:var(--mlf-color-text,#2c2847)}
      .fd-material-controls{display:grid;gap:.9rem;align-items:center;grid-template-columns:1fr 112px}
      .fd-material-range{width:100%;accent-color:var(--mlf-color-accent,#8f8cd2)}
      .fd-material-mini{display:grid;justify-items:center;gap:.3rem}
      .fd-material-mini input{width:100%;min-height:2.85rem;padding:.45rem .7rem;border-radius:.55rem;border:1px solid var(--mlf-color-border,#d9dce7);background:var(--mlf-color-surface,#fff);color:var(--mlf-color-text,#2c2847)}
      .fd-material-mini span{font-size:.84rem;color:var(--mlf-color-text-muted,#5f5a87)}
      .fd-material-empty{padding:.9rem 1rem;border-radius:.8rem;border:1px dashed var(--mlf-color-border,#d9dce7);text-align:center;color:var(--mlf-color-text-muted,#5f5a87)}
      @media (max-width:860px){.fd-materials-split,.fd-material-grid,.fd-material-controls{grid-template-columns:1fr}.fd-material-toolbar{flex-direction:column;align-items:stretch}}
    </style>
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

  const setMaterialValue = (materialId, value) => {
    const numeric = Number(value);
    const clamped = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 0;
    view.form.getField(getMaterialFieldId(materialId))?.setValue(clamped);
  };

  panel.querySelector('[data-role="add-material"]')?.addEventListener("click", () => {
    const select = panel.querySelector('[data-role="material-select"]');
    const draft = panel.querySelector('[data-role="draft-proportion"]');
    const materialId = select instanceof HTMLSelectElement ? select.value : "";
    const proportion = draft instanceof HTMLInputElement ? draft.value : "0";
    if (materialId) {
      setMaterialValue(materialId, proportion);
    }
  });

  panel.querySelector('[data-role="remove-all"]')?.addEventListener("click", () => {
    view.form.setValues(Object.fromEntries(MATERIAL_FIELD_IDS.map((fieldId) => [fieldId, 0])));
  });

  panel.querySelector('[data-role="submit-inline"]')?.addEventListener("click", () => {
    void submitPrediction();
  });

  panel.addEventListener("click", (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest('[data-role="remove-material"]')
        : null;
    if (target) setMaterialValue(target.dataset.materialId, 0);
  });
  panel.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.role === "material-range" || target.dataset.role === "material-number") {
      setMaterialValue(target.dataset.materialId, target.value);
    }
  });

  let activeIds = activeMaterials.map((material) => material.id).join("|");
  const sync = (nextSnapshot, busy = false) => {
    const nextActive = getActiveMaterials(nextSnapshot.form.values);
    const nextIds = nextActive.map((material) => material.id).join("|");
    const list = panel.querySelector(".fd-material-list");
    if (nextIds !== activeIds) {
      activeIds = nextIds;
      list.innerHTML = renderMaterialRows(nextActive);
      const available = MATERIAL_CATALOG.filter(
        (material) => !nextActive.some((entry) => entry.id === material.id),
      );
      const select = panel.querySelector('[data-role="material-select"]');
      select.innerHTML = renderMaterialOptions(available);
      panel.querySelector('[data-role="add-material"]').disabled = available.length === 0;
    } else {
      for (const material of nextActive) {
        const row = Array.from(list.querySelectorAll("[data-material-id]")).find(
          (entry) =>
            entry.classList.contains("fd-material-row") && entry.dataset.materialId === material.id,
        );
        row?.querySelectorAll("input").forEach((input) => {
          if (input !== panel.ownerDocument.activeElement) input.value = String(material.value);
        });
      }
    }
    const nextTotal = getMaterialTotal(nextSnapshot.form.values);
    const badge = panel.querySelector(".fd-material-badge");
    badge.className = `fd-material-badge ${Math.abs(nextTotal - 100) < 0.001 ? "good" : nextTotal > 100 ? "bad" : "warn"}`;
    badge.textContent = `Current % (w/w): ${nextTotal.toFixed(2)}`;
    panel.querySelector('[data-role="remove-all"]').disabled = nextActive.length === 0;
    const operation = nextSnapshot.form.operation;
    const inlineSubmit = panel.querySelector('[data-role="submit-inline"]');
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
  return { element: panel, sync };
};
