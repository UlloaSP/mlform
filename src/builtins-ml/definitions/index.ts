// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { booleanFieldDefinition } from "./fields/boolean";
import { categoryFieldDefinition } from "./fields/category";
import { mappedCategoryFieldDefinition } from "./fields/mapped-category";
import { dateFieldDefinition } from "./fields/date";
import { longTextFieldDefinition } from "./fields/long-text";
import { multiChoiceFieldDefinition } from "./fields/multi-choice";
import { numberFieldDefinition } from "./fields/number";
import { ratingFieldDefinition } from "./fields/rating";
import { seriesFieldDefinition } from "./fields/series";
import { singleChoiceFieldDefinition } from "./fields/single-choice";
import { textFieldDefinition } from "./fields/text";
import { classifierReportDefinition } from "./reports/classifier";
import { regressorReportDefinition } from "./reports/regressor";

export {
  booleanFieldDefinition,
  categoryFieldDefinition,
  classifierReportDefinition,
  dateFieldDefinition,
  mappedCategoryFieldDefinition,
  longTextFieldDefinition,
  multiChoiceFieldDefinition,
  numberFieldDefinition,
  ratingFieldDefinition,
  regressorReportDefinition,
  seriesFieldDefinition,
  singleChoiceFieldDefinition,
  textFieldDefinition,
};

export const builtinFieldDefinitions = [
  textFieldDefinition,
  numberFieldDefinition,
  booleanFieldDefinition,
  categoryFieldDefinition,
  mappedCategoryFieldDefinition,
  dateFieldDefinition,
  seriesFieldDefinition,
  longTextFieldDefinition,
  singleChoiceFieldDefinition,
  multiChoiceFieldDefinition,
  ratingFieldDefinition,
] as const;

export const builtinReportDefinitions = [
  classifierReportDefinition,
  regressorReportDefinition,
] as const;
