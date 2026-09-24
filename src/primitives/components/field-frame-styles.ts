// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const fieldFrameStyles = css`
  :host {
    display: block;
    align-self: start;
  }

  :host([hidden]) {
    display: none;
  }

  .tile {
    display: grid;
    gap: 0.7rem;
    padding: 1rem 1.1rem;
    border-radius: var(--mlf-field-radius, 12px);
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-field-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-field-bg, var(--mlf-color-surface, #ffffff));
    box-shadow: var(--mlf-field-shadow, none);
    transition: border-color var(--mlf-motion-fast, 140ms ease);
  }

  .tile.success,
  .tile.error {
    border-inline-start-width: 4px;
    padding-inline-start: calc(1.1rem + var(--mlf-border-width, 1px) - 4px);
  }

  .tile:focus-within {
    border-color: var(--mlf-color-accent, #2456c7);
    background: color-mix(in srgb, var(--mlf-color-accent, #2456c7) 3%, var(--mlf-field-bg, #fff));
  }

  .tile.success {
    border-inline-start-color: var(--mlf-color-success, #16704f);
  }

  .tile.error {
    border-inline-start-color: var(--mlf-field-border-invalid, var(--mlf-color-danger, #b93636));
  }

  .header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
  }

  .label {
    margin: 0;
    min-width: 0;
    color: var(--mlf-field-label-color, var(--mlf-color-text, #0f172a));
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .description {
    display: none;
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--mlf-field-description-color, var(--mlf-color-secondary, #475569));
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .description.show {
    display: block;
  }

  .control-slot {
    min-width: 0;
  }

  .feedback {
    min-width: 0;
    font-size: 0.78rem;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .feedback.success {
    color: var(--mlf-field-feedback-success, var(--mlf-color-success, #16704f));
  }

  .feedback.error {
    color: var(--mlf-field-feedback-error, var(--mlf-color-danger, #dc2626));
  }

  @media (forced-colors: active) {
    .tile.error {
      border-inline-start-style: dashed;
    }
  }
`;
