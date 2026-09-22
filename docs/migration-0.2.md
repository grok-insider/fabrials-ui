# Adopting the 0.2 pilot

## Package boundary

0.1 mixed generic chrome and AI domain components. 0.2 exports generic controls and patterns from `@fabrials/ui`, and existing AI components/types from `@fabrials/ai-ui`. Move provider, quota, consumption, history and migration imports to the latter. Import its stylesheet separately. No backend DTO is redesigned by this migration; the hosted-tools field already present in AI Relay is retained.

The old WorkspaceShell signature is intentionally not carried over. Its replacement takes `navigation`, `header`, `children`, optional `contentId` and `skipLabel`. The host supplies links and platform chrome. Spanreed's legacy vendored package remains unchanged until its own migration, so its brand/window slots and drag regions are preserved.

## Distribution

Run `bun install --frozen-lockfile`, then `bun run check` at the design-system repository root. `bun run vendor ai-relay --write` generates versioned directories alongside the old vendor package. `bun run vendor ai-relay --check` verifies file hashes and compares the installed build with the canonical build. The same interface supports `spanreed`, but that rollout follows pilot approval.

Point consumers to `file:vendor/fabrials-ui-0.2.0` and `file:vendor/fabrials-ai-ui-0.2.0`. Install dependencies and rerun host checks. Versioned folders preserve the previous distribution for rollback. The script refuses to overwrite a locally modified generated package; reconcile intended changes at source first. The package is a local unreleased pilot, not a published npm release.

Install both packages at the same version: `@fabrials/ai-ui` declares the generic
package as a required peer to share one component instance. AI Relay pins the
local UI resolution with a Bun override. After regenerating this unreleased
version, run `bun update @fabrials/ui @fabrials/ai-ui` in the consumer so Bun
refreshes local package metadata; plain install can retain old dependencies.
Released updates must use a new version instead of rewriting an existing one.
AI Relay's `check:vendor` verifies both generated manifests before its normal
checks. It detects accidental modifications; it is not a signed supply-chain
attestation. The canonical vendor check also compares metadata and build output.

Import `@fabrials/ui/tokens.css`, optionally `@fabrials/ui/fonts.css`, and `@fabrials/ui/styles.css` once at the host style entry. Keep existing local fonts if they already load Plex correctly. AI consumers also import `@fabrials/ai-ui/styles.css`; its legacy `fb-` rules remain for unchanged AI domain views. Generic styles use `fui-` and do not reset body styles.

## Rollout and rollback

The first acceptance surface is AI Relay's shell and Accounts. Keep existing routes, API requests and permission gates. Do not migrate the rest of its local shadcn components merely to change imports. Spanreed and Open Mail are subsequent deliveries after visual acceptance.

Rollback a product by restoring its previous package dependency paths, lockfile and matching host source changes together. Leave other consumers and backend state unchanged. No database migration, credential change or deployment is required by the package split.

## Verification

Run `bun run test:visual:container` on Linux with Docker available after building
the packages. It uses a digest-pinned Playwright image, starts Storybook on
localhost:6041 if needed and stops only the server it started. Existing preview
servers are preserved. Use `--update-snapshots=all` only for intentional changes;
review references and rerun without updating them. Browser assets and fonts
remain local. CI runs the same image and retains failure artifacts.

In AI Relay, build the Rust binary with `cargo build --locked`, run the frontend
checks, then `bun run test:pilot` in `frontend/`. Port 18738 must be free. This
runner starts a separate desktop relay with an empty temporary account store,
no production environment and a random signing secret. It issues a short-lived
fixture session for that instance, serves the actual static export and supplies
synthetic dashboard responses. Unexpected API mutations and external requests
are blocked. Runtime files and the server are removed afterward. This verifies
the UI integration, not live OAuth, real provider keys or production deployment.
Rust tests remain responsible for session, authorization and CSRF contracts.
