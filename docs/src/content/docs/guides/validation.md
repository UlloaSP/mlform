---
title: Validation
description: When MLForm validates, the four sources of errors, cross-field rules, and errors returned by your backend.
---

Errors come from four places, and all of them land on the same field or form state:

| Source | Where it is declared | Runs |
| --- | --- | --- |
| Kind constraints | Schema: `required`, `min`, `maxLength`, `options`… | Whenever a value is set |
| Field validator | The kind's definition (`validate`), for custom kinds | On blur and on `field.validate()` |
| Form validators | `validators` option of `mountForm`, `createFormView`, `createForm` | On `form.validate()` and submission |
| External errors | `form.setExternalErrors()` from your code | When you call it |

The built-in constraints cover required values, text length and pattern, number range and step,
option membership, date bounds and step, rating range, and series cells and row counts. Each kind's
options are listed in [Field kinds](/schema/fields/).

## When validation runs

| Trigger | What runs |
| --- | --- |
| Defaults, `initialValues`, restored drafts, value changes | Required check and kind constraints. |
| A built-in control loses focus, or `field.validate()` | The above plus the field validator, which may be asynchronous. |
| `form.validate()` or a submission | Every active field, then form validators and the validation hooks. |
| Wizard **Next** | The fields of the current step only. |

Non-empty invalid values show their error immediately, including defaults and loaded data. Empty
fields stay quiet until edited, blurred, or validated. Valid populated editable fields show a short success
message and a check mark.

Hidden and disabled fields are not validated, even when they are
[submitted](/schema/conditions/#inactive-fields-and-submission). Read-only fields are.

A submission validates first. If anything is invalid, the transport is not called and
`form.submit()` rejects with `ValidationError`, whose `result` lists the errors. `mounted.submit()`
also reveals the first invalid field: it opens the section, tab, or wizard step that contains it,
and focuses it. The headless `form.submit()` does not touch the DOM.

## Translating validation errors

Pass `formatValidationMessage` to `mountForm`, `createFormView`, or `createForm`. The formatter
receives a stable `code`, the default English message, positional `args`, and the normalized
`field` config. Return a string to replace the message or `undefined` to keep the default.

```ts
import type { ValidationMessageFormatter } from "mlform/schema";

const formatValidationMessage: ValidationMessageFormatter = ({ code, args, field }) => {
  if (code === "required") return `${field.label} is needed to continue.`;
  if (code === "minValue") return `Please enter ${String(args[0])} or more.`;
  // Look up other codes in your application's translation dictionary.
  return undefined;
};

mountForm(container, { schema, transport, formatValidationMessage });
```

The same formatter applies to defaults, loaded values, edits, restored snapshots, and explicit
validation. It is local to the form; it does not mutate the shared registry or other forms.
The UI receives these runtime errors, including series cell errors, without translating them again.

Built-in codes match keys in `builtinValidationMessages` from `mlform/builtins`, for example
`minLength`, `maxValue`, `stepValue`, and `categoryOptionMismatch`. Runtime required checks use
`required`. Arguments follow the exported message function's parameters. Series use `seriesRow`
with `[rowNumber, columnLabel, translatedError]`, `seriesMeasurement` for invalid aggregate
measurements, and `seriesAggregation` with `[columnLabel]` when an aggregate cannot be computed.
The field config for a series message is the parent series field.

Custom definitions can use `context.formatMessage?.(code, defaultMessage, args)` inside
`validateSync` or `validate`; namespace your custom codes to avoid collisions. Custom renderers
can use `field.formatValidationMessage(code, defaultMessage, args)` for matching diagnostics.
Unrecognized codes keep their default message. Configuration errors, external errors, and strings
returned directly by custom or form validators remain the caller's responsibility.
For labels and success messages, use [UI text options](/kit/labels/).

## Cross-field rules

Form validators receive the current values and return issues:

```ts
mountForm(container, {
  schema,
  transport,
  validators: [
    ({ values }) => {
      const { min, max } = values;
      if (typeof min === "number" && typeof max === "number" && min > max) {
        return { fields: { max: ["Maximum must be greater than minimum."] } };
      }
    },
  ],
});
```

| Return value | Meaning |
| --- | --- |
| nothing | No issue. |
| `string[]` | Form-level errors, shown above the fields. |
| `{ form?, fields? }` | Form errors and field errors keyed by runtime id. |

Validators may be asynchronous. They also receive `submitCount`, `formOperation`,
`submissionStatus`, the field states, and the normalized schema. An issue for an unknown field id
throws instead of being dropped.

## Asynchronous field checks

A custom kind's `validate` hook may call a service. Set `asyncValidationDebounceMs` on the field to
wait for a pause in typing; a newer check aborts the previous one through the `signal` in its
context. Only one explicit validation or submission runs at a time: calling `form.validate()` while
a submission is running, or the reverse, throws `EngineError`.

## Errors from your backend

When the server rejects specific values, show its messages on the fields with
`setExternalErrors`. Field keys are runtime ids:

```ts
try {
  await mounted.submit();
} catch (error) {
  const issues = await readServerIssues(error); // your parsing
  if (issues) {
    mounted.form.setExternalErrors({
      form: issues.form,
      fields: { humidity: ["The sensor reported humidity above 100 %."] },
    });
  }
}
```

External errors make the form invalid until the user edits the field, you call
`clearExternalErrors()`, the form is reset, or a draft is restored. An unknown field id throws
without applying any error. [Errors](/guides/error-handling/) covers transport failures.

## Hooks

`beforeValidate` and `afterValidate` observe each validation; `afterValidate` receives the result.
See [Lifecycle and hooks](/guides/hooks-and-lifecycle/).
