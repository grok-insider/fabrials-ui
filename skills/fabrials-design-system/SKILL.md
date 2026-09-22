---
name: fabrials-design-system
description: Develop or review Fabrials product interfaces using the shared @fabrials/ui design system. Use for UI components, styling and interaction patterns in Fabrials products; not for backend-only work or an unrelated product redesign.
---

# Fabrials design system

Use the maintained Fabrials foundation instead of choosing a new visual style per product. Explicit user choices and the requested scope take precedence.

Resolve this skill's symlink to locate the source repository, two directories above this folder. Read its `DESIGN.md` before UI work. Read `docs/migration-0.2.md` when adopting or upgrading packages. Component source and Storybook stories in that repository are the implementation reference; do not duplicate the token specification here.

Before changing a product, read its own AGENTS.md and DESIGN.md. Confirm its installed package version: a product still using 0.1 is not permission to migrate it. Reuse its existing accessible behavior until the scoped migration has tests.

Use shared tokens and generic components from `@fabrials/ui`. Provider, quota and migration presentation belongs in `@fabrials/ai-ui`. Routing, requests, authentication, theme storage and native window integration belong to host adapters. Change canonical source, build it, and use the verified distribution script; never patch vendor copies.

The style is neutral and operational, with Plex typography and semantic state colors. Apply `shadcn-ui` for component work and the Scandinavian/UX skills as supporting guidance only when useful; their generic defaults must not override the maintained brand or reduce task density.

For a requested visual change, compare the actual affected flow in both themes and at desktop/mobile sizes. Use browser-automation and chrome-devtools for local/browser verification; use the host's syl workflow when testing native integration. Keep previews and test data synthetic. Report untested states honestly. Approval to style a screen does not authorize account mutations, publication or deployment.

For headed visual tests on the user's Hyprland host, first inspect workspaces and reserve one without windows so the test window has enough space. Do not move existing work windows. Restore the previous workspace after closing agent-owned test windows, unless the user has switched elsewhere. Automated browser tests remain isolated from the host desktop.
