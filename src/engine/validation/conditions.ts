// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { compareComparable } from "../comparison";
import { isEmptyValue } from "../utils";
import type {
  DeclarativeFieldCondition,
  FieldComparisonCondition,
  FieldCondition,
  FieldConditionContext,
  FormStatus,
  NormalizedFieldConfig,
} from "../types";

export type DerivedFieldFlags = {
  visible: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export const evaluateCondition = (
  condition: FieldCondition | undefined,
  context: FieldConditionContext,
  fallback: boolean,
): boolean => {
  if (!condition) {
    return fallback;
  }

  if (typeof condition === "function") {
    return condition(context);
  }

  return evaluateDeclarativeCondition(condition, context);
};

export const matchesValueList = (value: unknown, list: unknown[]): boolean => {
  return list.some((candidate) => Object.is(candidate, value));
};

export const matchesComparison = (
  left: unknown,
  right: unknown,
  operator: FieldComparisonCondition["operator"],
): boolean => {
  const comparison = compareComparable(left, right);
  if (comparison === null) {
    return false;
  }

  switch (operator) {
    case "eq":
      return comparison === 0;
    case "neq":
      return comparison !== 0;
    case "gt":
      return comparison > 0;
    case "gte":
      return comparison >= 0;
    case "lt":
      return comparison < 0;
    case "lte":
      return comparison <= 0;
    default:
      return fallbackComparisonOperatorExhausted(operator);
  }
};

const fallbackComparisonOperatorExhausted = (_operator: never): never => {
  throw new Error("Unsupported comparison operator.");
};

export const evaluateDeclarativeCondition = (
  condition: DeclarativeFieldCondition,
  context: FieldConditionContext,
): boolean => {
  switch (condition.kind) {
    case "field-value": {
      const value = context.values[condition.field];

      if (condition.equals !== undefined && !Object.is(value, condition.equals)) {
        return false;
      }
      if (condition.notEquals !== undefined && Object.is(value, condition.notEquals)) {
        return false;
      }
      if (
        condition.greaterThan !== undefined &&
        !matchesComparison(value, condition.greaterThan, "gt")
      ) {
        return false;
      }
      if (
        condition.greaterThanOrEqual !== undefined &&
        !matchesComparison(value, condition.greaterThanOrEqual, "gte")
      ) {
        return false;
      }
      if (condition.lessThan !== undefined && !matchesComparison(value, condition.lessThan, "lt")) {
        return false;
      }
      if (
        condition.lessThanOrEqual !== undefined &&
        !matchesComparison(value, condition.lessThanOrEqual, "lte")
      ) {
        return false;
      }
      if (condition.in && !matchesValueList(value, condition.in)) {
        return false;
      }
      if (condition.notIn && matchesValueList(value, condition.notIn)) {
        return false;
      }
      if (condition.empty === true && !isEmptyValue(value)) {
        return false;
      }
      if (condition.notEmpty === true && isEmptyValue(value)) {
        return false;
      }
      if (condition.truthy === true && !value) {
        return false;
      }
      if (condition.falsy === true && value) {
        return false;
      }

      return true;
    }
    case "field-comparison":
      return matchesComparison(
        context.values[condition.field],
        context.values[condition.otherField],
        condition.operator,
      );
    case "form-status": {
      const expected = Array.isArray(condition.equals) ? condition.equals : [condition.equals];
      return expected.includes(context.formStatus);
    }
    case "submit-count": {
      if (condition.eq !== undefined && context.submitCount !== condition.eq) {
        return false;
      }
      if (condition.gte !== undefined && context.submitCount < condition.gte) {
        return false;
      }
      if (condition.lte !== undefined && context.submitCount > condition.lte) {
        return false;
      }
      return true;
    }
    case "all":
      return condition.conditions.every((item) => evaluateDeclarativeCondition(item, context));
    case "any":
      return condition.conditions.some((item) => evaluateDeclarativeCondition(item, context));
    case "not":
      return !evaluateDeclarativeCondition(condition.condition, context);
    default:
      return fallbackConditionExhausted(condition);
  }
};

const fallbackConditionExhausted = (_condition: never): never => {
  throw new Error("Unsupported field condition.");
};

export const resolveDerivedFlags = (
  config: NormalizedFieldConfig,
  values: Record<string, unknown>,
  submitCount: number,
  formStatus: FormStatus,
): DerivedFieldFlags => {
  const context: FieldConditionContext = {
    field: config,
    values,
    submitCount,
    formStatus,
  };

  const visible = !evaluateCondition(config.hiddenWhen, context, Boolean(config.hidden));
  const disabled = evaluateCondition(config.disabledWhen, context, Boolean(config.disabled));
  const readOnly = evaluateCondition(config.readOnlyWhen, context, Boolean(config.readOnly));

  return {
    visible,
    disabled,
    readOnly,
  };
};
