// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldStateSnapshot } from "@/runtime";
import type { PrimitiveText } from "../constants";
import { toText } from "../utils";

type CategoryOption = string | { label: string; value: string };

const normalizeCategoryOption = (option: CategoryOption): { label: string; value: string } => {
  return typeof option === "string" ? { label: option, value: option } : option;
};

export const resolveFieldFeedbackComponent = (
  component: string,
  props: Record<string, unknown>,
): string => {
  if (component !== "declarative-field") {
    return component;
  }

  switch (props.widget) {
    case "text":
      return "text-field";
    case "number":
      return "number-field";
    case "boolean":
      return "boolean-field";
    case "select":
      return "category-field";
    case "date":
      return "date-field";
    case "series":
      return "series-field";
    default:
      return component;
  }
};

export const resolveCategorySelection = (
  props: Record<string, unknown>,
  value: unknown,
): { label: string; value: string } | null => {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const options = Array.isArray(props.options) ? (props.options as CategoryOption[]) : [];
  return options.map(normalizeCategoryOption).find((option) => option.value === value) ?? null;
};

export const hasIntroducedValue = (
  component: string,
  props: Record<string, unknown>,
  state: FieldStateSnapshot,
  defaultValue: unknown,
): boolean => {
  const resolvedComponent = resolveFieldFeedbackComponent(component, props);

  switch (resolvedComponent) {
    case "text-field":
      return typeof state.value === "string" && state.value.trim().length > 0;
    case "date-field":
      return typeof props.value === "string" && props.value.trim().length > 0;
    case "category-field":
      return resolveCategorySelection(props, state.value) !== null;
    case "number-field":
      return (
        state.value !== null &&
        state.value !== undefined &&
        state.value !== "" &&
        !(typeof state.value === "number" && Number.isNaN(state.value))
      );
    case "boolean-field":
      return defaultValue !== undefined || state.dirty || state.touched;
    case "series-field":
      return Array.isArray(props.value) && props.value.length > 0;
    default:
      return state.value !== null && state.value !== undefined && state.value !== "";
  }
};

export const createFieldSuccessMessage = (
  component: string,
  props: Record<string, unknown>,
  state: FieldStateSnapshot,
  text: PrimitiveText,
): string => {
  const resolvedComponent = resolveFieldFeedbackComponent(component, props);

  switch (resolvedComponent) {
    case "text-field": {
      const value = typeof props.value === "string" ? props.value : "";
      return value.length > 0 ? text.fieldTextRecorded(value.length) : text.fieldReady;
    }
    case "number-field": {
      const unit = typeof props.unit === "string" ? ` ${props.unit}` : "";
      return state.value === null || state.value === undefined || state.value === ""
        ? text.fieldReady
        : text.fieldValidNumber(state.value, unit);
    }
    case "category-field": {
      const selected = resolveCategorySelection(props, state.value);
      return selected ? text.fieldCategorySelected(selected.label) : text.fieldSelectionReady;
    }
    case "date-field": {
      const value = typeof props.value === "string" ? props.value : "";
      return value.length > 0 ? text.fieldSelectedDate(value) : text.fieldDateReady;
    }
    case "boolean-field": {
      const trueLabel = toText(props.trueLabel, text.booleanTrue);
      const falseLabel = toText(props.falseLabel, text.booleanFalse);
      return text.fieldBooleanSelection(state.value === true ? trueLabel : falseLabel);
    }
    case "series-field": {
      const points = Array.isArray(props.value) ? props.value.length : 0;
      return text.fieldSeriesRecorded(points);
    }
    default:
      return text.fieldReady;
  }
};
