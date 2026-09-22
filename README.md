# Fabrials UI

Local 0.3 adoption for a shared operational interface across Fabrials products.

- `packages/ui`: generic presentation primitives, patterns, tokens and fonts.
- `packages/ai-ui`: provider, quota, history and migration presentation.
- `stories`: synthetic component and workflow examples.
- `skills/fabrials-design-system`: maintained Codex skill linked on this host.

Read [DESIGN.md](DESIGN.md) before extending the public surface. Read the
[migration guide](docs/migration-0.3.md) before updating a consumer.

```sh
bun install --frozen-lockfile
bun run check
bun run storybook
bun run test:visual:container
bun run vendor ai-relay --check
```

Node 22 builds the packages; Bun manages dependencies. Container browser tests
require Linux and Docker. `bun run vendor ai-relay --write` explicitly generates
the consumer distributions; it does not publish, commit or deploy anything.

AI Relay, enterprise Open Mail, the Spanreed desktop, Radiant, fabrials.com
product routes, and admin consume generated 0.3 copies. ui.fabrials.com imports
the shared font and tokens only.
`bun run vendor open-email --write` distributes only the generic package to
`apps/web/vendor`, without introducing AI-domain dependencies into mail.
See the [delivery record](docs/delivery-0.3.md) for the 2026-09-15 verification.
