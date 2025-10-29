// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseFieldSchema } from "@/extensions/domain";
import { FieldTypes } from "./FieldTypes";

const VALUE_NOT_IN_OPTIONS_MESSAGE =
  "The value must match one of the allowed options";

const valueNotInOptions = (options: string[], value?: string): boolean => {
  return !(value === undefined || options.includes(value));
};

export const CategoryFieldSchema = z
  .strictObject({
    ...BaseFieldSchema.shape,
    type: z.literal(FieldTypes.CATEGORY),
    value: z.optional(z.string()),
    options: z.array(z.string()).min(1),
  })
  .check((ctx) => {
    if (valueNotInOptions(ctx.value.options, ctx.value.value)) {
      ctx.issues.push({
        code: "custom",
        path: ["value"],
        message: VALUE_NOT_IN_OPTIONS_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
  });

export type CategoryField = z.infer<typeof CategoryFieldSchema>;
