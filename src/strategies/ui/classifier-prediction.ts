import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * <classifier-prediction>
 * --------------------------------------------------
 * Visualiza las predicciones de un clasificador.
 * - `mapping`          → lista de etiquetas CSV
 * - `probabilities`    → array plano o matriz de probabilidades
 * - `details`          → modo detallado (true) o compacto (false)
 * - `title`            → título del bloque
 *
 * Ejemplo de uso:
 * <classifier-prediction
 *   title="Vehicle type"
 *   mapping="Car,Motorcycle,Train"
 *   probabilities="0.12,0.68,0.20"
 *   details="true">
 * </classifier-prediction>
 * --------------------------------------------------
 */

type FlatProbs = number[];
type MatrixProbs = number[][];

@customElement("classifier-prediction")
export class ClassifierPrediction extends LitElement {
  /* --------------------------  STYLES  -------------------------- */
  static styles = css`
    :host {
      --bar-color: var(--ml-color-accent);
      display: block;
      margin: 10px;
      font-family: "Inter", system-ui, sans-serif;
    }

    .card {
      padding: 1.5rem 2rem;
      border-radius: var(--radius);
      background: var(--ml-color-surface);
      box-shadow:
        0 2px 4px var(--ml-color-shadow),
        0 8px 16px var(--ml-color-shadow);
      border: 1px solid var(--ml-color-border);
    }

    .prea {
      padding: 1rem;
      border-radius: var(--radius);
      box-shadow:
        0 2px 4px var(--ml-color-shadow),
        0 8px 16px var(--ml-color-shadow);
      border: 1px solid var(--ml-color-border);
      margin: 10px;
      background: var(--ml-color-surface);
      color: var(--ml-color-primary);
    }

    .title {
      font-size: 0.875rem; /* text-sm */
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ml-color-secondary);
      letter-spacing: 0.06em;
      margin-bottom: 1rem;
    }

    .item {
      display: grid;
      grid-template-columns: 120px 1fr 56px;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--ml-color-primary);
      text-transform: capitalize;
      text-align: right;
    }

    .bar {
      position: relative;
      width: 100%;
      height: 10px;
      background: var(--ml-color-border);
      border-radius: 5px;
      overflow: hidden;
    }

    .bar::after {
      content: "";
      position: absolute;
      inset: 0;
      width: var(--w);
      background: linear-gradient(
        90deg,
        var(--bar-color) 0%,
        var(--ml-color-accent-h) 100%
      );
      border-radius: 5px;
      transition: width 0.3s ease;
    }

    .pct {
      font-variant-numeric: tabular-nums;
      font-size: 0.9rem;
      color: var(--ml-color-primary);
      text-align: right;
    }
  `;

  @property({ type: String }) declare title: string;

  @property({
    attribute: "mapping",
    converter: {
      fromAttribute(value: string | null): string[] {
        if (!value) return [];
        try {
          return JSON.parse(value) as string[];
        } catch {
          return value.split(",").map((v) => v.trim());
        }
      },
    },
  })
  declare mapping: string[];

  @property({
    attribute: "probabilities",
    converter: {
      fromAttribute(value: string | null): FlatProbs | MatrixProbs {
        if (!value) return [];
        try {
          return JSON.parse(value) as MatrixProbs;
        } catch {
          return value.split(",").map((n) => parseFloat(n));
        }
      },
    },
  })
  declare probabilities: FlatProbs | MatrixProbs;

  @property({
    type: Boolean,
    converter: {
      fromAttribute(value: string): boolean {
        return value.toLowerCase() !== "false";
      },
    },
  })
  declare details: boolean;

  private _resolveMapping(length: number): string[] {
    return this.mapping?.length
      ? this.mapping
      : Array.from({ length }, (_, i) => `${i}`);
  }

  private _flatToMatrix(flat: number[]): number[][] {
    const rowSize = this.mapping?.length || Math.sqrt(flat.length);
    const mtx: number[][] = [];
    for (let i = 0; i < flat.length; i += rowSize) {
      mtx.push(flat.slice(i, i + rowSize));
    }
    return mtx;
  }

  private get _probMatrix(): number[][] {
    if (!Array.isArray(this.probabilities) || !this.probabilities.length)
      return [];
    return Array.isArray(this.probabilities[0])
      ? (this.probabilities as MatrixProbs)
      : this._flatToMatrix(this.probabilities as FlatProbs);
  }

  private get _predictions() {
    const mtx = this._probMatrix;
    if (!mtx.length) return [];
    const labels = this._resolveMapping(mtx[0].length);

    return mtx.map((row) => {
      const items = labels.map((label, idx) => ({
        label,
        prob: row[idx] || 0,
      }));
      const main = items.reduce((best, cur) =>
        cur.prob > best.prob ? cur : best
      );
      return { items, main };
    });
  }

  render() {
    return html`
      <div class="card">
        <div class="title">${this.title}</div>
        ${this._predictions.map(
          (pred) => html`
            ${
              this.details
                ? pred.items.map(
                    (it) => html`
                    <div class="item">
                      <div class="label">${it.label}</div>
                      <div
                        class="bar"
                        style="--w: ${(it.prob * 100).toFixed(2)}%"
                      ></div>
                      <div class="pct">${it.prob.toFixed(2)}</div>
                    </div>
                  `
                  )
                : html` <div class="prea">${pred.main.label}</div>`
            }
            ${this.details ? html`<br />` : ""}
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "classifier-prediction": ClassifierPrediction;
  }
}
