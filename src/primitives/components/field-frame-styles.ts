// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const fieldFrameStyles = css`
  :host {
    display: block;
    align-self: start;
  }

  :host([hidden]),
  :host([data-state-hidden]) {
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

  .tile.error {
    border-color: var(--mlf-field-border-invalid, var(--mlf-color-danger, #b93636));
  }

  .tile.success {
    border-color: color-mix(
      in srgb,
      var(--mlf-color-success, #16704f) 55%,
      var(--mlf-field-border, #e2e8f0)
    );
  }

  .success-mark {
    width: 1em;
    height: 1em;
    margin-inline-start: 0.5em;
    vertical-align: -0.1em;
    stroke: var(--mlf-color-success, #16704f);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
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
    height: 0;
    margin-top: -0.7rem;
    overflow: hidden;
    opacity: 0;
    transition:
      opacity var(--mlf-motion-base, 180ms ease),
      margin-top var(--mlf-motion-base, 180ms ease);
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--mlf-field-description-color, var(--mlf-color-secondary, #475569));
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .description.show {
    height: auto;
    margin-top: 0;
    opacity: 1;
  }

  .control-slot {
    min-width: 0;
  }

  .feedback {
    min-height: 1.5em;
    overflow: hidden;
    min-width: 0;
    font-size: 0.875rem;
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

  @media (prefers-reduced-motion: reduce) {
    .tile,
    .description {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .tile.error {
      border-style: dashed;
    }
  }
`;
