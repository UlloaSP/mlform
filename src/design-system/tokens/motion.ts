// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Motion } from "../types";

export const motionTokenScales: Record<Motion, Record<string, string>> = {
  none: {
    "--mlf-motion-fast": "0ms",
    "--mlf-motion-base": "0ms",
    "--mlf-motion-slow": "0ms",
  },
  subtle: {
    "--mlf-motion-fast": "120ms ease",
    "--mlf-motion-base": "180ms ease",
    "--mlf-motion-slow": "240ms ease",
  },
  standard: {
    "--mlf-motion-fast": "160ms ease",
    "--mlf-motion-base": "220ms ease",
    "--mlf-motion-slow": "300ms ease",
  },
};
