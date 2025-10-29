// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseFieldSchema } from "@/extensions/domain";
import { FieldTypes } from "./FieldTypes";

export const BooleanFieldSchema = z.strictObject({
  ...BaseFieldSchema.shape,
  type: z.literal(FieldTypes.BOOLEAN),
  value: z.optional(z.boolean()),
});

export type BooleanField = z.infer<typeof BooleanFieldSchema>;
