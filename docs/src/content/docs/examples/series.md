---
title: Series
description: Collect observations with one or more named columns and optionally submit calculated numeric features.
---

Use `series` when a model needs repeated observations or numeric features calculated from them.
Declare one or more `columns`; each uses a supported built-in field definition: `text`, `number`,
`date`, `category`, or `boolean`.

```ts
import { mountForm } from "mlform";
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema: {
    fields: [
      {
        id: "history",
        kind: "series",
        label: "Demand history",
        mappedTo: "history",
        columns: [
          { id: "date", kind: "date", label: "Date", required: true },
          { id: "demand", kind: "number", label: "Demand", required: true, min: 0, unit: "units" },
        ],
        minPoints: 3,
        maxPoints: 24,
      },
    ],
    reports: [{ id: "forecast", mappedTo: "forecast", kind: "regressor", label: "Next period", precision: 1 }],
  },
});
```

Rows are objects keyed by column `id`, for example `{ date: "2026-01-01", demand: 12 }`.
The date definition serializes `date` to a full ISO timestamp; the number definition serializes
`demand` as a number.

## Column contract

The `columns` array controls presentation order and must contain at least one column. There is no
fixed column count: use one value column, a pair of measurements, or a date plus several values.
Column ids are unique within the series. They start with an ASCII letter or underscore and
contain only ASCII letters, digits, underscores, or hyphens. `__proto__`, `constructor`, and
`prototype` are reserved. A column id identifies a cell in a row, independently of the series'
runtime id, display key, or backend destinations.

Values are matched by column id, so reordering columns does not change which value is aggregated.
MLForm ignores undeclared row keys and normalizes missing cells through their built-in definition.
It does not infer column identities from labels, object order, or positional arrays. Malformed
rows remain empty observations and are validated rather than silently discarded.

For a single measured value, no second column is needed:

```ts
{
  kind: "series",
  label: "Glucose measurements",
  required: true,
  minPoints: 2,
  columns: [{ id: "value", kind: "number", label: "Value", required: true }],
  defaultValue: [{ value: 90 }, { value: 110 }],
  aggregations: [
    { label: "Mean", source: "value", operation: "mean", mappedTo: "glucose_mean" },
    { label: "Sample deviation", source: "value", operation: "stddev", ddof: 1, mappedTo: "glucose_sd" },
  ],
}
```

The editor aligns column headings with cells and scrolls horizontally when needed. In narrow
containers it stacks each row's cells with their column labels. Adding a row focuses its first
control; removing one moves focus to an available row action or control.

`columns` replaces the previous fixed `field1`/`field2` configuration. Update existing schemas
to declare column ids explicitly, and key initial values and aggregation sources by those ids.

## Numeric aggregates

Let the user enter the observations once and declare each model feature in `aggregations`:

```ts
{
  id: "pressure",
  kind: "series",
  label: "Blood pressure measurements",
  displayKey: "Original measurements",
  required: true,
  minPoints: 1,
  columns: [
    { id: "date", kind: "date", label: "Date (optional)" },
    { id: "systolic", kind: "number", label: "Systolic", unit: "mmHg", required: true },
    { id: "diastolic", kind: "number", label: "Diastolic", unit: "mmHg", required: true },
  ],
  aggregations: [
    { label: "Maximum systolic", source: "systolic", operation: "max", mappedTo: "pas_max" },
    { label: "Mean systolic", source: "systolic", operation: "mean", mappedTo: "pas_mean" },
    { label: "Systolic mode", source: "systolic", operation: "mode", mappedTo: "pas_mode" },
    {
      label: "First diastolic quartile",
      source: "diastolic",
      operation: "quantile",
      q: 0.25,
      method: "linear",
      mappedTo: "pad_q1",
    },
  ],
}
```

For observations `[{ systolic: 120, diastolic: 80 }, { systolic: 140, diastolic: 90 }]`, the model values are
`{ pas_max: 140, pas_mean: 130, pas_mode: 120, pad_q1: 82.5 }`. The raw points remain the field's
value, its snapshot value, `inputs[].value`, and its explicit `displayKey` value. The built-in
editor shows only the observations by default. Calculations remain active when their results
are hidden. Set `showAggregationSummary: true` on the series field to opt into a live summary;
edits and row removal update it immediately. Labels identify the features in that optional
summary and in the schema, rather than adding extra inputs for the user.

### How the mapping works

Put the series field in `schema.fields`. Each row supplies values keyed by the declared column ids; each aggregate
selects one of those columns with `source`, applies its `operation`, and writes the result to its
explicit backend destination in `mappedTo` when a submission snapshot is created or the form is
submitted. A corresponding `number` field does not need to exist in the form schema.

In the example, `id: "pressure"` identifies the original series in the runtime,
`displayKey: "Original measurements"` identifies its display value, and `mappedTo: "pas_mean"`
identifies the model feature receiving the calculated mean. The runtime validates the observations
before submission. Calculated features are derived from the current points, rather than kept in
separate editable fields.

### Relationship to mapped category

[`mapped-category`](/schema/mapped-category/) stores fixed values in each option's `mapping`.
Selecting an option writes those values into other fields declared in the same schema; its
mapping keys identify those form fields, which have their own backend mappings.

`series.aggregations` computes numeric values from the entered observations. Its destinations
identify backend features directly through `mappedTo`. Both capabilities let one visible field
affect several model inputs, but aggregation features do not require extra form fields or a
category option for every possible set of measurements. This behavior belongs to the built-in
series definition and also works in the headless runtime.

Each aggregate requires `label`, `source` (a column id), `operation`, and `mappedTo`.
Only `number` sources are supported. `mappedTo` accepts a feature name, numeric position, or a
backend-specific map, just like a top-level field. An aggregate without a route for the selected
backend is omitted. Duplicate, overlapping, and unsafe destinations fail schema normalization.

| Operation | Result |
| --- | --- |
| `min` / `max` | Smallest / largest observation. |
| `count` / `distinct-count` | Number of observations / number of distinct numeric values. |
| `sum` / `product` | Sum / product of all observations. |
| `first` / `last` | First / last observation in input order, without sorting by date or value. |
| `mean` | Arithmetic mean. |
| `geometric-mean` / `harmonic-mean` | Unweighted geometric / harmonic mean; negative values are invalid and any zero produces zero. |
| `rms` | Root mean square: square root of the mean of the squared observations. |
| `median` | Linear quantile at `q = 0.5`. |
| `mode` | Most frequent value; the smallest value wins ties, including all-distinct samples. |
| `quantile` | Requires `q` between 0 and 1 and explicit `method: "linear"`. |
| `range` / `iqr` | Maximum minus minimum / third quartile minus first quartile, using linear quantiles. |
| `variance` / `stddev` | Variance / standard deviation; requires explicit `ddof`. |
| `sem` | Standard error of the mean: standard deviation divided by the square root of the count; requires `ddof`. |
| `cv` | Coefficient of variation: standard deviation divided by the signed mean, without converting to a percentage; requires `ddof`. |
| `mad` | Median absolute deviation from the median, without a normal-distribution scaling factor. |
| `mean-absolute-deviation` | Mean absolute deviation from the arithmetic mean. |
| `skewness` | Fisher–Pearson skewness; requires explicit `bias`. |
| `kurtosis` | Fourth standardized moment; requires explicit `bias` and `fisher`. |

For `variance`, `stddev`, `sem`, and `cv`, `ddof: 0` uses population variance and `ddof: 1` uses
sample variance. The divisor is `n - ddof`; `ddof` must be a non-negative integer and there must
be more than `ddof` observations. These are the [NumPy variance conventions](https://numpy.org/doc/stable/reference/generated/numpy.var.html).

For `skewness` and `kurtosis`, `bias: true` uses central moments divided by `n`; `bias: false`
applies the sample bias correction and requires at least three or four observations respectively.
`fisher: true` subtracts three from kurtosis (excess kurtosis); `fisher: false` returns Pearson
kurtosis. See the [skewness](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.skew.html)
and [kurtosis](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kurtosis.html) definitions.
Both are undefined for a constant series. `cv` is undefined when the mean is zero.

```ts
aggregations: [
  { label: "Measurement count", source: "systolic", operation: "count", mappedTo: "pas_count" },
  { label: "Sample deviation", source: "systolic", operation: "stddev", ddof: 1, mappedTo: "pas_std" },
  { label: "Interquartile range", source: "diastolic", operation: "iqr", mappedTo: "pad_iqr" },
  { label: "Sample skewness", source: "systolic", operation: "skewness", bias: false, mappedTo: "pas_skew" },
  { label: "Excess kurtosis", source: "systolic", operation: "kurtosis", bias: false, fisher: true, mappedTo: "pas_kurt" },
]
```

Linear quantiles sort a copy of the values and interpolate at position `q * (n - 1)`. This is
the [NumPy linear method](https://numpy.org/doc/stable/reference/generated/numpy.quantile.html).
Use `q: 0.25` and `q: 0.75` for the first and third quartiles. Calculations preserve duplicates
and use all supplied observations, without rounding, filtering, unit conversion, or time-window
selection. Match these conventions to the preprocessing used to train your model.

Every populated row must contain a finite number in each aggregated column, even if that nested
field did not declare `required`. Missing or invalid values block submission; MLForm does not
discard rows or turn missing values into zero. An optional empty series produces `0` for
`count`, `distinct-count`, and `sum`, `1` for `product`, and `null` for other operations.
Use `required: true` or `minPoints` when the backend requires observations. For populated series,
undefined results, invalid mathematical domains, or a result outside the finite numeric range
block submission. Configure `minPoints` and numeric ranges to explain these requirements before
the user submits; hiding the summary does not disable validation.

The optional summary uses the source's unit for results with the same dimension, squares it for
variance, and omits it for counts, product, coefficient of variation, skewness, and kurtosis.

Omit the top-level `mappedTo` to send only the aggregate features. Set it to send the serialized
series as well. `valuePath` cannot be combined with `aggregations`; declare explicit destinations
through `mappedTo` instead. Existing series without `aggregations` keep their ordinary
serialization and mapping behavior.

Headless consumers use the same calculations through `createSubmissionSnapshot` or submission.
For a custom summary, `mlform/builtins` exports `calculateSeriesAggregation(points, aggregation)`
and the `SeriesAggregation` type. The helper accepts normalized numeric points, preserves their
order, and returns the documented empty identity or `null` for incomplete, undefined, or non-finite input. It does not perform the
field's range or point-count validation; validate the form before using values for submission.
