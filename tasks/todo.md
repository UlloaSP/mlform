# Fix docs demo transport typecheck

## Goal

- [x] Reproduce docs typecheck failure.
- [x] Trace `Transport.submit` contract and demo request usage.
- [x] Use docs typecheck as the contract regression seam.
- [x] Apply smallest shared fix.
- [x] Run `vp run typecheck`, `vp check`, and `vp test`.
- [x] Run graph refresh and inspect final diff.

## Review

- Root cause: showcase transport still required removed `serializedValues` and returned a legacy keyed report object.
- Demo schema and transport now use `mappedTo`, `modelValues`, and strict report envelopes.
- Remaining docs references to removed submission aliases and keyed report responses now use the active contract.
- Verification passed: root `vp check`, root/docs typecheck, 260 tests, root build, and 233-page docs build.
- `graphify update . --force` found no code topology changes and left existing graph outputs untouched.

---
0.1.22
# Strict MLForm 0.1.21 contract

## Goal

- [x] Provide registry-driven schema diagnostics and JSON Schema.
- [x] Preserve exact paths for normalization and nested series errors.
- [x] Remove migration-only submission aliases.
- [x] Carry official per-report and per-backend context.
- [x] Separate report controller identity from backend payload routes.
- [x] Expose backend-preserving mapped routes and reusable transport fanout.
- [x] Delete Spanish and unver0.1.22e legacy documentation.
- [x] Prepare package version 0.1.21 without publishing.
- [x] Migrate MLSuite and Crystal Tree to the strict contract.

## Verification

- [x] `vp check`
- [x] `vp run typecheck`
- [x] `vp test`: 31 files, 260 tests
- [x] `vp build`
- [x] Docs typecheck and static build: 14 pages
- [x] `npm pack --dry-run --json`
- [x] Source 300-line cap and `git diff --check`
- [x] `graphify update .`

## Review

- Public request/result value views are now only `inputs`, `displayValues`, and `modelValues`.
- Report results use exact `backend + mappedTo` routes with `pending`, `ready`, or terminal `skipped`.
- `validateSchema`, `findUnknownKinds`, and `toSchemaJsonSchema` derive diagnostics and editor schema from the active registry.
- `resolveMappedRoutes` retains backend identity even when targets match.
- English docs were rebuilt from current source exports; Spanish and stale cookbook/migration material was deleted.
- Publishing remains an explicit external release action and was not performed.
