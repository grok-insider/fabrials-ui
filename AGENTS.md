# AGENTS.md: Fabrials UI

The Fabrials design system and ui.fabrials.com. Independent git repository; `master` is the default branch. Git identity: Grok Insider <admin@grokinsider.net>.

## Before you change anything

- Read `DESIGN.md`. It is the brief for every visible change; a product's own `DESIGN.md` wins for that product.
- Commit only; publishing to npm, pushing and deploying need the owner's explicit go-ahead.
- Stories, docs, previews and tests use synthetic data only.

## Layout

- `packages/ui`, `packages/ai-ui`: the packages. Change them here, build with `bun run build`, and hand products a verified copy with `bun run vendor <product> --write`. Never edit a product's `vendor/` copy.
- `apps/site`: ui.fabrials.com (Next.js, Tailwind 4, fumadocs). Docs and demos import registry sources directly; never duplicate a component.
- `apps/site/registry`: Fabrials blocks (`components`, `webmcp`, `mcp`, `server`), generated shims, and third-party snapshots under `external/`. See `docs/registry.md`.
- `skills/fabrials-design-system`: the agent skill (`SKILL.md` and `references/`). Agents' skill folders link to it by that name, so keep the folder where it is.

## Rules

- React 19 and Base UI. Keep keyboard operation, visible focus and human use without WebMCP.
- A new public export needs a story, a keyboard test and a visual reference; use shadcn's name for a part when shadcn has one (that is what lets a shim cover it). Bump the version and write the migration note when a public contract changes.
- Generated files are never edited by hand: `public/r`, `public/registry.json`, `public/llms.txt`, `registry/shims/*.tsx`, `components/ui/*` (except `calendar.tsx`), `components/external/**`, `app/external.css`, `lib/*.generated.ts`. Regenerate with `bun run registry:build`; tests fail when they are stale.
- Third-party components come in only through `upstreams/*.json` and `bun run registry:sync`, which enforces the license gate. Do not copy their code by hand, do not weaken the gate, and keep the license notice that follows the imports of every file.
- MCP target 2026-07-28 with the official SDK v2; keep legacy compatibility isolated and never replay tool mutations silently. Browser tokens are memory-only; never log credentials, arguments or tool results on the server. The Node connector uses operator-configured destinations and never becomes an open proxy.

## UI work

- Read `DESIGN.md`, then use the `fabrials-design-system` skill: its `references/` hold the layout recipes, which component to use, the style rules as checks and the QA checklist. `DESIGN.md` wins over the skill; report a conflict instead of working around it.
- Nothing is centred on the page: headers span the window, content anchors to `--fui-page-padding` with a reading max-width, and wide screens keep the free space on the right. No `margin-inline: auto` page columns.
- Landings are left-aligned: headline and one action on the left, `DitherScene` on the right. Lists of products or features are index rows (mark, name, one line, link), not grids of identical cards.
- Product screens compose `PageHeader`, `CollectionToolbar`, `Table`, `BulkActions` and `StatePanel` in `WorkspaceShell` or the `Sidebar`. Records are rows; one panel with hairlines, never cards inside cards.
- Stormlight is the only interaction colour; primary buttons are ink; a gem signs its product's mark and nothing else. Tokens only, no literal colours.
- Crisp and quiet: radii 3/4/5/6/8 px, badges are 3 px tags (no pill clutter), sentence case with no uppercase eyebrows, no `→` appended to buttons or links, no gradients or glow.
- Motion answers a person: at most one `reveal` per page, continuous motion only for loading, all of it off under reduced motion.
- Design both themes and every state: first-load skeletons, empty with a next action, error with a fix, stale said as stale, long content, 390 px.
- Examples: `stories/highstorm.stories.tsx` (landing, sign-in), `apps/site/app/page.tsx`, the docs frame in `apps/site/components/docs/`, `stories/patterns.stories.tsx` › Console, `stories/generic-patterns.stories.tsx`, and the component demos in `apps/site/components/ui-demos*.tsx`. `stories/catalogue.css` and the PublicSite story predate the 0.7 layout rules: take component usage from them, not page layout.
- Verify with `bun run check` and `bun run test:visual:container` (light and dark at 390, 768 and 1440 px, with axe), then look at 2560 x 1315 in an isolated headless browser. Never emulate a viewport in the owner's desktop browser window.

## Checks

```sh
bun install --frozen-lockfile
bun run check                  # packages and site: types, lint, tests, builds
bun run test:visual:container  # Playwright and axe in the pinned container
docker build -f Dockerfile.site .
nix run nixpkgs#gitleaks -- git --config .gitleaks.toml .   # before making history public
```

Bun 1.4.2 manages dependencies with the frozen `bun.lock`; Node 22 builds and serves Next.js. The site deploys through Coolify from `Dockerfile.site` with the repository root as the build context; secrets live only in Coolify.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
