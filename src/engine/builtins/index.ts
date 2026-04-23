// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createRegistry } from "../registry";
import type { Registry } from "../types";
import { booleanFieldDefinition } from "./fields/boolean";
import { categoryFieldDefinition } from "./fields/category";
import { dateFieldDefinition } from "./fields/date";
import { numberFieldDefinition } from "./fields/number";
import { seriesFieldDefinition } from "./fields/series";
import { textFieldDefinition } from "./fields/text";
import { classifierReportDefinition } from "./reports/classifier";
import { regressorReportDefinition } from "./reports/regressor";

export {
  booleanFieldDefinition,
  categoryFieldDefinition,
  classifierReportDefinition,
  dateFieldDefinition,
  numberFieldDefinition,
  regressorReportDefinition,
  seriesFieldDefinition,
  textFieldDefinition,
};

export const builtinFieldDefinitions = [
  textFieldDefinition,
  numberFieldDefinition,
  booleanFieldDefinition,
  categoryFieldDefinition,
  dateFieldDefinition,
  seriesFieldDefinition,
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
    .registerField(seriesFieldDefinition)
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);

  return registry;
};
