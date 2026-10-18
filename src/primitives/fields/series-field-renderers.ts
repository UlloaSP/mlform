// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { PrimitiveText } from "../constants";
import type { PrimitiveFieldRenderContext } from "../types";
import { toText } from "../utils";
import { stepNumericDraft } from "./numeric-draft";
import { seriesNumberUnit, type SeriesColumnConfig } from "./series-field-helpers";

export type RenderSeriesCellOptions = {
  config: SeriesColumnConfig;
  value: unknown;
  numericValue?: unknown;
  index: number;
  id: string;
  disabled: boolean;
  readOnly: boolean;
  columnId: string;
  context: PrimitiveFieldRenderContext | undefined;
  text: PrimitiveText;
  onInput: (index: number, columnId: string, value: unknown) => void;
  onBlur: () => void;
  label: string;
};

const renderSeriesSelectOption = (option: unknown, selected: string) => {
  const normalized = typeof option === "string" ? { label: option, value: option } : option;
  if (!normalized || typeof normalized !== "object") {
    return null;
  }

  const item = normalized as { label?: unknown; value?: unknown };
  return html`
    <option value=${String(item.value)} ?selected=${String(item.value) === selected}>
      ${String(item.label)}
    </option>
  `;
};

const renderSeriesTextValue = (value: unknown): string => {
  return typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
      ? `${value}`
      : "";
};

const renderSelectChevron = () => html`
  <span class="chevron" aria-hidden="true">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path
        d="M5.516 7.548a.75.75 0 0 1 1.06-.032L10 10.79l3.424-3.274a.75.75 0 0 1 1.029 1.09l-3.955 3.787a.75.75 0 0 1-1.029 0L5.548 8.606a.75.75 0 0 1-.032-1.058z"
      ></path>
    </svg>
  </span>
`;

export const renderSeriesCell = ({
  config,
  value,
  numericValue,
  index,
  id,
  disabled,
  readOnly,
  columnId,
  context,
  text,
  onInput,
  onBlur,
  label,
}: RenderSeriesCellOptions) => {
  const required = Boolean(config.required);
  switch (config.kind) {
    case "date":
      return html`
        <input
          class="control"
          id=${id}
          type="date"
          .value=${typeof value === "string" ? value : ""}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${disabled}
          ?readonly=${readOnly}
          min=${ifDefined(typeof config.min === "string" ? config.min : undefined)}
          max=${ifDefined(typeof config.max === "string" ? config.max : undefined)}
          step=${ifDefined(typeof config.step === "number" ? config.step : undefined)}
          @input=${(event: Event) =>
            onInput(index, columnId, (event.target as HTMLInputElement).value)}
          @blur=${onBlur}
        />
      `;
    case "category": {
      const options = Array.isArray(config.options) ? config.options : [];
      const selected = typeof value === "string" ? value : "";
      const unavailable =
        selected !== "" &&
        !options.some(
          (option) => (typeof option === "string" ? option : option.value) === selected,
        );
      return html`
        <div class="select-wrap">
          <select
            class="control"
            id=${id}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            aria-readonly=${String(readOnly)}
            ?required=${required}
            ?disabled=${Boolean(disabled || readOnly)}
            @change=${(event: Event) =>
              onInput(index, columnId, (event.target as HTMLSelectElement).value)}
            @blur=${onBlur}
          >
            <option value="" ?selected=${selected === ""}>
              &#8212; ${text.categoryPlaceholder} &#8212;
            </option>
            ${unavailable ? html`<option value=${selected} selected disabled>${selected}</option>` : html``}
            ${options.map((option) => renderSeriesSelectOption(option, selected))}
          </select>
          ${renderSelectChevron()}
        </div>
      `;
    }
    case "boolean": {
      const trueLabel = toText(config.trueLabel, text.booleanTrue);
      const falseLabel = toText(config.falseLabel, text.booleanFalse);
      const selected = value === true ? "true" : value === false ? "false" : "";
      return html`
        <div class="select-wrap">
          <select
            class="control"
            id=${id}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            aria-readonly=${String(readOnly)}
            ?required=${required}
            ?disabled=${Boolean(disabled || readOnly)}
            @change=${(event: Event) => {
              const next = (event.target as HTMLSelectElement).value;
              onInput(index, columnId, next === "" ? "" : next === "true");
            }}
            @blur=${onBlur}
          >
            <option value="" ?selected=${selected === ""}>&#8212; Select &#8212;</option>
            <option value="true" ?selected=${selected === "true"}>${trueLabel}</option>
            <option value="false" ?selected=${selected === "false"}>${falseLabel}</option>
          </select>
          ${renderSelectChevron()}
        </div>
      `;
    }
    case "number": {
      const unit = seriesNumberUnit(config);
      const unitWidth = `${Math.max(unit.length * 0.56 + 0.8, 2.3)}rem`;
      return html`
        <div
          class="value-wrap ${disabled ? "is-disabled" : readOnly ? "is-readonly" : ""}"
          style=${`--mlf-series-unit-width: ${unitWidth};`}
          title=${ifDefined(unit || undefined)}
        >
          <input
            class="control"
            id=${id}
            type="text"
            role="spinbutton"
            aria-valuenow=${ifDefined(typeof numericValue === "number" ? numericValue : undefined)}
            aria-valuetext=${ifDefined(unit && typeof numericValue === "number" ? `${numericValue} ${unit}` : undefined)}
            aria-valuemin=${ifDefined(typeof config.min === "number" ? config.min : undefined)}
            aria-valuemax=${ifDefined(typeof config.max === "number" ? config.max : undefined)}
            @keydown=${(event: KeyboardEvent) => stepNumericDraft(event, numericValue)}
            inputmode="decimal"
            spellcheck="false"
            autocomplete="off"
            .value=${renderSeriesTextValue(value)}
            placeholder=${toText(config.placeholder)}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            ?required=${required}
            ?disabled=${disabled}
            ?readonly=${readOnly}
            min=${ifDefined(typeof config.min === "number" ? config.min : undefined)}
            max=${ifDefined(typeof config.max === "number" ? config.max : undefined)}
            step=${ifDefined(typeof config.step === "number" ? config.step : undefined)}
            @input=${(event: Event) =>
              onInput(index, columnId, (event.target as HTMLInputElement).value)}
            @blur=${onBlur}
          />
          <span class="unit" aria-hidden="true">${unit}</span>
        </div>
      `;
    }
    default:
      return html`
        <input
          class="control"
          id=${id}
          type="text"
          .value=${renderSeriesTextValue(value)}
          placeholder=${toText(config.placeholder)}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${disabled}
          ?readonly=${readOnly}
          minlength=${ifDefined(
            typeof config.minLength === "number" ? config.minLength : undefined,
          )}
          maxlength=${ifDefined(
            typeof config.maxLength === "number" ? config.maxLength : undefined,
          )}
          pattern=${ifDefined(typeof config.pattern === "string" ? config.pattern : undefined)}
          @input=${(event: Event) =>
            onInput(index, columnId, (event.target as HTMLInputElement).value)}
          @blur=${onBlur}
        />
      `;
  }
};
