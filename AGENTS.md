# MLForm

MLForm is a schema-driven TypeScript library for building interfaces around machine-learning backends.

A schema defines inputs and reports. MLForm normalizes that schema, manages form state and validation, produces backend-facing payloads, and optionally renders accessible Web Components. Consumers may use the complete kit or adopt lower-level package surfaces independently.

## What must remain true

### 1. The schema is the contract

Fields, reports, validation, serialization, backend mappings, and rendered behavior originate from the schema and its registered definitions.

Keep one source of truth. A rule implemented independently in runtime, primitives, and kit will eventually diverge.

### 2. Headless first, rendered when useful

The runtime must remain usable without the built-in UI. Primitives and kit adapt runtime behavior; they do not redefine it.

Applications should be able to choose among:

- headless runtime and custom rendering
- MLForm primitives
- the complete mounting and layout kit

### 3. Backend identity is explicit

Runtime ids, display keys, and backend `mappedTo` targets serve different purposes. Keep those boundaries explicit.

Do not recover missing mappings through labels, ids, or other convenient fallbacks. Ambiguous contracts fail early instead of guessing.

### 4. Extensions follow the normal path

Custom field and report kinds should use the same normalization, registration, validation, rendering, and submission paths as built-ins.

Prefer declarative definitions. Drop to custom rendering only when the declarative layer cannot express the required behavior.

### 5. Accessibility is default behavior

Built-in controls must retain semantic markup, keyboard operation, focus management, labels, validation feedback, and usable forced-colors behavior.

Accessibility is part of the component contract, not optional polish.

## Maintainer intent

Favor ambitious capabilities built from small, explicit models.

Remove complexity whose original constraint no longer exists. Do not preserve compatibility paths, migration fields, abstractions, or configuration merely because they already exist.

Implement the smallest coherent change that makes correct behavior unsurprising. Smallest means one root fix, not a narrow patch that leaves sibling paths inconsistent.

These instructions are defaults unless marked as invariants. An explicit maintainer request may override a default. If a request conflicts with an invariant or public contract, explain the conflict before proceeding.

## Vocabulary

Use these terms consistently:

- **schema**: declarative description of fields, reports, conditions, mappings, and form behavior
- **definition**: registered behavior for one field or report kind
- **registry**: collection of available definitions
- **runtime**: headless state, validation, conditions, report state, and submission orchestration
- **primitive**: built-in Web Component renderer
- **kit**: high-level mounting, layout, navigation, and lifecycle APIs
- **transport**: boundary that sends submission data to a backend and returns results
- **design system**: themes, recipes, tokens, density, motion, and host integration
- **runtime id**: identity used by controllers and internal state
- **display key**: UI-facing identity used for displayed values
- **mapped target**: external backend identity expressed through `mappedTo`

## Invariants

- Source files stay at or below 300 lines. Split by responsibility before crossing the limit.
- Public package surfaces remain rooted at:
  - `mlform/schema`
  - `mlform/runtime`
  - `mlform/builtins`
  - `mlform/transport`
  - `mlform/primitives`
  - `mlform/design`
  - `mlform/kit`
- Cross-module imports use the target module root. Internal paths remain private to their owning module.
- Public API changes are deliberate and visible. Never change them silently.
- Schema, runtime behavior, rendered behavior, tests, examples, and user documentation must describe the same contract.
- New runtime dependencies require a concrete benefit that existing code, platform APIs, or current dependencies cannot provide cleanly.
- Verification claims must match commands actually run.

## How MLForm fits together

Typical flow:

1. Schema and registries define supported fields and reports.
2. Schema normalization resolves defaults, ids, mappings, and definitions.
3. Runtime controllers own state, validation, conditions, and submission.
4. Submission snapshots separate display values from backend-facing values.
5. Transports execute backend requests.
6. Report results return through explicit mapped targets and report contexts.
7. Primitives render individual fields and reports.
8. Kit composes primitives into layouts and manages mounting and navigation.
9. Design applies themes, recipes, tokens, density, and host integration.

Complexity should live at explicit boundaries: schema normalization, definitions, registries, transports, and renderer adapters. Runtime behavior should remain deterministic; UI components should consume it instead of reconstructing it.

## Where code lives

- `src/schema` — schema types, normalization, validation, ids, mappings, registries, and report contexts
- `src/runtime` — controllers, field state, validation, conditions, submission snapshots, and pipelines
- `src/builtins` — built-in field and report definitions
- `src/transport` — transport contracts, request execution, errors, and fanout
- `src/primitives` — Web Components, descriptors, renderer registries, and primitive requests
- `src/design` — themes, recipes, token contracts, and design-system attachment
- `src/kit` — mounting, layouts, navigation, lifecycle, and declarative extension APIs
- `test/unit` — focused contract and behavior tests
- `test/integration` — interactions spanning modules or mounted UI
- `docs` — shipped user and API documentation
- `graphify-out` — generated relationship map for broad architectural navigation

Treat `package.json`, `vite.config.ts`, module entry points, and tests as the source of truth for commands and public structure. Do not duplicate discoverable inventories here.

## Check every affected path

Apply only entries relevant to the change:

- **Schema:** normalization, defaults, diagnostics, and JSON Schema still agree.
- **Runtime:** controllers, snapshots, conditions, validation, and pipelines share one rule.
- **Identity:** runtime ids, display keys, and mapped targets remain distinct.
- **Rendering:** headless, primitive, and kit paths expose compatible behavior.
- **Reports:** mounted, fetched, submitted, skipped, failed, and multi-backend states remain coherent.
- **Layout:** single-page, tabs, accordion, wizard, and custom headless layouts receive the behavior where applicable.
- **Extensions:** built-in and custom definitions follow the same contract.
- **Design:** themes, recipes, tokens, density, motion, and forced-colors behavior remain valid.
- **Lifecycle:** every setup path has cleanup; every pending state reaches a terminal state.
- **Public API:** exports, declarations, examples, and docs match the implementation.

A change is incomplete when it works only through the path used by its first test.

## Change style

Fix root causes at their owning boundary.

Prefer:

- deletion over compatibility scaffolding
- an existing abstraction over a parallel one
- platform behavior over custom machinery
- explicit contracts over inference and fallback
- one complete path over several partially supported paths
- local comments explaining non-obvious reasons over comments narrating code

Avoid speculative flags, placeholder implementations, one-use factories, duplicate models, and migration-only fields without an active migration.

When a file mixes responsibilities or approaches 300 lines, split around ownership. Do not extract arbitrary helpers merely to satisfy the line limit.

Keep module `index.ts` files as public surfaces. Business logic belongs in owned modules, not barrels.

## Compatibility

MLForm is pre-1.0. Compatibility is a product decision, not an automatic requirement.

Preserve an existing contract when the task requires compatibility. When a clean break is intended, remove the old path completely:

- implementation
- types
- tests
- examples
- documentation
- fallbacks
- migration-only aliases

Never maintain two active contracts accidentally.

## Testing

Use the smallest proof that exercises observable behavior.

During development:

- run the focused test file or affected test group
- add regression coverage for bugs
- cover the successful path and affected failure states
- test public behavior rather than internal wiring
- use integration tests when correctness depends on multiple modules
- use browser-backed coverage when DOM behavior, focus, keyboard interaction, or real rendering matters

Tests must not depend on arbitrary sleeps when an observable event, state transition, or promise can express completion.

Before handoff, run the relevant quality gates. Common commands are:

```bash
vp check
vp run typecheck
vp test run
vp build
```

A small documentation-only change does not require every code gate. A public source or package-surface change normally requires all four. Use scripts declared by the relevant package when working under `docs/`.

If verification cannot run, report the exact command, failure, and unverified scope. Never describe an unrun check as passing.

## Documentation

Code changes need documentation only when they alter something users or maintainers must know.

User documentation should explain:

- what a capability does
- how to start using it
- its external contract
- constraints that are not obvious from types or UI

Architecture documentation should capture durable cross-module decisions, reasons, and traps that cannot be learned cheaply from source.

Do not document file inventories, implementation walkthroughs, method lists, or PR history. Code, types, tests, and generated API references already carry that information.

When behavior changes, rewrite or remove stale guidance instead of appending another version of the story.

Keep `README.md` focused on product identity, installation, primary usage, package surfaces, and links into detailed documentation.

## Git and pull requests

Preserve unrelated working-tree changes.

Do not commit, push, create branches, or open pull requests unless explicitly requested.

Keep one concern per commit or pull request. Use Conventional Commit titles when creating commits.

Do not commit agent plans, scratch notes, browser artifacts, generated coverage, or PR-only evidence.

## Done

Work is complete when:

- requested behavior works through every applicable path
- the owning layer contains the rule
- public contracts and package boundaries remain intentional
- obsolete behavior and stale references are gone
- focused regression coverage exists where useful
- relevant verification has run
- documentation reflects user-visible changes
- the result is simpler or more explicit than the state it replaced
