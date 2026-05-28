# Todo

## Boolean Unset Default Todo

- [x] Reproduce boolean field with no `defaultValue` selecting false.
- [x] Preserve explicit `defaultValue: false` as selected false.
- [x] Make required boolean treat unset as missing and false as present.
- [x] Update `DEBT.md` and lessons.
- [x] Run focused and broad verification plus graph update.

## Boolean Unset Default Review

- Root cause: built-in boolean defaulted missing `defaultValue` to `false`, and primitive radio rendering selected false for any non-true value.
- Fix: boolean state is now tri-state (`true`, `false`, `null`); missing/default-empty is `null`, explicit `false` remains false.
- Regression: no-default boolean asserts state `null` and no radios checked; required boolean errors while unset and accepts a false choice.
- Verification: regression failed before fix, then focused tests, nearby integration/runtime tests, typecheck, full `vp test`, full `vp check`, `vp build`, source line cap, `git diff --check`, and `graphify update .` passed.