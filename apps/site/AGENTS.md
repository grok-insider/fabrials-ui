# Fabrials WebMCP UI

Public MIT shadcn registry and documentation at https://ui.fabrials.com.
Independent repository; master is the default branch. Git identity: Grok Insider <admin@grokinsider.net>.

- Registry source in registry/. Docs and demos must import that source, never duplicate components.
- React 19, TypeScript, Tailwind 4, shadcn Base UI. Preserve keyboard operation and human interaction without WebMCP.
- Protocol target: MCP 2026-07-28. Keep legacy compatibility isolated. Never silently replay tool mutations.
- Browser tokens are memory-only. Never log credentials, arguments, or tool results server-side.
- Node connector is optional and uses operator-configured destinations; never expose an arbitrary public proxy.
- Run bun run check and bun run test, build the registry/site, and smoke-test the published registry before shipping.
- Use Bun 1.4.2 with the frozen bun.lock for dependencies and scripts. Build/start Next.js with Node. Deploy via Coolify API/UI; secrets only in Coolify.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
