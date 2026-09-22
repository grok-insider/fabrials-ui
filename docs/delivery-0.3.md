# Local 0.3 delivery — 2026-09-15

## Implemented

The shared package now supplies the generic form, card, alert, table, combobox,
dialog, sheet and state patterns needed by AI Relay and enterprise Open Mail.
Server-only styling imports are separated from client components. Both theme
selectors, density, local Plex typography and product-owned state are preserved.

AI Relay adopts shared primitives across dashboard, administration, history,
migration, settings and public access surfaces. Compact provider grouping and
the single Add account menu remain intact. Obsolete local primitive copies were
removed; sidebar control, toast integration and a thin progress adapter remain
host-owned. Verification also fixed invitation-alert contrast, a decorated
sidebar resize rail and the missing protected static route classification for
`/admin/users` and `/admin/invites`, including their RSC assets. The route tests
require HTTP 200 and the actual dashboard, not merely a visible heading.

Open Mail adopts the generic package across `apps/web`, including mail,
contacts, advanced tools, preferences, assistant and offline surfaces. Thin
wrappers preserve translations, refs, events and controller contracts. IME
Escape and focus handoff from navigation to composition are verified. The
legacy root application and Spanreed were not migrated.

## Verification completed

| Surface | Result |
| --- | --- |
| Shared library | Types, lint, build, 18 unit checks, Storybook build |
| Shared browser catalogue | 30 passing checks; native forms, overlays, themes, three widths, axe, reduced motion and 200% text |
| AI Relay frontend | Types, lint, 15 unit checks, static export |
| AI Relay browser | 36 passing checks through an isolated Rust server; routes, account flows, key-policy request boundary, keyboard and axe |
| AI Relay Rust | 317 passing, 18 intentionally ignored; locked build passes |
| Open Mail | Types, lint, architecture and generated API-client checks; 1,694 passing unit/domain checks, 195 integration-dependent skips |
| Open Mail isolated integration | 608 adapter checks, 64 Node HTTP checks and 7 Node worker checks passing |
| Open Mail browser | 19 passing checks; Spanish/English, three widths, themes/density, account navigation, tools, composition, consent, IME and 200% text |
| Open Mail builds | Enterprise and legacy Next builds, Storybook and standalone web Docker image |
| Disposable Stalwart | API, synthetic self-send, shared access, offline and assistant contracts passing |

All final browser runs passed without updating reference images. Reference
screenshots were visually reviewed. Headed Open Mail QA used an owned Chrome
window on an otherwise empty Hyprland workspace, with CDP and no movement of
existing user windows. Dark Reader was detected in the daily profile; its
injected styles were disabled only in the owned test document for the final
light-theme capture, without changing extension settings. Its desktop Lighthouse snapshot scored 100 for
accessibility, best practices and SEO. This snapshot is not a performance or
full application accessibility certification.

Consumer integrity checks pass against the canonical build. Open Mail's
standalone image serves the offline document, CSS and local font successfully;
health checking succeeds. Builds do not require the canonical sibling checkout.

## Limits and operational notes

- No npm publication, commit, push or deployment was performed. Production
  OAuth, provider credentials and real mailboxes were not used for UI QA.
- The existing Rust ignored cases and Bun integration-dependent skips are not
  claimed as passes. Separate disposable integration commands cover their
  selected contracts, not every possible production scenario.
- This host's parent Cargo configuration patches sibling crates. Rust commands
  used explicit CLI path overrides for AI Relay's eight vendored Fabrials crates;
  no parent configuration was changed. Full `cargo fmt --check` reports an
  unrelated pre-existing formatting difference in `src/proxy.rs`; the changed
  `src/adapters/ui.rs` passes its formatting check.
- NixOS Open Mail integration/domain checks used the existing project shell for
  PostgreSQL and Sharp's shared libraries. Production HTTP checks ran on Node 22.
- Axe's narrow Base UI focus-sentinel exception and real keyboard verification
  are documented in each consumer. Application controls and contrast are not
  excluded.
- The Syl real-desktop session lacked the host display signature; headed review
  used the working Hyprland/CDP route, not an asserted Syl capture.
- The migration and consumer guides document regeneration and coordinated
  rollback. Older distributions remain available; backend persistence is not
  migrated by this delivery.
