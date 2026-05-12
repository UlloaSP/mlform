# Lessons

- When tests fail after type/tooling cleanup, diagnose and fix root behavior before labeling failures pre-existing.
- Custom schema definitions with `describe` need matching presentation registry coverage in UI paths.
- Renderer state selectors must include descriptor-driving report/explanation state, not only entity ids.
- When validating docs, run the exact CI docs sequence; `astro check` passing does not prove `vp check`/CI passes.
- Docs examples must not import from generated `dist`; CI may typecheck docs before package build.
