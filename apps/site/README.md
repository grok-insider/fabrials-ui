# ui.fabrials.com

The documentation site, playground and shadcn registry of Fabrials UI. It lives in the Fabrials UI repository and builds against the workspace packages.

```sh
bun run dev                 # http://127.0.0.1:3210
bun run check && bun run test
bun run registry:build      # public/r, registry.json, llms.txt
bun run registry:sync       # re-snapshot third-party libraries (network, GITHUB_TOKEN recommended)
```

From the repository root, `bun run build:site` builds the packages and the site, and `docker build -f Dockerfile.site .` builds the production image. Health: `/api/health`.

Install from the registry:

```sh
npx shadcn@latest init https://ui.fabrials.com/r/init.json
npx shadcn@latest add @fabrials/mcp-dashboard
```

WebMCP support is experimental; the UI works without it and simulators are labelled. MCP target 2026-07-28 with the official SDK v2; legacy 2025-11-25 is a separate tested path. No user data is persisted by the demos.

MIT. Components from other libraries keep their own licenses, printed at the top of every file and listed at `/libraries`.
