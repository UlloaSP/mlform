// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Density } from "../types";

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
  comfortable: {},
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
