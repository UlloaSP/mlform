// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ComponentKey } from "./component-keys";

export type ComponentTokenManifest = {
  tokens: Record<string, string>;
};

export const componentTokenDefaults: Record<ComponentKey, ComponentTokenManifest> = {
  shell: {
    tokens: {
      "--mlf-shell-color": "var(--mlf-color-text)",
      "--mlf-shell-bg": "transparent",
      "--mlf-shell-overlay":
        "linear-gradient(180deg, color-mix(in srgb, var(--mlf-color-surface) 0%, transparent), var(--mlf-color-overlay) 50%)",
      "--mlf-shell-panel-bg": "var(--mlf-color-surface)",
      "--mlf-shell-panel-border": "var(--mlf-color-border)",
      "--mlf-shell-panel-shadow-soft": "var(--mlf-shadow-sm)",
      "--mlf-shell-panel-shadow": "var(--mlf-shadow-md)",
      "--mlf-shell-header-bg": "var(--mlf-color-surface)",
      "--mlf-shell-header-blur": "0px",
      "--mlf-shell-action-bg": "var(--mlf-color-surface-muted)",
      "--mlf-shell-left-min-width": "22rem",
      "--mlf-shell-left-max-width": "48rem",
      "--mlf-shell-right-min-width": "24rem",
    },
  },
  hero: {
    tokens: {
      "--mlf-hero-bg":
        "radial-gradient(circle at top left, var(--mlf-color-accent-soft), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--mlf-color-surface) 95%, transparent), color-mix(in srgb, var(--mlf-color-surface) 95%, var(--mlf-color-surface-muted)))",
      "--mlf-hero-border":
        "color-mix(in srgb, var(--mlf-color-border) 90%, var(--mlf-color-surface))",
      "--mlf-hero-shadow": "var(--mlf-shadow-lg)",
      "--mlf-hero-radius": "var(--mlf-radius-xl)",
      "--mlf-hero-eyebrow-color": "var(--mlf-color-text-muted)",
      "--mlf-hero-status-bg": "var(--mlf-color-accent-soft)",
    },
  },
  field: {
    tokens: {
      "--mlf-field-bg": "var(--mlf-color-surface)",
      "--mlf-field-border": "var(--mlf-color-border)",
      "--mlf-field-border-invalid": "var(--mlf-color-danger)",
      "--mlf-field-shadow": "none",
      "--mlf-field-radius": "var(--mlf-radius-lg)",
      "--mlf-field-label-color": "var(--mlf-color-text)",
      "--mlf-field-description-color": "var(--mlf-color-text-muted)",
      "--mlf-field-meta-bg": "var(--mlf-color-accent-soft)",
      "--mlf-field-meta-color": "var(--mlf-color-text-muted)",
      "--mlf-field-error-bg": "var(--mlf-color-danger-soft)",
      "--mlf-field-error-color": "var(--mlf-color-danger)",
    },
  },
  report: {
    tokens: {
      "--mlf-report-bg": "var(--mlf-color-surface)",
      "--mlf-report-border": "var(--mlf-color-border)",
      "--mlf-report-shadow": "none",
      "--mlf-report-radius": "var(--mlf-radius-lg)",
      "--mlf-report-label-color": "var(--mlf-color-text)",
      "--mlf-report-description-color": "var(--mlf-color-text-muted)",
      "--mlf-report-meta-bg": "var(--mlf-color-accent-soft)",
      "--mlf-report-meta-color": "var(--mlf-color-text-muted)",
      "--mlf-report-empty-bg": "color-mix(in srgb, var(--mlf-color-accent) 6%, transparent)",
      "--mlf-report-empty-color": "var(--mlf-color-text-muted)",
      "--mlf-report-hero-bg":
        "linear-gradient(135deg, color-mix(in srgb, var(--mlf-color-accent) 12%, transparent), color-mix(in srgb, var(--mlf-color-accent) 6%, transparent))",
      "--mlf-report-error-bg": "var(--mlf-color-danger-soft)",
      "--mlf-report-error-color": "var(--mlf-color-danger)",
    },
  },
  input: {
    tokens: {
      "--mlf-input-bg": "var(--mlf-color-surface-elevated)",
      "--mlf-input-bg-disabled": "var(--mlf-color-surface-muted)",
      "--mlf-input-border": "var(--mlf-color-border)",
      "--mlf-input-border-focus": "var(--mlf-color-accent)",
      "--mlf-input-text": "var(--mlf-color-text)",
      "--mlf-input-placeholder": "var(--mlf-color-text-muted)",
      "--mlf-input-radius": "var(--mlf-radius-md)",
      "--mlf-input-shadow-focus": "0 0 0 var(--mlf-ring-width) var(--mlf-color-focus-ring)",
    },
  },
  submit: {
    tokens: {
      "--mlf-submit-bg": "var(--mlf-color-accent)",
      "--mlf-submit-bg-hover": "var(--mlf-color-accent-hover)",
      "--mlf-submit-color": "var(--mlf-color-text-inverse)",
      "--mlf-submit-shadow": "none",
      "--mlf-submit-shadow-hover": "none",
      "--mlf-submit-radius": "var(--mlf-radius-md)",
      "--mlf-submit-focus-ring":
        "0 0 0 var(--mlf-ring-width) color-mix(in srgb, var(--mlf-color-accent) 18%, transparent)",
    },
  },
  error: {
    tokens: {
      "--mlf-error-bg":
        "radial-gradient(circle at top left, color-mix(in srgb, var(--mlf-color-danger) 14%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--mlf-color-surface) 94%, transparent), color-mix(in srgb, var(--mlf-color-surface) 88%, transparent))",
      "--mlf-error-border": "color-mix(in srgb, var(--mlf-color-danger) 20%, transparent)",
      "--mlf-error-color": "var(--mlf-color-danger)",
    },
  },
  toggle: {
    tokens: {
      "--mlf-toggle-bg": "var(--mlf-input-bg)",
      "--mlf-toggle-border": "var(--mlf-input-border)",
      "--mlf-toggle-text": "var(--mlf-color-text)",
      "--mlf-toggle-accent": "var(--mlf-color-accent)",
    },
  },
  status: {
    tokens: {
      "--mlf-status-bg": "var(--mlf-color-accent-soft)",
      "--mlf-status-color": "var(--mlf-color-text-muted)",
    },
  },
  chart: {
    tokens: {
      "--mlf-chart-track-bg": "var(--mlf-color-chart-track)",
      "--mlf-chart-fill-bg": "var(--mlf-color-accent)",
    },
  },
};
