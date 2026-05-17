// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const formRootSplitStyles = css`
  .split-shell {
    display: flex;
    flex: 1 1 auto;
    inline-size: 100%;
    block-size: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
  }

  .left-section,
  .right-section,
  .form-inputs,
  .results-area {
    min-width: 0;
    min-height: 0;
  }

  .left-section,
  .right-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--mlf-shell-panel-bg, var(--mlf-color-surface, #ffffff));
    box-shadow:
      0 2px 4px var(--mlf-shell-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
      0 14px 30px var(--mlf-shell-panel-shadow, rgba(0, 0, 0, 0.08));
  }

  .left-section {
    flex: 0 1 auto;
    resize: horizontal;
    min-width: min-content;
    max-width: var(--mlf-shell-left-max-width, 48rem);
    border-right: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
  }

  .right-section {
    flex: 1 1 0%;
    min-width: var(--mlf-shell-right-min-width, 24rem);
    border-left: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
  }

  .scroll-y {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-color: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 60%, transparent)
      transparent;
  }

  .scroll-y::-webkit-scrollbar {
    width: 8px;
  }

  .scroll-y::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--mlf-color-text-muted, #475569) 55%, transparent);
    border-radius: 999px;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 2rem;
    border-bottom: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(
      --mlf-shell-header-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 76%, transparent)
    );
    backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
    -webkit-backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
  }

  .sticky-header h2 {
    margin: 0;
    color: var(--mlf-color-text, #0f172a);
    font-size: 1rem;
    font-weight: 600;
  }

  .sticky-meta {
    color: var(--mlf-color-text-muted, #475569);
    font-size: var(--mlf-font-size-xs, 0.72rem);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .form-inputs,
  .results-area {
    flex: 1 1 auto;
  }

  .split-content {
    display: grid;
    gap: 1rem;
    padding: 1.25rem 2rem 2rem;
  }

  .form-actions {
    padding: 1rem 2rem;
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-action-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }

  .empty-report-state {
    display: grid;
    gap: 0.35rem;
    padding: 1.1rem 1.2rem;
    border: var(--mlf-border-width, 1px) dashed
      color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent);
    border-radius: var(--mlf-radius-md, 16px);
    background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 84%, transparent);
    color: var(--mlf-color-text-muted, #475569);
  }

  .empty-report-title {
    margin: 0;
    color: var(--mlf-color-text, #0f172a);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .empty-report-copy {
    margin: 0;
    font-size: var(--mlf-font-size-sm, 0.84rem);
    line-height: var(--mlf-line-height-normal, 1.5);
  }

  @media (max-width: 900px) {
    .root.split {
      display: grid;
    }

    .split-shell {
      display: grid;
    }

    .left-section,
    .right-section {
      min-width: 0;
      max-width: none;
      resize: none;
      border-left: none;
      border-right: none;
    }

    .sticky-header,
    .split-content,
    .form-actions {
      padding-inline: 1.25rem;
    }
  }
`;
