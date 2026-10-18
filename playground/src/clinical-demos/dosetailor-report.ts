import type { BaseReportConfig } from "mlform/schema";
import type { ReportDescriptor } from "mlform/primitives";
import type { DoseTailorPrediction } from "./dosetailor-transport.ts";
import { defineMLFormPlugin } from "mlform/view";
import { defineReportDefinition, resolveMappedReportPayload } from "mlform/schema";
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";
import { z } from "zod";

const definition = defineReportDefinition({
  kind: "dosetailor-prediction",
  schema: z.object({
    kind: z.literal("dosetailor-prediction"),
    id: z.string(),
    label: z.string(),
    mappedTo: z.string(),
  }),
  resolvePayload(_config, context) {
    return resolveMappedReportPayload(context.report, context.result);
  },
});

export const DOSETAILOR_PLUGIN = defineMLFormPlugin({
  reports: [
    {
      category: "report",
      kind: definition.kind,
      register(registry, descriptors) {
        registry.registerReport(definition);
        descriptors.registerReport({
          kind: definition.kind,
          describe(config: BaseReportConfig, context) {
            return {
              component: "dosetailor-prediction",
              props: { label: config.label, payload: context.payload },
            };
          },
        });
      },
    },
  ],
});

const format = (value: unknown) =>
  Number(value).toLocaleString("en-GB", { maximumFractionDigits: 3 });

class DoseTailorReport extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  set descriptor(value: ReportDescriptor | null) {
    const payload = value?.props?.payload as DoseTailorPrediction | undefined;
    if (!payload) {
      this.shadowRoot!.replaceChildren();
      return;
    }
    const points = payload.points ?? [];
    const allPoints = [...points, { dose: payload.dose ?? 0, level: payload.level }];
    const maxX = Math.max(...allPoints.map((point) => point.dose), 1);
    const maxY = Math.max(...allPoints.map((point) => point.level), 1);
    const minX = Math.min(0, ...allPoints.map((point) => point.dose));
    const minY = Math.min(0, ...allPoints.map((point) => point.level));
    const x = (dose: number) => 64 + ((dose - minX) / (maxX - minX)) * 490;
    const y = (level: number) => 300 - ((level - minY) / (maxY - minY)) * 260;
    this.shadowRoot!.innerHTML = `
      <style>
        :host{display:block;color:var(--mlf-color-text,#212529);font-family:inherit}
        .result{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1fr);gap:2rem;align-items:center}
        table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
        td{border:1px solid var(--mlf-color-border,#dee2e6);padding:1.2rem .8rem}
        td:last-child{text-align:right;font-weight:600}tr:nth-child(odd){background:var(--mlf-color-surface-muted,#f4f4f7)}
        svg{display:block;width:100%;height:auto}.grid{stroke:var(--mlf-color-border,#dee2e6);stroke-width:1}
        text{fill:currentColor;font:12px inherit}.line{fill:none;stroke:var(--mlf-color-accent,#655dc6);stroke-width:2}
        circle{fill:var(--mlf-color-accent,#655dc6)}.optimal{fill:#c92525;stroke:white;stroke-width:2}
        summary{cursor:pointer;margin-top:1rem;color:var(--mlf-color-text-muted,#555)}
        .data{margin-top:1rem;max-height:240px;overflow:auto}.data td{padding:.4rem .8rem}
        @media(max-width:650px){.result{grid-template-columns:1fr;gap:1rem}}
      </style>
      <div class="${points.length ? "result" : ""}">
        <table aria-label="DoseTailor prediction"><tbody>
          ${payload.mode === "level" ? `<tr><td>Optimal dose</td><td>${format(payload.dose)} mg</td></tr>` : ""}
          <tr><td>${payload.mode === "level" ? "Predicted level at optimal dose" : "Predicted tacrolimus level"}</td><td>${format(payload.level)} ng/ml</td></tr>
        </tbody></table>
        ${
          points.length
            ? `
          <figure style="margin:0">
            <svg viewBox="0 0 600 350" role="img" aria-label="Dose-level curve returned by DoseTailor; optimal dose ${format(payload.dose)} mg, level ${format(payload.level)} ng/ml">
              ${[0, 1, 2, 3, 4]
                .map((i) => {
                  const tickX = minX + ((maxX - minX) * i) / 4;
                  const tickY = minY + ((maxY - minY) * i) / 4;
                  return `<line class="grid" x1="64" y1="${y(tickY)}" x2="554" y2="${y(tickY)}"/><text x="54" y="${y(tickY) + 4}" text-anchor="end">${format(tickY)}</text><text x="${x(tickX)}" y="320" text-anchor="middle">${format(tickX)}</text>`;
                })
                .join("")}
              <polyline class="line" points="${points.map((point) => `${x(point.dose)},${y(point.level)}`).join(" ")}"/>
              ${points.map((point) => `<circle cx="${x(point.dose)}" cy="${y(point.level)}" r="3"/>`).join("")}
              <circle class="optimal" cx="${x(payload.dose ?? 0)}" cy="${y(payload.level)}" r="6"/>
              <text x="300" y="346" text-anchor="middle">Dose (mg)</text>
              <text transform="translate(16 170) rotate(-90)" text-anchor="middle">Level (ng/ml)</text>
            </svg>
            <details><summary>View curve data</summary><div class="data"><table aria-label="Dose-level curve data"><thead><tr><th>Dose (mg)</th><th>Level (ng/ml)</th></tr></thead><tbody>${points.map((point) => `<tr><td>${format(point.dose)}</td><td>${format(point.level)}</td></tr>`).join("")}</tbody></table></div></details>
          </figure>`
            : ""
        }
      </div>`;
  }
}
if (!customElements.get("mlf-dosetailor-prediction"))
  customElements.define("mlf-dosetailor-prediction", DoseTailorReport);

export const createDoseTailorPrimitives = () =>
  createBuiltinPrimitiveRegistry().registerReport(
    "dosetailor-prediction",
    "mlf-dosetailor-prediction",
  );
