// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Motion } from "../types";

export const motionTokenScales: Record<Motion, Record<string, string>> = {
  none: {
    "--mlf-motion-fast": "0ms linear",
    "--mlf-motion-base": "0ms linear",
    "--mlf-motion-slow": "0ms linear",
    "--mlf-transition-duration": "0ms",
    "--mlf-transition-easing": "linear",
  },
  subtle: {
    "--mlf-motion-fast": "120ms ease",
    "--mlf-motion-base": "180ms ease",
    "--mlf-motion-slow": "240ms ease",
    "--mlf-transition-duration": "180ms",
    "--mlf-transition-easing": "ease-in-out",
  },
  standard: {
    "--mlf-motion-fast": "160ms ease",
    "--mlf-motion-base": "220ms ease",
    "--mlf-motion-slow": "300ms ease",
    "--mlf-transition-duration": "250ms",
    "--mlf-transition-easing": "ease-in-out",
  },
};
