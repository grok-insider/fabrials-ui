# AGENTS.md: ui.fabrials.com

This app is part of the Fabrials UI repository; the rules are in the root `AGENTS.md` and `DESIGN.md`. The registry is described in `docs/registry.md`. What follows is only about the site.

## Where a docs page comes from

- **The catalogue** is `lib/ui-catalog.ts` (the packages) and `lib/catalog.ts` (registry blocks): one entry per page with its slug, group, description, the exports it documents and notes. A public component that is on no entry has no docs page.
- **A demo** in `components/ui-demos*.tsx` is the preview of a page and its own source: `bun run registry:build` reads it, with its imports and helpers, into `lib/demo-code.generated.ts`, and every snippet must compile on its own. Docs and demos import the packages and the registry sources directly; never duplicate a component.
- **Usage examples** live once, in `components/examples` (a demo and its code per way of using a component, packages only, no Tailwind), listed in `lib/example-slugs.ts`. The docs pages show them under Examples, and Storybook's Components and Agents pages show the same sets under Overview. A main component gets an example set and a `stories/components` or `stories/agents` page (Overview and a Playground with controls). An example set's preview brings its `previewCode` (Prettier, print width 80).
- Every docs preview shows the code that makes it under Code. Preview stages are plain: no pattern behind a component.
- A preview shows a control at the width it is used at, centred on the stage: wrap the demo in `Frame` (`components/demo-frame.tsx`) with `width` `field` (24rem), `form` (32rem), `wide` (42rem) or `fit`, or `inline` for a row. Only wide pieces (tables, charts, shells, headers) take the whole stage; a field never stretches across it. The generator writes the same width into the code.
- A demo that shows a time, a date or a number renders the same on the server and in the reader's browser: fix the day, pass a `locale`, or use `LocalTime`. A demo that differs between the two fails hydration in a browser in another language.

## Generated files

Never edited by hand: `public/r`, `public/registry.json`, `public/llms.txt`, `registry/shims/*.tsx`, `components/ui/*`, `lib/*.generated.ts`. Regenerate with `bun run registry:build` from the repository root; `tests/registry.test.ts` fails when they are stale.

## Checks

```sh
bun run check:site             # from the root: types, lint and the site's tests
bun run dev:site               # http://127.0.0.1:3210
bun run test:loading:container # from the root: every docs preview inside Loading, three engines
```

The skeleton suite builds the site and serves it on `LOADING_PORT` (default 3211). It shares `test-results` with the visual suite.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
