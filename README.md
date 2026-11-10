# Fabrials UI

The Fabrials design system, "Instrument with life" (the line that began with 0.11): the interface every Fabrials product shares, and the shadcn registry at [ui.fabrials.com](https://ui.fabrials.com) that lets any React app use it.

Read [DESIGN.md](DESIGN.md) before changing anything visible.

## What is here

| Path | What it is |
| --- | --- |
| `packages/ui` | `@fabrials/ui`: tokens, IBM Plex, controls, patterns, charts and the dithered brand pieces |
| `packages/ai-ui` | `@fabrials/ai-ui`: provider, quota, history and chat presentation |
| `apps/site` | ui.fabrials.com: the documentation, the playground and the registry |
| `apps/site/registry` | Registry sources: Fabrials blocks and shims |
| `stories` | Storybook stories, all with synthetic data |
| `tests` | Unit tests and the visual suite (Playwright in a container, with axe) |
| `skills/fabrials-design-system` | The agent skill that points at this repository |
| `docs` | A migration note per version, the registry, and what products have asked for |

## Three ways to use it

**From npm.** `@fabrials/ui` and `@fabrials/ai-ui` are public packages:

```sh
bun add @fabrials/ui @fabrials/ai-ui
```

**As a verified copy.** A Fabrials product that builds without the registry keeps the same packages in its `vendor/` folder, never edited by hand:

```sh
bun run vendor radiant --write   # writes radiant/vendor/fabrials-{ui,ai-ui}-<version>
bun run vendor radiant --check   # fails if the copy differs from the build
```

**As a registry.** Any shadcn app installs from ui.fabrials.com:

```sh
npx shadcn@latest init https://ui.fabrials.com/r/init.json
npx shadcn@latest add @fabrials/mcp-dashboard @fabrials/button @fabrials/select
```

The registry has Fabrials components and **shims** (shadcn primitives backed by `@fabrials/ui`). It does not republish other libraries: a component a product needs from one is adopted into the packages in the Fabrials style. See [docs/registry.md](docs/registry.md).

## Develop

Bun manages dependencies; Node 26 builds. Container browser tests need Linux and Docker.

```sh
bun install --frozen-lockfile
bun run check                  # types, lint, unit tests, package build, site checks and tests
bun run storybook              # http://127.0.0.1:6041
bun run dev:site               # http://127.0.0.1:3210
bun run test:visual:container  # visual and accessibility suite
bun run registry:build         # regenerate the shims and public/r
```

`bun run build:site` builds the packages and the site. The site's Docker image builds from the repository root: `docker build -f Dockerfile.site .`.

## Who consumes which version

Read on 2026-11-10 from each product's deployed branch. Nobody is on 0.10 or later yet.

| Product | Version | How |
| --- | --- | --- |
| ui.fabrials.com (this repository) | workspace | workspace |
| fabrials.com, X Tracker, Aion Companion | 0.9.0 | vendored copy |
| AI Relay dashboard, Palanaeum, Wyndle | 0.9.0 | npm |
| admin.fabrials.com, Radiant, Open Email | 0.8.2 | vendored copy |
| Ditox | 0.8.2 | vendored copy |
| Spanreed desktop | 0.8.2 on `dev`; the last release (`master`) still carries 0.4.0 | vendored copy |

Upgrading a product is that product's decision. Read the migration notes from its version up: [0.9](docs/migration-0.9.md) (lists the hosts that must change a line), [0.10](docs/migration-0.10.md), [0.11](docs/migration-0.11.md) and [0.12](docs/migration-0.12.md); 0.12 is additive. What products have asked of the library, and what they can delete once they upgrade, is in [docs/requests.md](docs/requests.md).

## Licenses

Fabrials UI is MIT. IBM Plex is under the SIL Open Font License. Code and recipes adapted from other projects keep their notices; see [THIRD_PARTY.md](THIRD_PARTY.md) and [docs/provenance.md](docs/provenance.md).
