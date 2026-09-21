// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";
import { formRootSplitStyles } from "./form-root-split-styles";

export const formRootStyles = css`
  :host {
    display: block;
    flex: 1 1 auto;
    align-self: stretch;
    inline-size: 100%;
    block-size: 100%;
    max-inline-size: 100%;
    max-block-size: 100%;
    color: var(--mlf-shell-color, var(--mlf-color-text, #0f172a));
    background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
    font-family: var(--mlf-font-family-body);
    min-width: 0;
    min-height: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .root {
    display: grid;
    gap: var(--mlf-shell-gap, 1rem);
    inline-size: 100%;
    block-size: 100%;
    min-width: 0;
    min-height: 0;
  }

  .root.split {
    display: flex;
    flex: 1 1 auto;
    gap: 0;
    overflow: hidden;
    inline-size: 100%;
    block-size: 100%;
    background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
  }

  .panel {
    display: grid;
    gap: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--mlf-panel-radius, 12px);
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-panel-bg, var(--mlf-color-surface, #ffffff));
    box-shadow:
      0 2px 4px var(--mlf-shell-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
      0 8px 16px var(--mlf-shell-panel-shadow, rgba(0, 0, 0, 0.04));
  }

  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.5rem;
    border-bottom: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(
      --mlf-shell-header-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 76%, transparent)
    );
    backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
    -webkit-backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
  }

  .pane-copy {
    display: grid;
    gap: 0.28rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mlf-pane-eyebrow-color, var(--mlf-color-text-muted, #475569));
  }

  .pane-title {
    margin: 0;
    color: var(--mlf-pane-title-color, var(--mlf-color-text, #0f172a));
    font-size: 1rem;
    font-weight: 600;
  }

  .pane-body {
    display: grid;
    gap: 1rem;
    padding: 1rem 1rem 0;
  }

  .collection {
    display: grid;
    gap: var(--mlf-section-gap, 1rem);
  }

  .report-collection {
    gap: 0;
  }

  .empty-report-state {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.75rem;
    align-items: start;
    padding: 1rem 1.1rem;
    border: var(--mlf-border-width, 1px) dashed
      color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent);
    border-radius: var(--mlf-radius-md, 16px);
    background: var(--mlf-report-empty-bg, var(--mlf-color-surface-muted, #f5f7fa));
    color: var(--mlf-color-text-muted, #475569);
  }

  .empty-report-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 12%, transparent);
    color: var(--mlf-color-accent, #1e40af);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .empty-report-title,
  .empty-report-copy {
    margin: 0;
  }
  .empty-report-title {
    color: var(--mlf-color-text, #0f172a);
    font-size: 0.95rem;
    font-weight: 600;
  }
  .empty-report-copy {
    margin-top: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.5;
  }
  .report-skeleton {
    grid-column: 1 / -1;
    display: grid;
    gap: 0.45rem;
    margin-top: 0.25rem;
  }
  .report-skeleton span {
    height: 0.48rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 14%, transparent);
    animation: report-pulse 1.4s ease-in-out infinite alternate;
  }
  .report-skeleton span:nth-child(2) {
    width: 82%;
  }
  .report-skeleton span:nth-child(3) {
    width: 58%;
  }
  @keyframes report-pulse {
    to {
      opacity: 0.38;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .report-skeleton span {
      animation: none;
    }
  }
  @media (forced-colors: active) {
    .empty-report-state,
    .empty-report-icon {
      border: 1px solid CanvasText;
    }
  }

  .actions {
    padding: 1rem 1.5rem 1.25rem;
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-action-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }

  ${formRootSplitStyles}
`;
