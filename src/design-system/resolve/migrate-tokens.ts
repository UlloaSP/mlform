// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

/**
 * A single token rename: `from` → `to`. When applied, any occurrence of
 * `from` in a token map is rewritten to `to`, preserving the value.
 */
export interface TokenMigration {
  from: string;
  to: string;
}

/**
 * Strategy when both `from` (renamed to `to`) and `to` already exist:
 *
 * - `"source-wins"` — the migrated (renamed) value overwrites the existing `to` value.
 *   Use when the old key's value is the authoritative one.
 * - `"target-wins"` — the existing `to` value is kept; the migrated value is dropped.
 *   Use when the new key's value should take precedence.
 * - A custom function receives both values and returns the winner.
 */
export type TokenMigrationConflict =
  | "source-wins"
  | "target-wins"
  | ((sourceValue: string, targetValue: string, key: string) => string);

/**
 * Apply a list of token migrations to a token map. Renames keys in-place
 * (by returning a new map).
 *
 * @param tokens    - The token map to migrate.
 * @param migrations - List of `{ from, to }` renames.
 * @param onConflict - Strategy when both `from` and `to` exist. Defaults to `"source-wins"`.
 *
 * ```ts
 * const v2Migrations: TokenMigration[] = [
 *   { from: "--mlf-color-primary", to: "--mlf-color-accent" },
 * ];
 * const upgraded = migrateTokens(legacyTokens, v2Migrations, "target-wins");
 * ```
 */
export const migrateTokens = (
  tokens: Record<string, string>,
  migrations: TokenMigration[],
  onConflict: TokenMigrationConflict = "source-wins",
): Record<string, string> => {
  const renameMap = new Map(migrations.map((m) => [m.from, m.to]));
  const originalTokens = { ...tokens };
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tokens)) {
    const newKey = renameMap.get(key) ?? key;

    if (newKey in result) {
      // Conflict: both the renamed key and an existing key mapped to the same target.
      if (onConflict === "source-wins") {
        // If this is a renamed key (key !== newKey), source wins.
        // If this is the original target key, skip (source already written).
        if (key !== newKey) {
          result[newKey] = value;
        }
      } else if (onConflict === "target-wins") {
        // If this is the original target key (key === newKey), target wins.
        if (key === newKey) {
          result[newKey] = value;
        }
      } else {
        const sourceEntry = migrations.find((migration) => migration.to === newKey);
        const sourceValue = sourceEntry ? originalTokens[sourceEntry.from] : undefined;
        const targetValue = originalTokens[newKey];
        result[newKey] =
          sourceValue !== undefined && targetValue !== undefined
            ? onConflict(sourceValue, targetValue, newKey)
            : onConflict(result[newKey], value, newKey);
      }
    } else {
      result[newKey] = value;
    }
  }

  return result;
};

/**
 * Apply token migrations to all token maps inside a theme manifest.
 * Returns a new plain object (not frozen — pass through `defineTheme` to freeze).
 */
export const migrateThemeTokens = <
  T extends {
    schemes: Record<string, { tokens: Record<string, string> } | undefined>;
    sharedTokens?: Record<string, string>;
  },
>(
  theme: T,
  migrations: TokenMigration[],
): T => {
  const migratedSchemes = Object.fromEntries(
    Object.entries(theme.schemes).map(([key, scheme]) => [
      key,
      scheme ? { ...scheme, tokens: migrateTokens(scheme.tokens, migrations) } : scheme,
    ]),
  ) as T["schemes"];

  return {
    ...theme,
    schemes: migratedSchemes,
    sharedTokens: theme.sharedTokens ? migrateTokens(theme.sharedTokens, migrations) : undefined,
  };
};
