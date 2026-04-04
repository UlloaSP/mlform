// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseModelSchema } from "@/extensions/domain";
import { ModelTypes } from "./ModelTypes";

export const ClassifierModelSchema = z.strictObject({
  ...BaseModelSchema.shape,
  type: z.literal(ModelTypes.CLASSIFIER),
  mapping: z.optional(z.array(z.string().min(1))),
  probabilities: z.optional(
    z.array(z.array(z.number().min(0.0).max(1.0)).min(1)).min(1)
  ),
  details: z.boolean().default(false),
});

export type ClassifierModel = z.infer<typeof ClassifierModelSchema>;
