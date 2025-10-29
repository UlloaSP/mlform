// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseFieldSchema } from "@/extensions/domain";
import { FieldTypes } from "./FieldTypes";

const TEXT_PATTERN_MESSAGE: string = "Invalid regex pattern";
const TEXT_MIN_MAX_MESSAGE: string =
  "Minimum length must be less than or equal to maximum length";
const TEXT_VALUE_MIN_MESSAGE: string =
  "Minimum length is <<minLength>> characters";
const TEXT_VALUE_MAX_MESSAGE: string =
  "Maximum length of <<maxLength>> characters exceeded.";

const isValidPattern = (pattern: string | undefined): boolean => {
  if (pattern === undefined) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

const isNotLessThanOrEqual = (a?: number, b?: number): boolean => {
  return !(a === undefined || b === undefined || a <= b);
};

export const TextFieldSchema = z
  .strictObject({
    ...BaseFieldSchema.shape,
    type: z.literal(FieldTypes.TEXT),
    value: z.optional(z.string()),
    placeholder: z.optional(z.string()),
    minLength: z.optional(z.int().min(0)),
    maxLength: z.optional(z.int().min(0)),
    pattern: z.optional(z.string()),
  })
  .check((ctx) => {
    if (!isValidPattern(ctx.value.pattern)) {
      ctx.issues.push({
        code: "custom",
        message: TEXT_PATTERN_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotLessThanOrEqual(ctx.value.minLength, ctx.value.maxLength)) {
      ctx.issues.push({
        code: "custom",
        path: ["minLength"],
        message: TEXT_MIN_MAX_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotLessThanOrEqual(ctx.value.minLength, ctx.value.value?.length)) {
      ctx.issues.push({
        code: "custom",
        path: ["minLength"],
        message: TEXT_VALUE_MIN_MESSAGE.replace(
          "<<minLength>>",
          ctx.value.minLength?.toString() || "0"
        ),
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotLessThanOrEqual(ctx.value.value?.length, ctx.value.maxLength)) {
      ctx.issues.push({
        code: "custom",
        path: ["value"],
        message: TEXT_VALUE_MAX_MESSAGE.replace(
          "<<maxLength>>",
          ctx.value.maxLength?.toString() || "infinity"
        ),
        input: ctx.value,
        continue: true,
      });
    }
  });

export type TextField = z.infer<typeof TextFieldSchema>;
