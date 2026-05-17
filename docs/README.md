# MLForm Docs

Documentation site for MLForm, built with Astro Starlight.

The published site documents the current `0.1.9` release line and the latest maintained main branch content unless a release note states otherwise.

## Local Development

From `docs/`:

```bash
vp install
vp run dev
```

## Validation

Run these before pushing docs changes:

```bash
vp run typecheck
vp run build
```

## Preview Production Output

```bash
vp run preview
```

## Notes

- Use `vp`, not `npm`, `pnpm`, or `yarn`, for this repository workflow.
- Main package docs should match the public API shipped in `mlform@0.1.9`.
- If examples change in `README.md`, update the canonical docs pages too.
