// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createRegistry } from "../registry";
import type { Registry } from "../types";
import { booleanFieldDefinition } from "./fields/boolean";
import { categoryFieldDefinition } from "./fields/category";
import { dateFieldDefinition } from "./fields/date";
import { numberFieldDefinition } from "./fields/number";
import { textFieldDefinition } from "./fields/text";
import { timeSeriesFieldDefinition } from "./fields/time-series";
import { classifierReportDefinition } from "./reports/classifier";
import { regressorReportDefinition } from "./reports/regressor";

export {
  booleanFieldDefinition,
  categoryFieldDefinition,
  classifierReportDefinition,
  dateFieldDefinition,
  numberFieldDefinition,
  regressorReportDefinition,
  textFieldDefinition,
  timeSeriesFieldDefinition,
};

export const builtinFieldDefinitions = [
  textFieldDefinition,
  numberFieldDefinition,
  booleanFieldDefinition,
  categoryFieldDefinition,
  dateFieldDefinition,
  timeSeriesFieldDefinition,
] as const;

export const builtinReportDefinitions = [
  classifierReportDefinition,
  regressorReportDefinition,
] as const;

export const createBuiltinRegistry = (): Registry => {
  const registry = createRegistry();

  registry
    .registerField(textFieldDefinition)
    .registerField(numberFieldDefinition)
    .registerField(booleanFieldDefinition)
    .registerField(categoryFieldDefinition)
    .registerField(dateFieldDefinition)
    .registerField(timeSeriesFieldDefinition)
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);

  return registry;
};
