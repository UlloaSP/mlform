# Lessons

- When tests fail after type/tooling cleanup, diagnose and fix root behavior before labeling failures pre-existing.
- Custom schema definitions with `describe` need matching presentation registry coverage in UI paths.
- Renderer state selectors must include descriptor-driving report/explanation state, not only entity ids.
- When validating docs, run the exact CI docs sequence; `astro check` passing does not prove `vp check`/CI passes.
- Docs examples must not import from generated `dist`; CI may typecheck docs before package build.
- After large domain collapse, explicitly scan for duplicated lifecycle/request-building logic; passing tests can still leave duplicated rules worth recording as debt.
- Treat graphify incremental output as a map, not source of truth; validate surprising nodes against current source imports before recording architecture debt.
- `graphify update --force` can still preserve deleted-symbol nodes; verify graph text, then prune/recluster if deleted domain nodes remain.
- Build graphify from the intended corpus path first; if graphify writes relative paths, normalize root graph `source_file` values so later analysis cannot confuse docs/tests with source corpus.
