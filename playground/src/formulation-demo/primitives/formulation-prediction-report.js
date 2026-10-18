export const FORMULATION_PREDICTION_REPORT_TAG = "mlf-formulation-prediction-report";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

class FormulationPredictionReportElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._descriptor = null;
    this._context = undefined;
  }

  set controller(value) {
    this._controller = value;
  }

  set descriptor(value) {
    this._descriptor = value;
    this.#render();
  }

  set context(value) {
    this._context = value;
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  #renderChart(points) {
    if (!Array.isArray(points) || points.length === 0) {
      return `<div class="empty">No dissolution prediction is available.</div>`;
    }

    const width = 520;
    const height = 320;
    const padding = 34;
    const maxX = Math.max(...points.map((point) => point.timeMinutes), 1);
    const maxY = Math.max(...points.map((point) => point.dissolvedPercent), 100);
    const projectX = (value) => padding + (value / maxX) * (width - padding * 2);
    const projectY = (value) => height - padding - (value / maxY) * (height - padding * 2);
    const polyline = points
      .map((point) => `${projectX(point.timeMinutes)},${projectY(point.dissolvedPercent)}`)
      .join(" ");
    const yTicks = [0, 20, 40, 60, 80, 100];

    return `
      <div class="chart-wrap">
        <div class="legend"><span class="swatch"></span>Dissolution over time</div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Dissolution over time">
          ${yTicks
            .map(
              (tick) => `
                <g>
                  <line x1="${padding}" y1="${projectY(tick)}" x2="${width - padding}" y2="${projectY(tick)}" class="grid-line"></line>
                  <text x="${padding - 8}" y="${projectY(tick) + 4}" class="label">${tick}</text>
                </g>
              `,
            )
            .join("")}
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="axis"></line>
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="axis"></line>
          ${[0, maxX / 2, maxX].map((time) => `<text x="${projectX(time)}" y="${height - padding + 16}" class="label center">${time.toFixed(1)}</text>`).join("")}
          <polyline class="line" points="${polyline}"></polyline>
          ${points
            .map(
              (point) =>
                `<circle class="point" cx="${projectX(point.timeMinutes)}" cy="${projectY(point.dissolvedPercent)}" r="4"></circle>`,
            )
            .join("")}
          <text x="${width / 2}" y="${height - 6}" class="label center">Time (minutes)</text>
          <text x="12" y="${height / 2}" class="label" transform="rotate(-90 12 ${height / 2})">Amount dissolved (%)</text>
        </svg>
        <details>
          <summary>Dissolution times</summary>
          <table aria-label="Dissolution times">
            <thead><tr><th scope="col">Amount dissolved (%)</th><th scope="col">Time (minutes)</th></tr></thead>
            <tbody>${points.map((point) => `<tr><td>${escapeHtml(point.dissolvedPercent)}</td><td>${escapeHtml(point.timeMinutes.toFixed(2))}</td></tr>`).join("")}</tbody>
          </table>
        </details>
      </div>
    `;
  }

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const props = this._descriptor?.props ?? {};
    const payload = props.payload;
    const error = typeof props.error === "string" ? props.error : null;
    const summary = payload?.summary ?? null;
    const curve = Array.isArray(payload?.curve) ? payload.curve : [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .grid { display:grid; gap:1rem; grid-template-columns:minmax(260px, .85fr) minmax(360px, 1.15fr); }
        .table { border-top:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); }
        .row { display:grid; grid-template-columns:1fr 100px; min-height:3.4rem; border-bottom:1px solid color-mix(in srgb, var(--mlf-color-border, #d9dce7) 88%, transparent); }
        .row span,.row strong { display:flex; align-items:center; padding:.85rem 1rem; }
        .row strong { justify-content:center; font-weight:500; }
        .good { background:color-mix(in srgb, var(--mlf-color-success, #16702a) 15%, transparent); color:var(--mlf-color-success, #16702a); }
        .bad { background:var(--mlf-color-danger-soft, rgba(239,64,73,.16)); color:var(--mlf-color-danger, #b21f28); }
        .chart-wrap { display:grid; gap:.6rem; }
        .legend { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; color:var(--mlf-color-text-muted, #4f4b75); }
        .swatch { width:30px; height:14px; background:var(--mlf-color-accent, #8f8cd2); }
        svg { width:100%; }
        .grid-line { stroke:var(--mlf-color-border, #d9dce7); stroke-width:1; }
        .axis { stroke:var(--mlf-color-text-muted, #4e4a75); stroke-width:1.2; }
        .label { fill:var(--mlf-color-text-muted, #4e4a75); font-size:12px; }
        .center { text-anchor:middle; }
        .line { stroke:var(--mlf-color-accent, #8f8cd2); stroke-width:3; fill:none; }
        .point { fill:var(--mlf-color-accent, #8f8cd2); }
        details { color:var(--mlf-color-text-muted, #4e4a75); }
        summary { cursor:pointer; }
        table { width:100%; margin-top:.5rem; border-collapse:collapse; text-align:left; }
        th,td { padding:.4rem; border-bottom:1px solid var(--mlf-color-border, #d9dce7); }
        .error,.empty { padding:.9rem 1rem; border-radius:1rem; }
        .error { color:var(--mlf-color-danger, #dc2626); border:1px solid color-mix(in srgb, var(--mlf-color-danger, #dc2626) 25%, transparent); }
        .empty { border:1px dashed var(--mlf-color-border, #d9dce7); color:var(--mlf-color-text-muted, #5f5a87); }
        @media (max-width:860px) { .grid { grid-template-columns:1fr; } }
      </style>
      ${
        error
          ? `<div class="error">${escapeHtml(error)}</div>`
          : !payload || typeof payload !== "object"
            ? `<div class="empty">Prediction pending.</div>`
            : `
              <section part="formulation-prediction-report" id="${escapeHtml(this._context?.regionId ?? "")}">
                ${Array.isArray(payload.errors) && payload.errors.length ? `<div class="error" role="status">${payload.errors.map((message) => `<p>${escapeHtml(message)}</p>`).join("")}</div>` : ""}
                <div class="grid">
                  <div class="table">
                    <div class="row">
                      <span>Mechanical characteristics</span>
                      <strong class="${summary?.mechanicalCharacteristics === "Good" ? "good" : ""}">${escapeHtml(summary?.mechanicalCharacteristics ?? "Unavailable")}</strong>
                    </div>
                    <div class="row">
                      <span>Extrusion temperature</span>
                      <strong>${typeof summary?.extrusionTemperature === "number" ? `${escapeHtml(summary.extrusionTemperature)} °C` : "Unavailable"}</strong>
                    </div>
                    <div class="row">
                      <span>Printability</span>
                      <strong class="${summary?.printability === "No" ? "bad" : summary?.printability === "Yes" ? "good" : ""}">${escapeHtml(summary?.printability ?? "Unavailable")}</strong>
                    </div>
                    <div class="row">
                      <span>Printing temperature</span>
                      <strong>${typeof summary?.printingTemperature === "number" ? `${escapeHtml(summary.printingTemperature)} °C` : "Unavailable"}</strong>
                    </div>
                  </div>
                  ${this.#renderChart(curve)}
                </div>
              </section>
            `
      }
    `;
  }
}

if (!customElements.get(FORMULATION_PREDICTION_REPORT_TAG)) {
  customElements.define(FORMULATION_PREDICTION_REPORT_TAG, FormulationPredictionReportElement);
}
