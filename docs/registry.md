# The registry

ui.fabrials.com serves a shadcn registry built from `apps/site`. This is how it works and how to change it. The public explanation lives on the site (`/docs/installation`, `/docs/shims`).

## Entries

| Entry | Source | Published as |
| --- | --- | --- |
| `styles` | `scripts/build-registry.ts` | Installs `@fabrials/ui` and adds its CSS imports |
| `init` | `scripts/build-registry.ts`, palette from `packages/ui/src/tokens.css` | `registry:base`: `styles`, the Highstorm palette and fonts as `cssVars`, and a `config` that sets the Base UI style (`base-nova`) and the `@fabrials` registry in `components.json` |
| Fabrials blocks | `apps/site/registry/{components,webmcp,mcp,server}`, listed in `lib/catalog.ts` | `r/<slug>.json` |
| Shims | Generated into `registry/shims/` and `components/ui/` | `r/<primitive>.json` |

Every published item that needs Fabrials CSS depends on `styles` by URL, so installing one component never changes an app's palette. `registry.json` (also at `r/registry.json`, for namespaced search) and `llms.txt` list everything with its source and license.

The committed `public/` output must match the build: `tests/registry.test.ts` runs every generator with `--check`.

## Shims

`scripts/snapshot-shadcn.ts` records the names each shadcn primitive exports in the Base UI style (`registry/shims/shadcn-exports.json`; rerun with `bun run registry:shadcn` when shadcn changes). `scripts/generate-shims.ts` writes a shim for every primitive whose names `@fabrials/ui` exports in full. Add the missing parts to the package, with shadcn's names, and the shim appears on the next build. The site's own `components/ui/` is the same set of shims, so the docs run on what people install.

## Components from other libraries

The registry publishes Fabrials components and shims only. It used to republish snapshots of other shadcn registries (Kibo UI and Magic UI) behind a license gate; that ended with 0.10, because a product mixing two looks is not a Fabrials product and none of ours used them.

When a product needs a component another library offers:

1. Check that nothing in the packages already does the job (the catalogue in `apps/site/lib/ui-catalog.ts`, `skills/fabrials-design-system/references/components.md`).
2. Rewrite it into `packages/ui` (or `packages/ai-ui` for chat and provider presentation) on Base UI, with the Fabrials tokens, material and motion, both themes, keyboard operation, reduced motion and forced colors, and shadcn's part names where shadcn has them so a shim can cover it.
3. Add a story, a keyboard test, a visual reference, a catalogue entry with a demo, and a line in the migration note.
4. If code or a recipe is adapted rather than written from scratch, the source must be MIT, Apache-2.0, ISC or BSD: keep its copyright and license notice beside the adapted code and add a row to `THIRD_PARTY.md`. A project under extra terms (React Bits' Commons Clause, for one) is studied for ideas only.

## Smoke test

`scripts/smoke-registry.ts` creates a Next.js app, runs `shadcn init` with `init`, adds blocks and shims by name, checks the shim notices survived, then typechecks and builds. Against the public site:

```sh
bun run --cwd apps/site test:registry
```

Before a version is on npm, serve a local build and a local npm registry (nothing leaves the machine):

```sh
bunx verdaccio@6 --listen 127.0.0.1:4873            # config: @fabrials/* publish $authenticated
bun run stage:publish && npm publish --registry http://127.0.0.1:4873 (in packages/ui and packages/ai-ui)
REGISTRY_ORIGIN=http://127.0.0.1:4390 bun run --cwd apps/site registry:build --out /tmp/r
python3 -m http.server 4390 -d /tmp/r
REGISTRY_ORIGIN=http://127.0.0.1:4390 FABRIALS_NPM_REGISTRY=http://127.0.0.1:4873/ bun run --cwd apps/site test:registry
```
