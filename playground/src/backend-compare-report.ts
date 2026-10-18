import styles from "./backend-compare-report-styles.ts";
interface BackendComparisonItem {
  id: string;
  label: string;
  prediction: string | null;
  confidence: number | null;
  latencyValue: number;
  latencyInterval: unknown[] | null;
  launchScore: number;
  executionTime: number | null;
}
import type {
  PrimitiveReportController,
  ReportDescriptor,
  PrimitiveReportRenderContext,
  PrimitiveText,
} from "mlform/primitives";
export const BACKEND_COMPARE_REPORT_TAG = "mlf-backend-compare-report";

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

const formatNumber = (value: unknown, digits = 1) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return value.toFixed(digits);
};

const formatPercent = (value: unknown) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(1)}%`;
};

const formatInterval = (interval: unknown) => {
  if (!Array.isArray(interval) || interval.length !== 2) {
    return "n/a";
  }

  return `${formatNumber(Number(interval[0]))} to ${formatNumber(Number(interval[1]))}`;
};

class BackendCompareReportElement extends HTMLElement {
  private _controller: PrimitiveReportController | undefined;
  private _descriptor: ReportDescriptor | null = null;
  private _context: PrimitiveReportRenderContext | undefined;
  private _text: PrimitiveText | undefined;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._controller = undefined;
    this._descriptor = null;
    this._context = undefined;
    this._text = undefined;
  }

  set controller(value: PrimitiveReportController | undefined) {
    this._controller = value;
  }

  get controller() {
    return this._controller;
  }

  set descriptor(value: ReportDescriptor | null) {
    this._descriptor = value;
    this.#render();
  }

  get descriptor() {
    return this._descriptor;
  }

  set context(value: PrimitiveReportRenderContext | undefined) {
    this._context = value;
    this.#render();
  }

  get context() {
    return this._context;
  }

  set text(value: PrimitiveText | undefined) {
    this._text = value;
    this.#render();
  }

  get text() {
    return this._text;
  }

  connectedCallback() {
    this.#render();
  }

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const props = this._descriptor?.props ?? {};
    const payload = props.payload as { items: BackendComparisonItem[] } | undefined;
    const error = typeof props.error === "string" ? props.error : null;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const best = items.reduce<BackendComparisonItem | null>(
      (current, item) =>
        !current || Number(item.launchScore ?? -Infinity) > Number(current.launchScore ?? -Infinity)
          ? item
          : current,
      null,
    );

    const cards = items
      .map(
        (item) => `
					<article class="card${best?.id === item.id ? " best" : ""}">
						<header class="card-header">
							<div>
								<h3>${escapeHtml(item.label ?? item.id)}</h3>
								<p>${escapeHtml(item.id)}</p>
							</div>
							${best?.id === item.id ? '<span class="badge">best score</span>' : ""}
						</header>
						<dl class="metrics">
							<div>
								<dt>Recommendation</dt>
								<dd>${escapeHtml(item.prediction ?? "n/a")}</dd>
							</div>
							<div>
								<dt>Confidence</dt>
								<dd>${escapeHtml(formatPercent(item.confidence))}</dd>
							</div>
							<div>
								<dt>Latency</dt>
								<dd>${escapeHtml(formatNumber(item.latencyValue))} ms</dd>
							</div>
							<div>
								<dt>Latency range</dt>
								<dd>${escapeHtml(formatInterval(item.latencyInterval))}</dd>
							</div>
							<div>
								<dt>Launch score</dt>
								<dd>${escapeHtml(formatNumber(item.launchScore, 0))} pts</dd>
							</div>
							<div>
								<dt>Execution time</dt>
								<dd>${escapeHtml(formatNumber(item.executionTime, 0))} ms</dd>
							</div>
						</dl>
					</article>
				`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
			<section
				class="wrap"
				part="backend-compare-report"
				id="${escapeHtml(this._context?.regionId ?? "")}"
				aria-label="${escapeHtml(this._context?.label ?? "Backend comparison report")}"
			>
				${
          error
            ? `<div class="error">${escapeHtml(error)}</div>`
            : items.length === 0
              ? '<div class="empty">No backend comparison is available yet.</div>'
              : `
								<div class="summary">
									<strong>${escapeHtml(best?.label ?? "No leader yet")}</strong>
									<span> leads on launch score across the configured backends.</span>
								</div>
								<div class="grid">${cards}</div>
							`
        }
			</section>
		`;
  }
}

if (!customElements.get(BACKEND_COMPARE_REPORT_TAG)) {
  customElements.define(BACKEND_COMPARE_REPORT_TAG, BackendCompareReportElement);
}
