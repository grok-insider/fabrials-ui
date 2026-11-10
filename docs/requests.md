# What products ask of the library

One list of what a product needed and the library did not have: a missing piece, a rule a host had to override, a component a product built better than ours. Add a row when you find one, with where in the product it shows; close it with the version that answered it. A product's override that is taste (its own look, recorded in its `DESIGN.md`) is not a request.

Earlier rounds are closed and kept where they were written: Open Email's requests, answered by 0.8.0 and 0.8.1 (`open-email/docs/fabrials-ui-gaps.md`), and Palanaeum's (`palanaeum/DESIGN.md`), answered by 0.10.

## Open

State is `0.12 <package>` when 0.12 answers it (the package is the one in `docs/plan-0.12.md`, and `docs/migration-0.12.md` says how to adopt it), `open` when nobody has decided, `owner` when it needs the owner's decision.

### From Radiant (read at `adde470`, 2026-11-10)

Paths are under `src/` of `grok-insider/radiant`.

| Request | Where Radiant works around it | State |
| --- | --- | --- |
| Answer prose and message actions are laid out with physical properties, so an Arabic answer has its list markers, quote bar and table heads on the wrong side | `app/globals.css` restates `.fui-markdown` and `.fui-message-actions` with logical properties | 0.12 A1 |
| Every floating surface writes its own background, border and shadow; a host that restyles them overrides eight classes and the toaster, and keeps a test so it does not miss one | `app/globals.css` `--float-*` block, `app/night-palette.test.ts`, `/admin/surfaces` | 0.12 A2 |
| The sidebar's mobile sheet stays open after navigating and has no close key; the focus ring is clipped by the scroll area; the row action is small, off-centre and on a physical side; the active row can only be rethemed by overriding rules | `components/app/app-sidebar.tsx`, `app/globals.css` | 0.12 A2 |
| No button size that is 44 px on a fine pointer | a class added to 161 buttons (`lang-review-touch`) | 0.12 A2 |
| A popover has no close part and can grow past the viewport | `components/lang/reader/token.tsx`, `app/reader.css` | 0.12 A2 |
| The font stacks have no place for a script Plex lacks, and no stylesheet declares the layer order a Tailwind host needs | `app/globals.css` (`--fui-font-sans`, `--fui-font-display`), `app/layers.css` | 0.12 A2 |
| No chat scroll container: staying at the end while an answer streams, a "jump to latest" key, a rail of the reader's own messages | `components/ai-elements/conversation.tsx` (on `use-stick-to-bottom`) | 0.12 C1 |
| Answers have no reading measure: a paragraph runs the full width of a wide window | `app/globals.css` `.chat-layout` | 0.12 C1 |
| No frame for a rendered thing (a diagram, a chart, a drawing): title, source, copy, download, full screen, an error that keeps the source | `features/core/feature-frame.tsx`, used by 28 kinds of visual | owner: left out of 0.12. The frame draws nothing by itself and what goes inside needs the product's own renderer; generative UI from a catalog of our own components is being looked at instead (`docs/research-generative-ui.md`) |
| No error boundary, no export helpers (SVG and PNG), no way to hand token colours to a third-party renderer | `features/core/error-boundary.tsx`, `export.ts`, `renderer-theme.ts` | 0.12 B1 |
| No upload lifecycle for the composer: `Attachments` draws a file, nothing uploads it | `components/chat/composer-attachments.tsx` | 0.12 C3 |
| No confirmation in place: `ConfirmDialog` is modal | eleven copies in `components/lang/**` | 0.12 B2 |
| No timer | `components/lang/exam/exam-timer.tsx` | 0.12 B2 |
| No theme controller: `ThemeSwitcher` is the control only | `components/theme-provider.tsx`, `lib/theme-script.ts` | 0.12 B2 |
| No whole-page state (404, a route error) | `components/app/missing-page.tsx`, `route-error-state.tsx` | 0.12 B2 |
| A time rendered on the server cannot be in the reader's zone without a hydration mismatch | `components/app/local-time.tsx`, used in 16 files | 0.12 B1 |
| Nothing marks a fragment in another language | 43 hand-written `<bdi>` in `components/lang/**` | 0.12 B1 |
| No page-level shortcuts hook; seven handlers repeat the same guards | `components/lang/**` | 0.12 B1 |
| No answer options with number keys and a result; the quiz's radios have no arrow keys | `components/lang/exercise/choice.tsx`, `features/quiz/view.tsx` | 0.12 B3 |
| No flashcard (reveal, then rate) | `components/lang/review/review-card.tsx`, `components/learn/review-session.tsx` | 0.12 B3 |
| No transport for steps (previous, play, next, speed) | `features/algorithm/view.tsx`, `features/simulation/view.tsx` | 0.12 B3 |
| `Progress` has equal steps only: no weighted segments with their own state, no mark on the track | `components/lang/session/progress.tsx`, `placement/progress.tsx` | 0.12 B3 |
| No play key for a short clip; `AudioPlayer` is a transport for one long file | six players in `components/lang/**` | 0.12 B4 |
| `VoiceInputButton` sends what it hears at once: no listening back, no typing instead, one error sentence | `components/lang/speak/use-recorder.ts`, `recorder-panel.tsx` | 0.12 B4 |
| No reading aloud | `features/core/use-speech.ts`, `read-aloud.tsx` | 0.12 B4 |
| `ImageViewer` has no provider, no drag down to close, no blurred thumbnail while loading, no safe areas, no download name | `components/chat/image-lightbox.tsx` (577 lines of its own) | 0.12 D1 |
| `MediaGrid` stops at four tiles and keeps a broken one | `components/chat/image-results.tsx` | 0.12 D1 |
| `GenerationFrame` has no actions on the finished picture and no video | `components/chat/generated-media.tsx` | 0.12 D1 |
| `Alert` has no retry; ten banners repeat it | `components/lang/**` (`lang-note`, 92 uses) | 0.12 D2 |
| `Textarea` has no count with a limit | eight files in `components/lang/**` | 0.12 D2 |
| `Slider` has no label, value and unit row | `features/plot/view.tsx`, `features/simulation/view.tsx` | 0.12 D2 |
| The composer has pills that toggle but none that pick | `components/chat/composer-controls.tsx`, `composer-immersion.tsx` | 0.12 C3 |
| `DitherCanvas` paints a field only: not a picture, not a painted sky | `components/app/dither-backdrop.tsx`, `lib/backdrop.ts` | 0.12 D3 |
| No account row for the sidebar, no bar for a sidebar app on a phone, no title renamed in place | `components/app/app-sidebar.tsx`, `mobile-header.tsx` | 0.12 D3 |
| No on-screen keyboard | `components/lang/keyboard/arabic-keyboard.tsx` | 0.12 D3 |
| A list of conversations (pinned, by recency, search, rename, share) | `components/app/app-sidebar.tsx` | open: wait for a second product |
| A prompt to install the app (PWA) | `components/settings/install-app.tsx`, `lib/pwa.ts` | open: wait for a second product |
| Filters kept in the URL | `components/admin/url-filter-toolbar.tsx` | open: router-bound; a recipe may be enough |

### From the audit of 0.11 (2026-11-10)

| Request | State |
| --- | --- |
| A table that sorts, selects and resizes its columns | owner |
| Form validation on Base UI `Form` and `Field` | owner |
| A tree view, a bottom drawer, a time picker, a menubar, more chart kinds | owner |
| Remove deprecated names, one size and tone vocabulary, split the modules that hold several components | owner: a breaking release |
| Move `recharts`, `embla-carousel-react`, `cmdk` and `react-resizable-panels` to optional peers or subpaths | owner: a breaking release |

### Found while building 0.12 (2026-11-10)

Seen by the packages of 0.12 and left alone, because the fix changes what a product sees today or needs a decision.

| Request | Where | State |
| --- | --- | --- |
| `ConsumptionView` heads its first column with the raw group key (`daily`, `models`); `groupHeadings` exists since 0.12 and defaults to the key | `packages/ai-ui/src/consumption.tsx` | open: change the default in a breaking release |
| `ProviderCard` drops the lines whose label starts with "Reset" when it has a reset inventory: a rule on an English word, which repeats a row once the data is translated | `packages/ai-ui/src/providers.tsx` | open |
| `HostedMigration` prints `Status: {phase}` with the raw key while its session list prints the phase in words | `packages/ai-ui/src/hosted-migration.tsx` | open |
| `Combobox`: with the list closed, Escape empties the field (in a multiple one, every chip); while the list is open the `<label for>` is hidden from assistive technology, so a field with no `aria-label` fails axe | Base UI's defaults, `packages/ui/src/combobox.tsx` | open |
| `SelectValue` shows the raw value unless the root is given `items` | Base UI's API, `packages/ui/src/select.tsx`; said in the migration note | open: resolve the label from the item text |
| `AlertDialogAction` is a plain button and the host closes the dialog; its comment does not say so | `packages/ui/src/dialog.tsx` | open: one sentence |
| A `done` and a `correct` segment of `Progress` are both a solid fill: only the tone tells them apart | `packages/ui/src/progress.tsx` | open: a shape for `correct` |
| The last tick of a chart's x axis loses about 2 px at 390 px in a 358 px frame | `packages/ui/src/chart.tsx` | open |
| A `MediaGrid` tile whose picture fails before hydration is not reported to `onItemError` | `packages/ui/src/image.tsx` | open |
| A `DropOverlay` over an area with no content has no height | `packages/ui/src/drop-overlay.tsx` | open: a minimum height or a sentence in its page |
| The glyphs of `OnScreenKeyboard` are `--fui-text-md` in keys of 44 px: small for a script keyboard | `packages/ui/src/on-screen-keyboard.tsx` | open |
| `Attachments` draws its own upload ring and file preview instead of `Progress variant="ring"` and `FileThumb`: the shapes differ (a ring that hugs a square tile, a 96 px preview) | `packages/ai-ui/src/attachments.tsx` | owner: it changes pixels |
| `@fabrials/ai-ui` copies its icons from Lucide instead of importing `lucide-react` | `packages/ai-ui/src/chat-icons.tsx` | owner: a dependency of the package |
| `RelativeTime` keeps its own timer: its period changes with the age of the date, and the shared ticker has one period per subscriber | `packages/ui/src/relative-time.tsx` | open |
| The first part of the `@fabrials/ui` stylesheet is one `@layer components` block of 6,500 lines; cutting it per component changes the bytes of the sheet | `packages/ui/src/styles/000-base-and-components.css` | open: with the visual suite per component |
| `references/components.md` of the skill is one table of 74 KB | `skills/fabrials-design-system/references/components.md` | open: split by area or generate it from the catalogue |
| The accounts family prints dates in the runtime's zone unless given `timeZone` (added in 0.12, and the docs previews pass `timeZone="UTC"`): the default is still 0.11's, so a page rendered on a server in UTC and read elsewhere differs until the host says which zone | `packages/ai-ui/src/providers.tsx`, `synchronized-accounts.tsx`, `private-history.tsx`, `hosted-migration.tsx` | open: default to a zone the host sets once (a provider, like `locale`) |
| `ApiKeyFields` with a `secret` and no `onSecretChange` renders a controlled input with no handler (React warns); it should be read-only | `packages/ai-ui/src/api-key-form.tsx` | open |
| `HostedMigration` keeps its one-second interval when `now` is given | `packages/ai-ui/src/hosted-migration.tsx` | open |
| `ConsumptionView`: three summary cards leave an empty cell at about 670 px, and the "Group by" label and the breakdown heading wrap into a tall empty band | `.fb-grid`, `.fb-consumption-filters` in `packages/ai-ui/src/styles/000-observation.css` | open: with the restyle of the family |
| `MigrationReviewDetails` prints a literal arrow between source and target, which keeps its direction in a right-to-left page | `packages/ai-ui/src/migration-review.tsx` | open |
| The loading stand-in of `ImageViewer` carries a 6 px blur, the one blur outside a reveal | `packages/ui/src/styles/240-0.12-viewer-and-gallery.css` (`.fui-viewer-under`) | owner |

## What Radiant can adopt today

These exist since 0.8 to 0.11 and are better than what Radiant carries; they are not requests: `PasswordInput`, `SearchInput`, `Loading` skeletons, `useConfirm`, `avatarInitials`, `StatePanel size="sm"`, `Badge variant`, `PageHeader eyebrow`, `Item` and `ItemGroup`, `ImageViewer`, `GenerationFrame`, `AgentThinking`, `TaskList`, the streaming caret of `ChatMessage`, `CodeBlock`'s own highlighter, `AudioPlayer`, `Progress`, `Stat`, `Disclosure`, `ToggleGroup`. Eighteen of the twenty files in its `components/ui` only re-export the library.
