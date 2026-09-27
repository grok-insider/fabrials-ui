# The registry

ui.fabrials.com serves a shadcn registry built from `apps/site`. This is how it works and how to change it. The public explanation lives on the site (`/docs/installation`, `/docs/shims`, `/libraries`).

## Entries

| Entry | Source | Published as |
| --- | --- | --- |
| `styles` | `scripts/build-registry.ts` | Installs `@fabrials/ui` and adds its CSS imports |
| `init` | `scripts/build-registry.ts`, palette from `packages/ui/src/tokens.css` | `registry:base`: `styles`, the Highstorm palette and fonts as `cssVars`, and a `config` that sets the Base UI style (`base-nova`) and the `@fabrials` registry in `components.json` |
| Fabrials blocks | `apps/site/registry/{components,webmcp,mcp,server}`, listed in `lib/catalog.ts` | `r/<slug>.json` |
| Shims | Generated into `registry/shims/` and `components/ui/` | `r/<primitive>.json` |
| Other libraries | Snapshots in `registry/external/<library>/` | `r/<library>-<item>.json` |

Every published item that needs Fabrials CSS depends on `styles` by URL, so installing one component never changes an app's palette. `registry.json` (also at `r/registry.json`, for namespaced search) and `llms.txt` list everything with its tier, license and origin.

The committed `public/` output must match the build: `tests/registry.test.ts` runs every generator with `--check`.

## Shims

`scripts/snapshot-shadcn.ts` records the names each shadcn primitive exports in the Base UI style (`registry/shims/shadcn-exports.json`; rerun with `bun run registry:shadcn` when shadcn changes). `scripts/generate-shims.ts` writes a shim for every primitive whose names `@fabrials/ui` exports in full. Add the missing parts to the package, with shadcn's names, and the shim appears on the next build. The site's own `components/ui/` is the same set of shims, so the docs run on what people install.

## Other libraries

### Adding a library

1. Check it has a public shadcn registry and a permissive license.
2. Write `apps/site/upstreams/<name>.json`: `name`, `title`, `homepage`, `repository` (GitHub `owner/repo`), the `registry` URL template with `{name}`, `tier` (`community`), a `description` and the `items`, each with an optional upstream `demo`.
3. Run `GITHUB_TOKEN=… bun run registry:sync <name>`. It prints a refusal if the gate fails.
4. Install any npm package the previews need (the next step names them), then `bun run registry:build`.
5. If the library publishes no demos, write one per item in `apps/site/components/external-demos/<library>-<item>.tsx` with synthetic data.
6. `bun run check`. Items must compile against the shims; one that does not (for example a component written for Radix buttons) comes out of the manifest.
7. Review the snapshot diff and open a pull request.

### The gate

The sync (`scripts/sync-upstreams.ts`) refuses a library or an item when:

- the repository's license file, read at the commit being synced, is not MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause or 0BSD; or its text adds terms (Commons Clause, "you may not resell"); or GitHub's detection disagrees with ours;
- an npm package the item imports, declared or not, has any other license, or none;
- the item depends on a third registry.

`lib/external.ts` repeats the checks offline on every build and test: license text hash, item hashes, recorded dependencies against the actual imports. A hand-edited snapshot fails.

### What gets published

Items are republished unchanged except for a notice at the top of every file (origin, and the license text, or the Apache-2.0 notice) and completed metadata: dependencies and registry dependencies the upstream imports but did not declare. shadcn primitives point at the Fabrials shims when one exists, and at shadcn otherwise.

### Tiers and design notes

`lib/conformance.ts` reads each item's source and CSS for literal colours, continuous motion, animation without a reduced-motion check, gradients, glow and theme overrides. The notes appear on the item's page. `community` items keep their look; a `fabrials` item has no notes. Promoting one means adapting it to DESIGN.md and moving it into `packages/ui`, with a story, a keyboard test and a visual reference.

### Notices survive the install

The shadcn CLI drops comments above a file's first import when it rewrites import paths, so the license notice (and the shim header) goes right after the imports (`withNotice` in `lib/upstreams.ts`).

## Smoke test

`scripts/smoke-registry.ts` creates a Next.js app, runs `shadcn init` with `init`, adds blocks, shims and components from other libraries by name, checks the notices survived, then typechecks and builds. Against the public site:

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

### Refreshing

Re-run the sync, review the diff (new commit, changed hashes, new dependencies, new notes) and rebuild. Nothing changes on the site until the new snapshot is committed.
