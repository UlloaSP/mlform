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
  FieldPresenter,
  FieldRenderHints,
  FieldRenderSpec,
  FieldRenderSpecContext,
} from "@/primitives";
import type { ZodType } from "zod";
import type { MLFormFieldKind } from "../plugin";

export interface DeclarativeFieldKind<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  schema: ZodType<TConfig>;
  value?: FieldValueAdapter<TConfig, TValue>;
  validate?: (
    context: FieldValidationFnContext<TConfig, TValue>,
  ) => string[] | PromiseLike<string[]>;
  validateSync?: (context: FieldValidationFnContext<TConfig, TValue>) => string[];
  definition?: Partial<
    Pick<
      FieldDefinition<TConfig, TValue>,
      | "validateConfig"
      | "getNestedFieldReferences"
      | "validateRuntime"
      | "onValueChanged"
      | "getMappedTargets"
      | "getSubmissionEntries"
    >
  >;
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

export type DefinedFieldKind<TConfig extends FieldConfig, TValue> = MLFormFieldKind & {
  definition: FieldDefinition<TConfig, TValue>;
  presenter: FieldPresenter<NormalizedFieldConfig<TConfig>, TValue>;
};

export const defineFieldKind = <TConfig extends FieldConfig, TValue>(
  kind: DeclarativeFieldKind<TConfig, TValue>,
): DefinedFieldKind<TConfig, TValue> => {
  const validate = kind.validate;
  const validateSync = kind.validateSync;
  const definition: FieldDefinition<TConfig, TValue> = {
    ...kind.definition,
    kind: kind.kind,
    schema: kind.schema,
    getDefaultValue: kind.value?.default,
    normalizeValue: kind.value?.normalize,
    cloneValue: kind.value?.clone,
    isEqual: kind.value?.isEqual,
    serializeValue: kind.value?.serialize,
    validateSync: validateSync
      ? (value, config, context) =>
          validateSync({
            ...context,
            config,
            value,
          })
      : undefined,
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

  return {
    category: "field",
    kind: kind.kind,
    definition,
    presenter,
    register(registry, descriptorRegistry) {
      registry.registerField(definition);
      descriptorRegistry.registerField(presenter);
    },
  };
};
