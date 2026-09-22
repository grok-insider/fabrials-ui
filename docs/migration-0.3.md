# Adopting Fabrials UI 0.3

The 0.3 delivery covers the AI Relay UI and enterprise Open Mail. Spanreed
still vendors 0.1. Radiant, the fabrials.com product routes, and admin are not
on this package yet. This adoption does not change backend contracts, publish
to npm, or deploy applications.

## Ownership

`@fabrials/ui` owns generic controls, tokens, typography, accessibility behavior
and presentation patterns. `@fabrials/ai-ui` owns AI-domain presentation only.
Hosts own permissions, queries, mutations, routing, persistence and consent.
Open Mail depends only on the generic package.

New reusable surfaces include native select and checkbox controls, card and
table parts, alerts, combobox parts, directional sheets, confirmation actions,
localized region labels and configurable empty-state headings/icons. Native
controls retain form names, refs, disabled states and change events. Base UI
controls retain their own controlled-value and focus contracts; do not assume
Radix `asChild` or Radix event signatures. Triggers use `render` composition.

Server components that only need button classes import `buttonVariants` from
`@fabrials/ui/button-variants`. That entry is server-safe; the interactive root
entry is a client boundary. Avoid calling client exports from server components.

## Styling

Import `@fabrials/ui/tokens.css`, `fonts.css` and `styles.css` once. Fonts are
local IBM Plex Sans assets. AI hosts also import `@fabrials/ai-ui/styles.css`.
Both `.dark` and `[data-theme="dark"]` activate the same dark tokens.
`data-density="compact"` changes spacing without shrinking coarse-pointer
targets below the shared minimum. Reduced motion is respected.

Host CSS should express product layout, not duplicate control decoration.
Use `--muted-foreground` for secondary text: `--muted` is a surface token.
Use semantic destructive alerts instead of translucent red-on-red utilities.
Keep HTML email inside its existing sanitized sandbox; never invert its body.

## Independent distribution

From this repository:

```sh
bun install --frozen-lockfile
bun run check
bun run vendor ai-relay --write
bun run vendor open-email --write
bun run vendor ai-relay --check
bun run vendor open-email --check
```

AI Relay uses the paired `frontend/vendor/fabrials-{ui,ai-ui}-0.3.0`
distributions. Open Mail uses only `apps/web/vendor/fabrials-ui-0.3.0`.
Each consumer builds without a sibling checkout. Manifests verify hashes and
metadata; generated source is not edited in a consumer. These checks detect
drift, not malicious replacement of both a file and its manifest.

After regenerating this unreleased local version, run `bun update @fabrials/ui
@fabrials/ai-ui` in AI Relay's frontend and `bun update` at the Open Mail workspace
root. A plain install may retain cached file-dependency metadata. Published
versions must be immutable and use a new version for subsequent changes.

## Validation and rollback

Run the shared checks, Storybook build and `test:visual:container`. Review
intentional baseline changes and rerun without `--update-snapshots`. Consumer
checks additionally exercise real product controllers and server builds; the
component catalogue is not a replacement for product QA.

Rollback dependency paths, lockfiles and matching host source changes together.
Keep older vendor distributions available. No database migration, credential
rotation or production deployment is required for this UI adoption.
