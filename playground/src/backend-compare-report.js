export const BACKEND_COMPARE_REPORT_TAG = "mlf-backend-compare-report";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatNumber = (value, digits = 1) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return value.toFixed(digits);
};

const formatPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(1)}%`;
};

const formatInterval = (interval) => {
  if (!Array.isArray(interval) || interval.length !== 2) {
    return "n/a";
  }

  return `${formatNumber(Number(interval[0]))} to ${formatNumber(Number(interval[1]))}`;
};

class BackendCompareReportElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._controller = undefined;
    this._descriptor = null;
    this._context = undefined;
    this._text = undefined;
  }

  set controller(value) {
    this._controller = value;
  }

  get controller() {
    return this._controller;
  }

  set descriptor(value) {
    this._descriptor = value;
    this.#render();
  }

  get descriptor() {
    return this._descriptor;
  }

  set context(value) {
    this._context = value;
    this.#render();
  }

  get context() {
    return this._context;
  }

  set text(value) {
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
    const payload = props.payload;
    const error = typeof props.error === "string" ? props.error : null;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const best = items.reduce(
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
			<style>
				:host {
					display: block;
				}

				.wrap {
					display: grid;
					gap: 1rem;
				}

				.summary {
					padding: 0.9rem 1rem;
					border: 1px solid color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 88%, transparent);
					border-radius: 1rem;
					background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 7%, transparent);
					color: var(--mlf-color-text, #0f172a);
				}

				.summary strong {
					font-size: 0.95rem;
				}

				.error,
				.empty {
					padding: 0.9rem 1rem;
					border-radius: 1rem;
					line-height: 1.5;
				}

				.error {
					color: var(--mlf-color-danger, #dc2626);
					border: 1px solid color-mix(in srgb, var(--mlf-color-danger, #dc2626) 25%, transparent);
				}

				.empty {
					border: 1px dashed var(--mlf-color-border, #cbd5e1);
					color: var(--mlf-color-text-muted, #475569);
				}

				.grid {
					display: grid;
					gap: 0.9rem;
					grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
				}

				.card {
					display: grid;
					gap: 0.9rem;
					padding: 1rem;
					border-radius: 1rem;
					border: 1px solid color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent);
					background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 92%, transparent);
				}

				.card.best {
					border-color: color-mix(in srgb, var(--mlf-color-success, #059669) 35%, transparent);
					box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mlf-color-success, #059669) 18%, transparent);
				}

				.card-header {
					display: flex;
					align-items: start;
					justify-content: space-between;
					gap: 0.75rem;
				}

				.card-header h3,
				.card-header p {
					margin: 0;
				}

				.card-header h3 {
					font-size: 1rem;
				}

				.card-header p {
					margin-top: 0.2rem;
					color: var(--mlf-color-text-muted, #475569);
					font-size: 0.8rem;
					text-transform: uppercase;
					letter-spacing: 0.08em;
				}

				.badge {
					padding: 0.3rem 0.55rem;
					border-radius: 999px;
					background: color-mix(in srgb, var(--mlf-color-success, #059669) 16%, transparent);
					color: var(--mlf-color-success, #059669);
					font-size: 0.72rem;
					font-weight: 700;
					letter-spacing: 0.06em;
					text-transform: uppercase;
					white-space: nowrap;
				}

				.metrics {
					display: grid;
					gap: 0.75rem;
					margin: 0;
				}

				.metrics div {
					display: grid;
					gap: 0.15rem;
				}

				dt {
					color: var(--mlf-color-text-muted, #475569);
					font-size: 0.75rem;
					font-weight: 700;
					letter-spacing: 0.06em;
					text-transform: uppercase;
				}

				dd {
					margin: 0;
					color: var(--mlf-color-text, #0f172a);
					font-size: 0.95rem;
					font-weight: 600;
				}
			</style>
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
