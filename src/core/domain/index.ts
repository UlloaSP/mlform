import {
  array as zArray,
  never as zNever,
  union as zUnion,
  type ZodTypeAny,
  type infer as zInfer,
} from "zod";

export const array = zArray;
export const never = zNever;
export const union = zUnion;

export type Schema = ZodTypeAny;
export type Infer<T extends ZodTypeAny> = zInfer<T>;
