// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const reportFrameStyles = css`
  :host {
    display: block;
    align-self: start;
  }
  :host([hidden]),
  .description[hidden] {
    display: none;
  }

  .report {
    display: grid;
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-report-border, var(--mlf-color-border, #e2e8f0));
    border-radius: var(--mlf-report-radius, 10px);
    background: var(--mlf-report-bg, var(--mlf-color-surface, #ffffff));
    box-shadow: var(--mlf-report-shadow, none);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 1rem;
  }
  .label {
    margin: 0;
    min-width: 0;
    color: var(--mlf-report-label-color, var(--mlf-color-text, #172330));
    font-size: 0.92rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .description {
    margin: 0;
    color: var(--mlf-report-description-color, var(--mlf-color-secondary, #475569));
    font-size: 0.875rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .state-view {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.75rem;
    align-items: start;
    padding: 1rem 1.1rem;
    border-radius: var(--mlf-radius-md, 8px);
    background: var(--mlf-report-empty-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }
  .state-view.error {
    background: color-mix(in srgb, var(--mlf-color-danger, #dc2626) 7%, transparent);
  }
  .state-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: var(--mlf-radius-sm, 6px);
    background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 12%, transparent);
    color: var(--mlf-color-accent, #1e40af);
    font-size: 0.78rem;
    font-weight: 700;
  }
  .error .state-marker {
    background: color-mix(in srgb, var(--mlf-color-danger, #dc2626) 14%, transparent);
    color: var(--mlf-color-danger, #dc2626);
  }
  .state-copy {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }
  .state-title,
  .state-message {
    margin: 0;
  }
  .state-title {
    color: var(--mlf-color-text, #0f172a);
    font-size: 0.9rem;
    font-weight: 600;
  }
  .state-message {
    color: var(--mlf-color-text-muted, #475569);
    font-size: 0.82rem;
    line-height: 1.5;
  }
  .skeleton {
    grid-column: 1 / -1;
    display: grid;
    gap: 0.45rem;
    margin-top: 0.25rem;
  }
  .skeleton span {
    height: 0.48rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 14%, transparent);
    animation: report-pulse 1.4s ease-in-out infinite alternate;
  }
  .skeleton span:nth-child(2) {
    width: 82%;
  }
  .skeleton span:nth-child(3) {
    width: 58%;
  }
  @keyframes report-pulse {
    to {
      opacity: 0.38;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton span {
      animation: none;
    }
  }
  @media (forced-colors: active) {
    .state-view,
    .state-marker {
      border: 1px solid CanvasText;
    }
  }
`;
