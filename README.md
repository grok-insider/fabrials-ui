# Fabrials UI

The Fabrials design system, 0.9, the "Highstorm" line: the interface every Fabrials product shares, and the shadcn registry at [ui.fabrials.com](https://ui.fabrials.com) that lets any React app use it.

Read [DESIGN.md](DESIGN.md) before changing anything visible.

## What is here

| Path | What it is |
| --- | --- |
| `packages/ui` | `@fabrials/ui`: tokens, IBM Plex, controls, patterns, charts and the dithered brand pieces |
| `packages/ai-ui` | `@fabrials/ai-ui`: provider, quota, history and chat presentation |
| `apps/site` | ui.fabrials.com: the documentation, the playground and the registry |
| `apps/site/registry` | Registry sources: Fabrials blocks, shims, and the snapshots of other libraries |
| `apps/site/upstreams` | Which third-party components to aggregate, one manifest per library |
| `stories` | Storybook stories, all with synthetic data |
| `tests` | Unit tests and the visual suite (Playwright in a container, with axe) |
| `skills/fabrials-design-system` | The agent skill that points at this repository |

## Two ways to use it

**As packages.** Fabrials products import `@fabrials/ui` and `@fabrials/ai-ui` from a verified copy in their `vendor/` folder:

```sh
bun run vendor radiant --write   # writes radiant/vendor/fabrials-{ui,ai-ui}-<version>
bun run vendor radiant --check   # fails if the copy differs from the build
```

**As a registry.** Any shadcn app installs from ui.fabrials.com:

```sh
npx shadcn@latest init https://ui.fabrials.com/r/init.json
npx shadcn@latest add @fabrials/mcp-dashboard @fabrials/button @fabrials/kibo-kanban
```

The registry has Fabrials components, **shims** (shadcn primitives backed by `@fabrials/ui`) and **components from other libraries** that passed the license gate. See [docs/registry.md](docs/registry.md).

## Develop

Bun manages dependencies; Node 22 builds. Container browser tests need Linux and Docker.

```sh
bun install --frozen-lockfile
bun run check                  # types, lint, unit tests, package build, site checks and tests
bun run storybook              # http://127.0.0.1:6041
bun run dev:site               # http://127.0.0.1:3210
bun run test:visual:container  # visual and accessibility suite
bun run registry:build         # regenerate shims, external previews and public/r
bun run registry:sync          # re-snapshot the third-party libraries (network)
```

`bun run build:site` builds the packages and the site. The site's Docker image builds from the repository root: `docker build -f Dockerfile.site .`.

## Who consumes which version

| Product | Version |
| --- | --- |
| ui.fabrials.com (this repository) | workspace |
| fabrials.com, admin.fabrials.com, X Tracker, Radiant, AI Relay, Open Email, Spanreed desktop, Ditox | 0.8.2 |

Upgrading a product is that product's decision; read [docs/migration-0.9.md](docs/migration-0.9.md) first (it lists the hosts that must change a line), then [0.8](docs/migration-0.8.md) and 0.7 if the product is older. The 0.3 delivery record is [docs/delivery-0.3.md](docs/delivery-0.3.md).

## Licenses

Fabrials UI is MIT. IBM Plex is under the SIL Open Font License. Components copied from other projects keep their licenses; see [THIRD_PARTY.md](THIRD_PARTY.md) and [docs/provenance.md](docs/provenance.md).
