# Fabrials UI

Local 0.4 "Stormlight" adoption for a shared operational interface across Fabrials products.

- `packages/ui`: generic presentation primitives, patterns, tokens and fonts.
- `packages/ai-ui`: provider, quota, history and migration presentation.
- `stories`: synthetic component and workflow examples.
- `skills/fabrials-design-system`: maintained Codex skill linked on this host.

Read [DESIGN.md](DESIGN.md) before extending the public surface. Read the
[migration guide](docs/migration-0.4.md) before updating a consumer.

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

AI Relay and the Spanreed desktop consume the paired `fabrials-{ui,ai-ui}-0.4.0`
copies. Open Email, Grok Insider, fabrials.com, ui.fabrials.com, Radiant, admin
and Ditox consume the generic package only.
`bun run vendor open-email --write` writes `open-email/vendor` in the standalone
repository and `open-email/apps/web/vendor` when the enterprise layout is present.
See [docs/migration-0.4.md](docs/migration-0.4.md). The 0.3 delivery record remains
at [docs/delivery-0.3.md](docs/delivery-0.3.md).
