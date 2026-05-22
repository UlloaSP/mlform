// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldConfig,
  FieldDefinition,
  FieldValidationFnContext,
  FieldValueAdapter,
  NormalizedFieldConfig,
} from "@/schema";
import type {
  FieldDescriptor,
  FieldDescriptorContext,
  FieldPresenter,
  FieldRenderHints,
  FieldRenderSpec,
  FieldRenderSpecContext,
} from "@/primitives";
import type { ZodType } from "zod";

export interface DeclarativeFieldKind<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  schema: ZodType<TConfig>;
  value?: FieldValueAdapter<TConfig, TValue>;
  validate?: (
    context: FieldValidationFnContext<TConfig, TValue>,
  ) => string[] | PromiseLike<string[]>;
  render: FieldRenderSpec<TConfig, TValue>;
}

const resolveHints = <TConfig extends FieldConfig, TValue>(
  hints:
    | FieldRenderHints
    | ((context: FieldRenderSpecContext<TConfig, TValue>) => FieldRenderHints)
    | undefined,
  context: FieldRenderSpecContext<TConfig, TValue>,
): FieldRenderHints => {
  if (!hints) {
    return {};
  }

  return typeof hints === "function" ? (hints(context) ?? {}) : hints;
};

export type DefinedFieldKind<TConfig extends FieldConfig, TValue> = {
  kind: string;
  schema: import("zod").ZodType<TConfig>;
  getDefaultValue?: (config: TConfig) => TValue;
  normalizeValue?: (value: unknown, config: TConfig) => TValue;
  cloneValue?: (value: TValue, config: TConfig) => TValue;
  isEqual?: (previous: TValue, next: TValue, config: TConfig) => boolean;
  serializeValue?: (value: TValue, config: TConfig) => unknown;
  validate?: FieldDefinition<TConfig, TValue>["validate"];
  describe?: (
    config: NormalizedFieldConfig<TConfig>,
    context: FieldDescriptorContext & { value: TValue },
  ) => FieldDescriptor;
  definition: FieldDefinition<TConfig, TValue>;
  presenter: FieldPresenter<NormalizedFieldConfig<TConfig>, TValue>;
};

export const defineFieldKind = <TConfig extends FieldConfig, TValue>(
  kind: DeclarativeFieldKind<TConfig, TValue>,
): DefinedFieldKind<TConfig, TValue> => {
  const validate = kind.validate;
  const definition: FieldDefinition<TConfig, TValue> = {
    kind: kind.kind,
    schema: kind.schema,
    getDefaultValue: kind.value?.default,
    normalizeValue: kind.value?.normalize,
    cloneValue: kind.value?.clone,
    isEqual: kind.value?.isEqual,
    serializeValue: kind.value?.serialize,
    validate: validate
      ? (value, config, context) =>
          validate({
            ...context,
            config,
            value,
          })
      : undefined,
  };

  const presenter: FieldPresenter<NormalizedFieldConfig<TConfig>, TValue> = {
    kind: kind.kind,
    describe(config, context) {
      const hints = resolveHints(kind.render.hints, {
        config,
        fieldId: config.id,
        state: context.state,
        value: context.value,
      });

      return {
        component: "declarative-field",
        props: {
          id: config.id,
          kind: config.kind,
          label: config.label,
          description: config.description ?? "",
          showDescriptionInline: Boolean(config.showDescriptionInline),
          required: Boolean(config.required),
          disabled: Boolean(config.disabled),
          widget: kind.render.widget,
          value: context.value,
          state: context.state.status,
          errors: context.state.errors,
          ...hints,
          ...config.ui,
        },
        meta: {
          declarative: true,
          widget: kind.render.widget,
        },
      };
    },
  };

  const describe = presenter.describe.bind(presenter);

  Object.assign(definition as unknown as Record<string, unknown>, {
    describe,
  });

  return {
    kind: kind.kind,
    schema: kind.schema,
    getDefaultValue: kind.value?.default,
    normalizeValue: kind.value?.normalize,
    cloneValue: kind.value?.clone,
    isEqual: kind.value?.isEqual,
    serializeValue: kind.value?.serialize,
    validate: definition.validate,
    describe,
    definition,
    presenter,
  };
};
