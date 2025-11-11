// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  literal,
  looseObject,
  strictObject,
  never as Znever,
  type ZodType,
  array as zArray,
  type infer as zInfer,
  union as zUnion,
} from "zod";

import { FieldTypes, ModelTypes } from "@/strategies/domain";

export const array = zArray;
export const union = zUnion;
export const never = Znever;

export type Schema = ZodType;
export type Infer<T extends ZodType> = zInfer<T>;

const BaseSchema = zArray(
  looseObject({
    type: zUnion(Object.values(FieldTypes).map((v) => literal(v))),
  })
);

const OutputSchema = looseObject({
  type: zUnion(Object.values(ModelTypes).map((v) => literal(v))),
});

const Signature = strictObject({
  inputs: BaseSchema,
  outputs: BaseSchema,
});

export type Base = Infer<typeof BaseSchema>;
export type Output = Infer<typeof OutputSchema>;
export type Signature = Infer<typeof Signature>;
