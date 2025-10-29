// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseFieldSchema } from "@/extensions/domain";
import { FieldTypes } from "./FieldTypes";

const DATE_MIN_MAX_MESSAGE: string =
  "The minimum date must be earlier than or equal to the maximum date";

const DATE_VALUE_MIN_MESSAGE: string =
  "The selected date must be later than or equal to the minimum date";

const DATE_VALUE_MAX_MESSAGE: string =
  "The selected date must be earlier than or equal to the maximum date";

const isNotBeforeOrEqual = (date1?: string, date2?: string): boolean => {
  return !(
    date1 === undefined ||
    date2 === undefined ||
    new Date(date1) <= new Date(date2)
  );
};

export const DateFieldSchema = z
  .strictObject({
    ...BaseFieldSchema.shape,
    type: z.literal(FieldTypes.DATE),
    value: z.optional(z.iso.datetime()),
    min: z.optional(z.iso.datetime()),
    max: z.optional(z.iso.datetime()),
    step: z.optional(z.int().min(1).default(1)),
  })
  .check((ctx) => {
    if (isNotBeforeOrEqual(ctx.value.min, ctx.value.max)) {
      ctx.issues.push({
        code: "custom",
        path: ["min"],
        message: DATE_MIN_MAX_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotBeforeOrEqual(ctx.value.value, ctx.value.max)) {
      ctx.issues.push({
        code: "custom",
        path: ["value"],
        message: DATE_VALUE_MAX_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotBeforeOrEqual(ctx.value.min, ctx.value.value)) {
      ctx.issues.push({
        code: "custom",
        path: ["min"],
        message: DATE_VALUE_MIN_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
  });

export type DateField = z.infer<typeof DateFieldSchema>;
