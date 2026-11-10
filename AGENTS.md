# AGENTS.md: Fabrials UI

The Fabrials design system and ui.fabrials.com. Independent git repository; `master` is the default branch. Git identity: Grok Insider <admin@grokinsider.net>, commits signed.

## Before you change anything

- **Work from `master`.** Run `git fetch` and `git status -sb` first. A checkout behind `origin/master` gives you old rules, an old skill and old components; the skill that agents load is a link into `libs/fabrials-ui`, so that checkout stays on `master`. Do a task in its own worktree (`git worktree add -b <branch> ../../.worktrees/fabrials-ui-<task> origin/master`), never on a branch someone else left behind.
- Read `DESIGN.md`. It is the brief for every visible change; a product's own `DESIGN.md` wins for that product.
- Commit only; publishing to npm, pushing and deploying need the owner's explicit go-ahead.
- Stories, docs, previews and tests use synthetic data only.

## Layout

- `packages/ui`, `packages/ai-ui`: the packages. Change them here and build with `bun run build`. Products take them from npm or from a verified copy made by `bun run vendor <product> --write`; never edit a product's `vendor/` copy.
- `apps/site`: ui.fabrials.com (Next.js, Tailwind 4, fumadocs) and the registry. Its own rules are in `apps/site/AGENTS.md`.
- `stories`, `tests/unit`, `tests/visual`: Storybook, unit tests, and the Playwright suite that photographs the `Tests/*` stories and drives components by keyboard.
- `skills/fabrials-design-system`: the agent skill (`SKILL.md` and `references/`). Agents' skill folders link to it by that name, so keep the folder where it is.
- `docs/`: one migration note per version (`migration-<version>.md`), `registry.md`, `requests.md` (what products have asked of the library), and the plan of the release in progress when there is one.

## Rules

- React 19 and Base UI. Keep keyboard operation, visible focus and human use without WebMCP.
- A new public export needs a story, a keyboard test and a visual reference; use shadcn's name for a part when shadcn has one (that is what lets a shim cover it). Bump the version and write the migration note when a public contract changes.
- Generated files are never edited by hand: `public/r`, `public/registry.json`, `public/llms.txt`, `registry/shims/*.tsx`, `components/ui/*`, `lib/*.generated.ts`. Regenerate with `bun run registry:build`; tests fail when they are stale.
- The registry publishes only Fabrials components and shims, never another library's components. When a product needs a component another library offers, adopt it: rewrite it into the packages in the Fabrials style, with a story, a keyboard test and a visual reference. Code or recipes adapted from a permissively licensed project (MIT, Apache-2.0, ISC, BSD) keep their copyright and license notice beside the adapted code and a row in `THIRD_PARTY.md`; nothing under extra terms (Commons Clause and the like) is adapted, only learnt from.
- A product's own component that is better than ours is a request, not a fork: write it down in `docs/requests.md`, then bring its behaviour into the packages in the house look. The product deletes its copy when it takes the release.
- MCP target 2026-07-28 with the official SDK v2; keep legacy compatibility isolated and never replay tool mutations silently. Browser tokens are memory-only; never log credentials, arguments or tool results on the server. The Node connector uses operator-configured destinations and never becomes an open proxy.

## Adding or changing a component

A piece is done when all of this is true. Recent complete examples to copy from: `scroll-area`, `progress`, `filter-chip` (in `packages/ui/src`, `stories/components`, `tests/unit`, `tests/visual`).

1. **Source.** One module in `packages/ui/src` (generic presentation) or `packages/ai-ui/src` (chat, agents, providers). Named exports, appended to the package index. `"use client"` only in a module that uses hooks, handlers or browser APIs; pure helpers live in a module without it, so a Server Component can call them. `render` for polymorphism, `...props` and `className` on the root. No new dependency without the owner.
2. **Words.** Every visible or spoken string is a prop with an English default (`labels` for several, `*Label` for one); counts go through `Intl.PluralRules`; no fixed heading level.
3. **Styles.** `fui-` classes in the `components` layer of a part in `packages/<package>/src/styles/`, listed in that folder's `order.json`; a new block is a part of its own, at the end of the order. Tokens only, logical properties only, every animation inside `prefers-reduced-motion: no-preference`, a forced-colors form for every state that is otherwise a fill or a shadow, 44 px targets on coarse pointers, hover styles under `(hover: hover)`.
4. **Unit test** in `tests/unit`: markup, the rules the piece relies on, and its pure logic.
5. **Stories.** A `Tests/*` bench with every state side by side, fixed data and an RTL frame; for a main component also a page in `stories/components` or `stories/agents` (Overview and Playground).
6. **Spec** in `tests/visual`: six references of the bench (light and dark at 390, 768 and 1440 px, with axe) and the behaviour by keyboard and pointer, asserting state and geometry. Run it, and look at the pictures.
7. **Docs.** A catalogue entry with a demo, an example set for a main component (`apps/site/AGENTS.md`), a row in `skills/fabrials-design-system/references/components.md`, a line in `DESIGN.md` › Components, and a section in the version's migration note.

## UI work

- Read `DESIGN.md`, then use the `fabrials-design-system` skill: its `references/` hold the layout recipes, which component to use, the style rules as checks and the QA checklist. `DESIGN.md` wins over the skill; report a conflict instead of working around it.
- The rules agents break most:
  - Nothing is centred on the page; content anchors to `--fui-page-padding` and wide screens keep the free space on the right.
  - Lists of products or features are index rows, not grids of identical cards; never a plate inside a plate.
  - Stormlight is the only interaction colour; primary buttons are ink; a gem signs its product's mark and nothing else. Tokens only.
  - Radii 4/6/8/10/12/16 px, states as tints, sentence case, no uppercase eyebrows, no `→` on buttons or links, no gradient or glow except the working light while something works.
  - Motion answers a person, the data or an agent; continuous motion only for loading and an agent at work; all of it off under reduced motion.
  - Both themes and every state: first-load skeletons, empty with a next action, error with a fix, stale said as stale, long content, 390 px.
- Reference screens: `stories/instrument.stories.tsx` (landing, product overview), `stories/highstorm.stories.tsx` (sign-in), `stories/patterns.stories.tsx` (PublicSite, Settings, Console), `stories/generic-patterns.stories.tsx`, `apps/site/app/page.tsx`, and the docs frame in `apps/site/components/docs/`.
- Verify with `bun run check` and `bun run test:visual:container`, then look at 2560 x 1315 in an isolated headless browser. Never emulate a viewport in the owner's desktop browser window.

## Checks

```sh
bun install --frozen-lockfile
bun run check                  # packages and site: types, lint, tests, builds (about a minute)
bun run test:visual:container  # Playwright and axe in the pinned container (about 30 minutes; pass a spec path for one)
bun run test:loading:container # skeleton suite: every docs preview in Loading, three engines (about an hour)
docker build -f Dockerfile.site .
nix run nixpkgs#gitleaks -- git --config .gitleaks.toml .   # before making history public
```

Bun 1.4.4 manages dependencies with the frozen `bun.lock`; Node 26 builds and serves Next.js. The site deploys through Coolify from `Dockerfile.site` with the repository root as the build context; secrets live only in Coolify.

- `STORYBOOK_PORT` picks the Storybook the visual suite starts or reuses (default 6041). Two worktrees need two ports; the suite trusts whatever answers on its port.
- Storybook reads `@fabrials/ui/fonts.css` from `packages/ui/dist`. In a fresh worktree run `bun run build` (or `bun run check`) before the visual suite, or every test fails with "Failed to load the Storybook preview file".
- The visual suite and the skeleton suite both write `test-results`: never run them at the same time in one checkout.
- A reference changes only on purpose: regenerate with `--update-snapshots` for the spec you changed, look at the new picture, and say in the commit why it changed.
- CI type-checks before it builds. A stale `dist` hides a missing path in `tsconfig.json`, so before a release run `bun install --frozen-lockfile && bun run check` in a clean worktree.
- Stop a server by its PID. `pkill -f` with a pattern that appears in your own command kills your shell.

## Releasing

Only with the owner's go-ahead, and in this order:

1. The version in `package.json`, `packages/ui/package.json` and `packages/ai-ui/package.json` (ai-ui pins `@fabrials/ui` to exactly the same version), `docs/migration-<version>.md`, `DESIGN.md`, the skill and `README.md` up to date, `bun run registry:build`.
2. `bun run check`, the visual suite, the skeleton suite and gitleaks, on the commit to be tagged.
3. Fast-forward `master` and push it; the checks run on GitHub.
4. Push a signed tag `v<version>`. `publish.yml` publishes both packages to npm by trusted publishing (no token anywhere). The tag must match the package version.
5. The site deploys from `master` through Coolify. Its registry entries install `@fabrials/ui@^<version>`, so the packages must be on npm before the site that names them is live: if the tag and the push go out together, check npm before telling anyone to install.

Upgrading a product is that product's decision and its own change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
