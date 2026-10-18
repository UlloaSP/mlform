import { describe, expect, it } from "vite-plus/test";
import { builtinThemes, resolveDesignSystem } from "mlform/design";

const luminance = (hex: string) => {
  const [r, g, b] = hex.match(/[\da-f]{2}/gi)!.map((channel) => {
    const v = parseInt(channel, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
};

describe("builtin feedback contrast", () => {
  for (const theme of builtinThemes)
    for (const mode of ["light", "dark"] as const) {
      it(`${theme.id}/${mode} keeps feedback readable on field surfaces`, () => {
        const { tokens } = resolveDesignSystem({ theme: theme.id, mode });
        for (const tone of ["success", "danger", "text-muted"]) {
          for (const surface of ["surface", "surface-muted", "surface-elevated"]) {
            const a = luminance(tokens[`--mlf-color-${tone}`]);
            const b = luminance(tokens[`--mlf-color-${surface}`]);
            expect(
              (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              `${tone}/${surface}`,
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    }
  it("registers eshkra with the brand typography and both schemes", () => {
    const resolved = resolveDesignSystem({ theme: "eshkra", mode: "dark", strict: true });
    expect(resolved.themeId).toBe("eshkra");
    expect(resolved.tokens["--mlf-font-family-body"]).toContain("Mona Sans");
    expect(resolved.tokens["--mlf-font-family-mono"]).toContain("JetBrains Mono");
    expect(resolved.tokens["--mlf-color-bg"]).toBe("#0a0a0d");
  });

  it.each([
    ["m3diseen", "#9092c7", "#5c5f9e"],
    ["dosetailor", "#a9a4e3", "#655dc6"],
  ])(
    "registers %s with its lavender canvas and accessible Quicksand controls",
    (theme, background, accent) => {
      const resolved = resolveDesignSystem({ theme, mode: "light", strict: true });
      expect(resolved.themeId).toBe(theme);
      expect(resolved.tokens["--mlf-color-bg"]).toBe(background);
      expect(resolved.tokens["--mlf-color-accent"]).toBe(accent);
      expect(resolved.tokens["--mlf-font-family-body"]).toContain("Quicksand");
      for (const mode of ["light", "dark"] as const) {
        const { tokens } = resolveDesignSystem({ theme, mode });
        const a = luminance(tokens["--mlf-color-accent"]);
        const b = luminance(tokens["--mlf-color-surface-muted"]);
        expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
