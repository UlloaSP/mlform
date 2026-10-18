import { defineReportKind } from "mlform/view";
import { baseReportConfigSchema } from "mlform/schema";
import { z } from "zod";

export const forecastChart = defineReportKind({
  kind: "forecast-chart",
  schema: baseReportConfigSchema.extend({
    kind: z.literal("forecast-chart"),
    unit: z.string(),
  }),
  // Payloads are parsed before mount, so the markup only interpolates numbers.
  payloadSchema: z.array(z.number()).min(2),
  render: {
    mount: ({ element, payload, report }) => {
      const values = payload as number[];
      const [low, high] = [Math.min(...values) - 1, Math.max(...values) + 1];
      const points = values.map((value, hour) => [
        30 + (hour * 440) / (values.length - 1),
        30 + ((high - value) / (high - low)) * 110,
      ]);
      const marks = points.map(
        ([x, y], hour) => `
        <circle cx="${x}" cy="${y}" r="5" fill="var(--mlf-color-accent)" />
        <text x="${x}" y="${y - 14}">${values[hour].toFixed(1)}°</text>
        <text class="hour" x="${x}" y="174">+${hour + 1}h</text>`,
      );
      element.innerHTML = `
        <svg viewBox="0 0 500 180" role="img"
          fill="currentColor" text-anchor="middle">
          <style>.hour { fill: var(--mlf-color-text-muted) }</style>
          <polyline points="${points.join(" ")}" fill="none"
            stroke="var(--mlf-color-accent)" stroke-width="3" />
          ${marks.join("")}
        </svg>`;
      element.firstElementChild?.setAttribute(
        "aria-label",
        `${report.label}: ${values.join(", ")} ${report.unit}`,
      );
    },
  },
});
