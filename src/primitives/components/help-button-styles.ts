// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const helpButtonStyles = css`
  .help-btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: var(--mlf-help-btn-bg, var(--mlf-color-surface-muted, #f5f7fa));
    color: var(--mlf-help-btn-color, var(--mlf-color-text-muted, #526170));
    font: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .help-btn:hover:not(:disabled) {
    color: var(--mlf-color-accent, #2456c7);
    background: var(--mlf-help-btn-bg-hover, var(--mlf-color-accent-soft, #edf2fc));
  }

  .help-btn:focus-visible {
    outline: 2px solid var(--mlf-focus-ring, var(--mlf-color-accent, #1e40af));
    outline-offset: 3px;
  }

  .help-btn:disabled {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .help-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .help-btn {
      border: 1px solid ButtonText;
    }
  }
`;
