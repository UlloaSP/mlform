// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { slugify } from "@/engine/utils";
import type { FieldConfig, FormSchema, Registry } from "@/engine";
import { QuestionnaireError } from "../errors";
import type { NormalizedStepConfig, QuestionnaireSchema } from "../types";

export interface NormalizedQuestionnaireSchema {
  steps: NormalizedStepConfig[];
  formSchema: FormSchema;
}

const resolveStepId = (
  explicitId: string | undefined,
  title: string,
  index: number,
  usedIds: Set<string>,
): string => {
  const base = slugify(explicitId ?? title) || `step-${index + 1}`;

  if (explicitId) {
    if (usedIds.has(base)) {
      throw new QuestionnaireError(`Duplicate step id "${base}".`);
    }
    usedIds.add(base);
    return base;
  }

  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  usedIds.add(candidate);
  return candidate;
};

export const normalizeQuestionnaireSchema = (
  schema: QuestionnaireSchema,
  _registry: Registry,
): NormalizedQuestionnaireSchema => {
  if (!schema.steps || schema.steps.length === 0) {
    throw new QuestionnaireError("Questionnaire must have at least one step.");
  }

  const allFields: FieldConfig[] = [];
  const usedStepIds = new Set<string>();
  const usedFieldLabels = new Map<string, number>();

  const steps: NormalizedStepConfig[] = schema.steps.map((step, stepIndex) => {
    const id = resolveStepId(step.id, step.title, stepIndex, usedStepIds);

    if (!step.fields || step.fields.length === 0) {
      throw new QuestionnaireError(`Step "${step.title}" must have at least one field.`);
    }

    // Assign stable step-scoped ids to each field so they don't collide
    // across steps with the same labels. We prefix with the step id.
    const fieldIds: string[] = step.fields.map((field) => {
      // Build a predictable id: step-id + slugified label (+ counter if dup)
      const labelSlug = slugify(field.label) || `field`;
      const candidateBase = `${id}-${labelSlug}`;
      const count = usedFieldLabels.get(candidateBase) ?? 0;
      usedFieldLabels.set(candidateBase, count + 1);
      const fieldId = count === 0 ? candidateBase : `${candidateBase}-${count + 1}`;

      allFields.push({ ...field, id: fieldId });
      return fieldId;
    });

    return {
      id,
      title: step.title,
      description: step.description,
      fieldIds,
    };
  });

  return {
    steps,
    formSchema: { fields: allFields },
  };
};

/** Identity helper for typed schema construction. */
export const createQuestionnaireSchema = (schema: QuestionnaireSchema): QuestionnaireSchema =>
  schema;
