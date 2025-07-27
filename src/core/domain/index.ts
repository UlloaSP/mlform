import {
  type ZodTypeAny,
  array as zArray,
  type infer as zInfer,
  never as zNever,
  union as zUnion,
} from "zod";

export const array = zArray;
export const never = zNever;
export const union = zUnion;

export type Schema = ZodTypeAny;
export type Infer<T extends ZodTypeAny> = zInfer<T>;
