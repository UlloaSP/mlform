import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * <regressor-prediction>
 * – Barra ±3 × (max-min) con gradiente lineal continuo.
 * – Límites representados con marcadores más finos que sobresalen verticalmente
 *   respecto a la barra.
 * – Etiquetas de los límites alineadas directamente bajo su marcador.
 */
@customElement("regressor-prediction")
export class RegressorPrediction extends LitElement {
  /* —— Estilos —— */
  static styles = css`
    :host {
      --marker-width: 4px; /* valor actual */
      --limit-line-width: 3px; /* nuevo: marcador de límite */
      --limit-line-height: 28px; /* sobresale 6px por arriba y por abajo (barra = 16px) */
      
      display: block;
      margin: 10px;
    }

    .prediction-card {
      padding: 25px;
      border: 1px solid var(--ml-color-border);
      border-radius: var(--radius);
      box-shadow: 0 4px 12px var(--ml-color-shadow);
      background: var(--ml-color-surface);
    }

    .title {
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ml-color-secondary);
    }

    .value {
      display: flex;
      justify-content: flex-end;
      font-size: 1rem;
      font-weight: 700;
      color: var(--ml-color-primary);
      margin-bottom: 5px;
    }

    .item {
      margin-top: 15px;
    }

    .bar-wrapper {
      position: relative;
      height: 16px;
      border-radius: 5px;
    }

    /* —— Marcador de la medida —— */
    .value-marker {
      position: absolute;
      height: 14px;
      width: 14px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--ml-color-accent), var(--ml-color-accent-h));
    }

    /* —— Wrapper del límite: línea + etiqueta —— */
    .limit-wrapper {
      position: absolute;
      top: calc(
        -1 * (var(--limit-line-height) - 16px) / 2
      ); /* centra la línea respecto a la barra y hace que sobresalga */
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      z-index: 2;
    }

    .limit-line {
      width: var(--limit-line-width);
      height: var(--limit-line-height);
      background: var(--ml-color-primary);
      opacity: 0.6;
    }

    .limit-label {
      font-size: 0.75rem;
      color: var(--ml-color-secondary);
      margin-top: 4px;
      white-space: nowrap;
    }
  `;

  /* —— Propiedades —— */
  @property({ type: String }) title = "";

  @property({
    type: Array,
    attribute: "values",
    converter: {
      fromAttribute: (attr: string | null): number[] => {
        if (!attr) return [];
        try {
          const parsed = JSON.parse(attr);
          return Array.isArray(parsed) ? parsed.map(Number) : [parsed];
        } catch {
          return attr.split(/[,;]/).map((n) => Number(n.trim()));
        }
      },
    },
  })
  values: number[] = [];

  @property({ type: String }) unit = "";

  @property({
    type: Object,
    attribute: "interval",
    converter: {
      fromAttribute: (attr: string | null): [number, number] => {
        if (!attr) {
          return undefined as unknown as [number, number];
        } else {
          try {
            const parsed = JSON.parse(attr);
            if (
              Array.isArray(parsed) &&
              parsed.length === 2 &&
              parsed.every((n) => typeof n === "number")
            )
              return parsed as [number, number];
          } catch {
            /* ignore */
          }
          const nums = attr.split(/[,;]/).map((n) => Number(n.trim()));
          return [nums[0], nums[1]];
        }
      },
    },
  })
  declare interval: [number, number];
  private declare min: number;
  private declare max: number;

  protected firstUpdated(): void {
    if (this.interval !== undefined) {
      this.min = this.interval[0];
      this.max = this.interval[1];
    } else {
      this.values = this.values.map((v) => Number(v));
      const mean =
        this.values.reduce((sum, v) => sum + v, 0) / this.values.length;
      const maxDist = this.values.reduce((sum, v) => sum + v, 0);
      this.min = mean - maxDist;
      this.max = mean + maxDist;
    }
    this.requestUpdate();
  }

  /* —— Utilidades —— */
  private _barExtents(): [number, number] {
    const delta = this.max - this.min;
    return [this.min - delta, this.max + delta];
  }

  /* —— Utilidades —— */
  private _hasInterval(): boolean {
    return (
      this.interval !== undefined &&
      this.min !== undefined &&
      this.max !== undefined
    );
  }

  private _calcPercent(value: number): number {
    const [barMin, barMax] = this._barExtents();
    return ((value - barMin) / (barMax - barMin)) * 100;
  }

  /** Gradiente lineal continuo: rojo → naranja → amarillo → verde → amarillo → naranja → rojo */
  private _buildGradient(): string {
    const pctMin = this._calcPercent(this.min);
    const pctMax = this._calcPercent(this.max);
    const pctMid = this._calcPercent((this.min + this.max) / 2);

    const transBand = 10; // % del ancho visual

    const beforeMin = Math.max(pctMin - transBand, 0);
    const afterMax = Math.min(pctMax + transBand, 100);

    return `linear-gradient(to right,
      #c62828 0%,
      #ff6d00 ${beforeMin}%,
      #ffea00 ${pctMin}%,
      #00c853 ${pctMid}%,
      #ffea00 ${pctMax}%,
      #ff6d00 ${afterMax}%,
      #c62828 100%)`;
  }

  /* —— Render —— */
  render() {
    if (!this._hasInterval()) {
      return html`<div class="prediction-card">
        ${this.title ? html`<div class="title">${this.title}</div>` : null}
        ${this.values.map(
          (val) => html`
            <div class="item">
              <div class="value">${val} ${this.unit}</div>
            </div>
            </div>
          `
        )}
      </div>`;
    }

    return html`
      <div class="prediction-card">
        ${this.title ? html`<div class="title">${this.title}</div>` : null}
        ${this.values.map(
          (val) => html`
            <div class="item">
              <div class="value">${val} ${this.unit}</div>

              <div
                class="bar-wrapper"
                style="background: ${this._buildGradient()};"
              >
                <!-- Límite inferior -->
                <div
                  class="limit-wrapper"
                  style="left: ${this._calcPercent(this.min)}%; top: -12px;"
                >
                  <div class="limit-line"></div>
                  <div class="limit-label">${this.min} ${this.unit}</div>
                </div>

                <!-- Límite superior -->
                <div
                  class="limit-wrapper"
                  style="left: ${this._calcPercent(this.max)}%; top: -12px;"
                >
                  <div class="limit-line"></div>
                  <div class="limit-label">${this.max} ${this.unit}</div>
                </div>

                <!-- Valor actual -->
                <span
                  class="value-marker"
                  style="left: ${Math.min(
                    Math.max(this._calcPercent(val), 0),
                    98.45
                  )}%;
                  top: 10%;"
                ></span>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "regressor-prediction": RegressorPrediction;
  }
}
