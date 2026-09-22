# 0.2 pilot delivery — 2026-09-15

## Delivered

The library is split into generic `@fabrials/ui` and AI-specific
`@fabrials/ai-ui`, with named ESM exports, declaration files, CSS entry points,
local fonts and preserved licenses. Framework, navigation, request and native
window policy remain in the consuming products. Architecture tests enforce the
generic package's dependency boundary.

Storybook includes controls, overlays, collection states and a synthetic
Accounts composition. Semantic tokens cover light/dark, typography, spacing,
density, focus and reduced motion. The catalogue's example table is not a claim
that AI Relay's actual account cards have been replaced with a table.

AI Relay consumes generated 0.2 distributions. Its actual shell uses the generic
workspace pattern; Accounts gains a collection toolbar, combined search and
provider/attention filters, recoverable empty states and subscription linking
in a sheet. Existing provider authorization, quota, probe and removal flows are
retained. Repeated reauthorization actions were consolidated and low-contrast
error text corrected. Local sidebar, cards and some established dialogs remain
host components; this is not a completed migration of every page primitive.

The distribution script builds versioned directories, checks SHA-256 manifests,
refuses altered vendors, stages replacements and preserves rollback copies.
Consumer checks also verify their generated distributions. Original 0.1 vendor
directories in both products remain untouched.

`fabrials-design-system` is linked into the host's shared and Codex skill
directories and passes the skill validator. It refers to the maintained design
document instead of duplicating the specification. Existing supporting design
skills were retained. Start a new Codex turn/session to discover the new skill.

## Verification

- Library: typecheck, lint, 14 unit/domain tests and package builds.
- Storybook: production build, 23 browser tests, 18 screenshot references,
  light/dark at 390/768/1440, axe checks, keyboard and 200% text.
- AI Relay: vendor verification, 12 frontend unit tests, typecheck, lint and
  static export; 10 pilot browser tests and 6 screenshot references.
- Rust: build and 316 passing tests with `contracts`; 18 explicitly ignored
  integration tests were not run. Local Cargo overrides selected the checked-in
  vendor crates because the parent workspace's path patches otherwise collide.
  No Cargo lockfile or global configuration was changed.
- Headed catalogue inspection: real Chrome via CDP on initially empty Hyprland
  workspace 5; window 2560×1406, content viewport 2560×1315, both themes. Other
  work windows were not moved. Syl's MCP lacked the Hyprland environment, so
  compositor inspection/workspace control used the working host IPC instead.

AI Relay screenshots are generated from its actual static export served by the
Rust binary, with a local fixture session and synthetic dashboard responses.
No real provider account, remote credential or production database is involved.
The fixture exercises UI requests but is not an end-to-end live OAuth test.

CI workflows now include the same browser runners and artifact capture. They
have been added locally, not executed on GitHub: nothing was committed or pushed.
Storybook's production bundle reports client-directive warnings from React
libraries and a development-tool chunk-size warning; its build succeeds.

## Acceptance gate and remaining rollout

Visual approval of the actual AI Relay pilot is still pending. Review the host
screenshots under `frontend/tests/pilot/accounts.spec.ts-snapshots/`, not only
the catalogue examples. Then migrate the remaining AI Relay surfaces, Spanreed
with its native window integration, and Open Mail with its mail-specific panes
as separately tested deliveries. Neither Spanreed nor Open Mail was modified.

Live provider authorization, real-account mutations, production deployment and
package publication remain outside this delivery. No commit, push, deploy,
credential rotation or database migration was performed.
