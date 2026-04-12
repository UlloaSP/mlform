// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Density } from "../types";

/**
 * Density token overrides for each density level. All three levels are
 * explicit so readers can compare values without cross-referencing
 * `globalTokenDefaults`. The `comfortable` values intentionally mirror
 * the baseline in `globalTokenDefaults` — they are authoritative here,
 * and `globalTokenDefaults` inherits the same values.
 */
export const densityTokenScales: Record<Density, Record<string, string>> = {
  compact: {
    "--mlf-shell-gap": "1rem",
    "--mlf-layout-gap": "0.85rem",
    "--mlf-section-gap": "0.85rem",
    "--mlf-pane-gap": "0.85rem",
    "--mlf-control-height": "2.625rem",
    "--mlf-control-padding-inline": "0.8rem",
    "--mlf-control-padding-block": "0.65rem",
    "--mlf-pane-min-width": "18rem",
  },
  comfortable: {
    "--mlf-shell-gap": "1.2rem",
    "--mlf-layout-gap": "1rem",
    "--mlf-section-gap": "1rem",
    "--mlf-pane-gap": "1rem",
    "--mlf-control-height": "3rem",
    "--mlf-control-padding-inline": "0.92rem",
    "--mlf-control-padding-block": "0.78rem",
    "--mlf-pane-min-width": "20rem",
  },
  spacious: {
    "--mlf-shell-gap": "1.4rem",
    "--mlf-layout-gap": "1.2rem",
    "--mlf-section-gap": "1.2rem",
    "--mlf-pane-gap": "1.2rem",
    "--mlf-control-height": "3.125rem",
    "--mlf-control-padding-inline": "1rem",
    "--mlf-control-padding-block": "0.9rem",
    "--mlf-pane-min-width": "22rem",
  },
};
