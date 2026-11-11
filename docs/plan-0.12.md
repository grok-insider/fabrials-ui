# Plan for 0.12: what Radiant taught the system

Branch `feat/0.12`, cut from `master` at `190aff1` (0.11.0). This plan comes from two pieces of research done on 2026-11-10: an audit of the packages at 0.11.0, and a reading of Radiant (`grok-insider/radiant`, `origin/master` at `adde470`), the product that has built the most on top of the library. Radiant's own code is the reference for behaviour; its look (glass, blur, gradient titles, uppercase labels, large radii) is a product exception and does not come across.

The status table at the end says what has landed. A row is done only when its checks have run.

## Ground rules

- **Additive.** 0.12 removes nothing and renames nothing. Where a name should change, the new name is added and the old one keeps working, marked `@deprecated`. A breaking clean-up is a later release and the owner's decision.
- **House rule for a new public export:** a story, a keyboard test and a visual reference; shadcn's name for a part when shadcn has one. On top of that, every new piece ships with: its strings as props (`labels` or `*Label`, English defaults, plurals through `Intl.PluralRules`), logical CSS only, a forced-colors form for every state, nothing moving under reduced motion, tokens only, both themes, 390 px, and 44 px targets on coarse pointers.
- **No new runtime dependency.** Where Radiant leans on one (`use-stick-to-bottom`, `streamdown`, `shiki`, `nanoid`, the AI SDK types), the library version is written without it, or the piece stays a documented recipe.
- **Hosts own the network.** A component that needs a clip, an upload or a transcription takes a function from the host; no URL is written into the packages.
- **Radiant is not edited.** Migrating a product is that product's decision. The migration note lists what Radiant can delete once it adopts 0.12.
- **Commit only.** No push, no npm, no deploy without the owner's go-ahead. Commits are signed.

## How the work is run

Each work package below is built on its own branch in its own worktree (`.worktrees/fabrials-ui-0.12-<package>`), then merged into `feat/0.12`. Packages in the same wave touch different files, apart from three append-only ones (`styles.css` of each package, the index of each package, `docs/migration-0.12.md`), which merge by union.

A package's own gate, before it is merged: `bun run typecheck`, `bun run lint`, `bun test` on its unit tests, the build, and its Playwright spec written. The gate of a wave, run once on `feat/0.12` after its merges: `bun run check`, then `bun run test:visual:container` (new references generated for the new stories only; an existing reference that changes is looked at before it is accepted). The skeleton suite (`bun run test:loading:container`, about an hour) and gitleaks run once at the end. The visual suite and the skeleton suite share `test-results` and never run at the same time.

## Phase 1: documents

| # | Change |
| --- | --- |
| 1.1 | `AGENTS.md` at the root keeps the repository's rules and gains three short sections it lacked: how to add a component (the definition of done as a list), how a release goes (version, migration note, signed tag, npm before the registry, a clean worktree check), and the traps that have cost time (two suites at once, the Storybook port, a stale checkout). The style rules it repeated from `DESIGN.md` shrink to a pointer and the few that agents break most. |
| 1.2 | `apps/site/AGENTS.md` takes the rules that are about the docs site (examples, the Code tab, `Frame` widths, generated files). |
| 1.3 | `CLAUDE.md` at the root (`@AGENTS.md`), as Radiant has, so Claude Code reads the same rules. |
| 1.4 | `README.md`: the current line (0.12), the real table of who consumes which version and how (vendored copy or npm), Node and Bun versions. |
| 1.5 | The skill: `migration-0.11.md` and `-0.12.md` in its sources, the stale lines corrected (`Card`, the sign-in card, "0.7 layout rules", the migration range). |
| 1.6 | `DESIGN.md`: products consume a vendored copy or the npm package; the gem table gains the products it lacks, marked provisional where the owner has not decided; a browser baseline; a script-fallback font slot; the new pieces of 0.12 in Components and Motion. |
| 1.7 | `docs/requests.md`: one place for what products ask of the library, seeded from `open-email/docs/fabrials-ui-gaps.md`, Palanaeum's `DESIGN.md` and this plan's Radiant list. |
| 1.8 | A test that fails when a public component is missing from `references/components.md` or from the site catalogue, with an allow-list for sub-parts, so the two stop drifting. |

## Phase 2: fixes to what exists

### A1. `@fabrials/ai-ui`: right to left, the shared chevron, forced colors

- Logical properties for the 27 physical declarations of `ai-ui/src/styles.css` (markdown lists, blockquote, table head, table toolbar, activity, attachments, voice dot, message actions, sources).
- `direction: ltr; unicode-bidi: isolate` for KaTeX output inside `.fui-markdown`.
- `.fui-disclosure-chevron` is defined in both stylesheets with different sizes: the ai-ui one becomes `.fui-activity-chevron` (the old class keeps working inside `.fui-sources-trigger` and `.fui-activity-trigger`). A unit test fails when a class is defined unscoped in both sheets.
- Forced-colors forms for citation chips, composer pills and toggles, the voice button, activity disclosures and the user bubble.
- Print rules: message actions hidden, bubbles flattened, `break-inside: avoid`.
- An RTL frame in the AI benches (`stories/ai-chat.stories.tsx`, `stories/agents-bench.stories.tsx`) with a spec.

### A2. `@fabrials/ui`: surfaces, the sidebar, targets

- **Overlay surface tokens.** `--fui-overlay-surface`, `--fui-overlay-border`, `--fui-overlay-shadow`, `--fui-overlay-filter`, read by every floating surface (menu, context menu, popover, hover card, select, listbox, combobox and multi-select popups, command, navigation menu, chart tip, tooltip keeps its own, dialog and sheet take `--fui-dialog-*` that default to them, toasts). A test holds the list of selectors. Defaults are today's values, so nothing changes on screen.
- **Sidebar.** The mobile sheet closes when the host says the route changed (`SidebarProvider` `closeOnNavigate` key, any value that changes); `SidebarClose` part and a 44 px close key in the sheet; the focus ring is drawn inside the row for every size and for `SidebarMenuAction`; the action is centred, 44 px on coarse pointers; `right:` becomes `inset-inline-end` (action, group action, badge, rail); the collapsed tooltip follows the side and the direction; tokens for the active row (`--fui-sidebar-active-bar`, `-ink`, `-shadow`); the Tailwind marker classes that do nothing go; `useIsMobile` reads through `useSyncExternalStore` and is exported with `useMediaQuery`.
- **Right to left elsewhere:** Timeline rail and actions, SuggestionCard, Files, the skip link, Carousel (controls, arrow keys by direction, mirrored chevrons, Embla `direction`).
- **Carousel:** keys are taken only from the carousel itself, not from fields inside a slide; a vertical one answers Up and Down; `labels`; a required name for the region.
- **Button `size="touch"`** and `IconButton size="touch"`: 44 px on every pointer, for screens where every action is a learner's or a phone's. `Button loadingLabel`.
- **Popover:** `PopoverClose`, and the popup never grows past the space it has (`max-block-size: var(--available-height)`, scrolling inside).
- **Scroll regions are a tab stop only while they overflow:** Table, CodePanel, CodeTabs, Snippet, CodeBlock (as ScrollArea does since 0.11).
- **Fonts and layers:** `--fui-font-fallback` inside `--fui-font-sans`, `-display` and `-label` for scripts Plex lacks; `@fabrials/ui/layers.css` with the layer order a Tailwind host must declare first.
- **Safe areas:** sheets, the sidebar sheet, the toaster and sticky headers pad by `env(safe-area-inset-*)`.
- **Housekeeping:** the dead rules found by the audit go; `class-variance-authority` leaves the dependencies; `Toaster` stops typing props it drops; `CollectionToolbar` search takes a full row on a phone; `StatePanel` takes `children`.

### A3. Server and client

- Pure helpers move to modules with no `"use client"`: `formatBytes`, `formatRelativeTime`, `formatAbsoluteTime`, `groupByRecency`, `avatarInitials`, `avatarTint`, `fileTypeLabel`, `languageMark`, the date helpers, `acceptsFile`, `sortFiles`; in ai-ui `hostnameFromUrl`, `formatTokens`, the label helpers, `reset-expiry`, `provider-icon-data`. Each stays exported from where it was.
- The build marks a module as client when its source says so, not by a list of names.
- `Combobox` gains flat named parts (`ComboboxRoot`, `ComboboxInput`, `ComboboxPopup`, `ComboboxItem`, …, with the positioner and offset inside `ComboboxContent`); the namespace object stays, deprecated.
- A test renders the pure helpers and the hook-free components from a module without the directive.

### A4. Strings

- `labels` (English defaults) for the components with words nobody can change: Carousel, SeriesChart, CodePanel, CodeTabs, PackageInstall (the error no longer depends on its English text), MultiSelect, RepoInfo, FilterChip; in ai-ui SearchStepsDisclosure, Sources, Attachments, VoiceInputButton, ContextMeter, GenerationFrame.
- Counts use `Intl.PluralRules` through one helper, `plural(count, forms, locale)`.
- `LabelsProvider` and `useLabels(scope, defaults, own)`: a product sets its strings once; a component's own `labels` prop still wins. `locale` comes from the same provider when a component is not given one.
- One `locale` type (`Intl.LocalesArgument`), default `"en"`, for NumberTicker, Calendar, DatePicker, recency and RepoInfo (their old behaviour stays when `locale` is passed).

## Phase 3: new pieces in `@fabrials/ui`

Radiant paths are under `src/` of `radiant` at `adde470`.

### B1. Small foundations

| Export | From Radiant | Notes |
| --- | --- | --- |
| `useHydrated` | `components/app/local-time.tsx` | `useSyncExternalStore`, false on the server |
| `LocalTime` | `components/app/local-time.tsx`, `lib/time-format.ts` | A `<time>` in the reader's zone and locale; before hydration a hidden stand-in of the same width, so nothing shifts and no server time shows. Formats `time`, `dateTime`, `date`, `shortDate`, `message` |
| `useHotkeys` | seven handlers in `components/lang/**` | One guard set: modifiers, IME, key repeat, typing targets, other controls, a scope element, `data-hotkeys="off"` islands |
| `useElementSize` | `features/core/use-width.ts` | Width and height by `ResizeObserver`; `chart.tsx` uses it |
| `ErrorBoundary` | `features/core/error-boundary.tsx` | `resetKey`, `onError`, `fallback` as a node or `({ error, reset })`; the default is an inline `StatePanel` with "Try again" |
| `downloadFile`, `serializeSvg`, `svgToPng`, `fileStem`, `copyImage` | `features/core/export.ts`, `components/chat/generated-media.tsx` | `@fabrials/ui/export`, no directive |
| `useResolvedTokens`, `resolveColor` | `features/core/renderer-theme.ts` | Tokens as `#rrggbb` for canvases and third-party renderers; follows the nearest theme holder and the system scheme |
| `ForeignText`, `dirOf`, `isolate`, `interpolate` | `components/lang/foreign-text.tsx`, `lib/lang/foreign.ts`, `exercise/lang-text.ts` | `<bdi lang dir>` for a fragment in another language; direction from the tag or the script; a message with markup slots |
| `Announcer`, `useAnnounce` | the step players | One polite region a screen can speak through |

### B2. States and time

| Export | From Radiant | Notes |
| --- | --- | --- |
| `InlineConfirm` | eleven copies (`session/confirm-finish.tsx`, `placement/confirm.tsx`, `exam/exam-confirm.tsx`, …) | Not modal, in place: the safe answer takes focus, Escape is the safe answer, it scrolls clear of sticky bars, focus returns to the asking control; `pending`, `destructive`, `acknowledgement` (a required tick that says what is missing instead of disabling) |
| `Countdown`, `useCountdown` | `components/lang/exam/exam-timer.tsx`, `use-countdown.ts`, `clock.ts` | Computed from a deadline with a clock offset, wakes with the page, `role="timer"`, speaks only at marks, tones calm, low and urgent |
| `ThemeProvider`, `useTheme`, `themeInitScript` | `components/theme-provider.tsx`, `lib/theme-script.ts` | Storage read outside render, tabs in step, `resolvedTheme`, `color-scheme` and `theme-color`, a pre-paint script |
| `StatePage`, `ErrorState`, `BackButton` | `components/app/missing-page.tsx`, `route-error-state.tsx`, `history-back-button.tsx` | A whole-page state outside the shell (brand link, code, title, detail, actions, safe areas); an error with retry, home and a reference; a back key with a fallback |
| `ActionBar`, `useViewportInsets` | `.lang-session-bar`, `conversation/use-dock.ts` | A sticky bar of a step or a form; the on-screen keyboard and the bar's height as CSS variables |

### B3. Answers and steps

| Export | From Radiant | Notes |
| --- | --- | --- |
| `ChoiceGroup`, `ChoiceOption` | `components/lang/exercise/choice.tsx`, `features/quiz/view.tsx` | Base UI radio or checkbox semantics, a marker (A, 1), number keys, ruled-out options, `result` correct, incorrect or missed with an icon and words, read-only after an answer |
| `RevealCard`, `RatingBar` | `components/lang/review/review-card.tsx`, `review-session.tsx` | A card whose answer side is a live region; reveal on Space; ratings with a key, a label and a hint |
| `StepControls`, `useStepPlayer` | `features/algorithm/view.tsx`, `simulation/view.tsx`, `core/use-clock.ts` | Previous, play or pause, next, reset, "Step 3 of 12", an optional speed; follows the direction |
| `Progress` `segments` and `marks` | `components/lang/session/progress.tsx`, `placement/progress.tsx` | Weighted segments with a state and a name each, optionally buttons; a mark on the track |
| `MarkedText`, `AnnotationList`, `TextDiff` | `components/lang/write/marked-text.tsx`, `exercise/feedback.tsx` | Numbered marks tied to a list, three line styles by severity, `<ins>` and `<del>` with spoken prefixes |

### B4. Sound

| Export | From Radiant | Notes |
| --- | --- | --- |
| `useClipPlayer`, `ClipButton`, `SpeedToggle` | `components/lang/exercise/audio.tsx`, `audio-failure.ts`, `silence.ts` | The host loads the clip; idle, loading and playing-as-stop; a late load never plays over a newer one; a cache; failure kinds and whether a retry can help; one sound at a time, shared with the players and the recorder |
| `useRecorder`, `RecorderPanel` | `components/lang/speak/use-recorder.ts`, `recorder.ts`, `recorder-panel.tsx` | Listen back before anything leaves the device; denied, no microphone, unsupported, busy and too short each say what to do; a clock in the reader's digits; the level meter of `VoiceInputButton`, which is rebuilt on the hook |
| `useSpeech`, `speakableText`, `speechChunks` | `features/core/use-speech.ts`, `read-aloud.tsx`, `lib/speech-chunks.ts` | Read aloud in chunks from the host's loader, the browser's voice as a fallback, one reader at a time |

## Phase 4: new pieces in `@fabrials/ai-ui`

| Package | Export | From Radiant | Notes |
| --- | --- | --- | --- |
| C1 | `Conversation`, `ConversationContent`, `ConversationScrollButton`, `ConversationCheckpoints`, `useConversation` | `components/ai-elements/conversation.tsx` | Stays at the end while an answer streams and lets go the moment the reader scrolls away, written without a dependency; a named "Jump to latest" key; the rail of the reader's own messages; a reading measure for answers (`fit-content` up to 52rem, full width for a table, code or figure) |
| C2 | `ZoomPan` | `features/core/feature-frame.tsx`, `fence-host.tsx` | `ZoomPan` on the viewer's maths, for a full-screen view of a drawing. The frame it was planned inside left the release by the owner's decision: see *Status* |
| C2 | `ToolCall`, `SuggestionChips` | `components/ai-elements/tool.tsx`, `features/core/study-chips.tsx` | A tool call on `ActivityDisclosure` (name, state, input, output); follow-up chips |
| C3 | `useAttachments`, `DropOverlay` | `components/chat/composer-attachments.tsx`, `chat-drop-zone.tsx`, `lib/persist-composer-files.ts` | Uploads start when a file is added, with progress, abort and retry, a limit of three at once, `waitForUploads()` before sending, and clean-up |
| C3 | `ComposerSelect`, `ComposerMenu`, `ReadAloudAction` | `components/chat/composer-controls.tsx`, `features/core/read-aloud.tsx` | A pill that picks a model, an effort or a mode, with its value in its name |
| C4 | `MarkdownCallout` and `.fui-callout`, `EditableMessage`, `MessageTimestamp date` | `components/ai-elements/callout.tsx`, `chat-thread.tsx`, `message-timestamp.tsx` | Notes, tips, warnings in an answer; a sent message edited in place (Escape, Ctrl or Cmd with Enter); a time safe to render on the server |
| C4 | `@fabrials/ai-ui/markdown` | `lib/markdown/{bidi,callouts,normalize-math}.ts` | `textDirection`, `calloutOf`, `normalizeMath`: pure functions a host wires into its renderer, with no dependency |

## Phase 5: better versions of what exists

| Package | Component | Change |
| --- | --- | --- |
| D1 | `ImageViewer` | `ImageViewerProvider`, `useImageViewer`, `ZoomableImage`; drag down to close on touch; the thumbnail blurred under the picture while it loads; the neighbours preloaded; safe areas; `downloadName`, `credit`, `sourceUrl` |
| D1 | `MediaGrid` | More than four tiles with a lead tile, a caption per tile, a broken tile removed, a line of sources |
| D1 | `GenerationFrame` | `actions` (download, copy the picture), `kind="video"`, `onOpen` |
| D2 | `Alert` | `onRetry` and `retrying`, `revealOnMount`, `tone` beside `variant` |
| D2 | `Textarea`, `Input`, `Field` | `count` with a soft limit, words through `Intl.Segmenter`, the overflow announced; `Field` `required` and `optional` marks, `className` |
| D2 | `Slider` | `label`, `unit`, `format`, `onValueCommitted`; `SliderGroup` |
| D2 | `SeriesChart` | `ChartLegend`, `LegendItem`, `Swatch` exported; `ColorRamp` |
| D2 | shadcn parity | `badgeVariants`, `tabsListVariants`, `Toggle` and `toggleVariants`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldContent`, `FieldTitle`, `FieldSeparator`; `ComposerToggle` uses `Toggle` |
| D3 | `DitherCanvas` | `paint(ctx, size, theme)` and `source` (a picture: cover fit, tone, mono or colour dither) |
| D3 | `Sidebar` | `SidebarAccount` (avatar, name, a menu with theme, links and sign out), `SidebarInsetHeader` (trigger, title, an actions slot), `SidebarInset frame` |
| D3 | `EditableText` | A title renamed in place: Enter commits, Escape cancels, blur commits, empty is no change |
| D3 | `OnScreenKeyboard`, `insertAtCaret`, `backspaceAtCaret` | Rows as data, one tab stop, keys by geometry, the field keeps focus, hold to repeat, whole graphemes |

## Phase 6: debts of coverage

| Package | Change |
| --- | --- |
| E1 | The accounts and usage family of ai-ui (`ProviderCard` … `HostedMigration`, 16 exports) brought to the house rule: `labels`, `headingLevel`, `className` and rest props, a `locale`, stories with synthetic data, unit tests, a visual bench, catalogue pages. `fb-` classes keep working. |
| E2 | Keyboard specs for what has none: Carousel, Combobox, HoverCard, NavigationMenu, Collapsible, NumberTicker, Pagination, Breadcrumb, the Sidebar with its provider (Ctrl+B, the cookie, the sheet, the rail), Tooltip, and the composer, voice and message actions. Stories for the exported parts no story renders. |
| E3 | The site: a catalogue page with a demo for every new export, example sets for the main ones and for the twenty pages the audit named, `references/components.md`, `docs/migration-0.12.md`, the registry rebuilt. |

## Phase 7: structure

These change how the packages are built, not what a screen shows. Each is proven by an output that does not change.

| # | Change | Proof |
| --- | --- | --- |
| 7.1 | `styles.css` of both packages is split at source into one file per component, concatenated by the build in a fixed order | `dist/styles.css` is byte-identical before and after the split; the rules scattered by release are then folded into their component one component at a time, each with the visual suite |
| 7.2 | The shipped stylesheets are minified, with a readable copy beside them | The visual suite |
| 7.3 | Duplicates between the packages go: one `formatBytes`, one copy hook, `FileThumb` and the `Progress` ring inside `Attachments`, `lucide-react` instead of `chat-icons.tsx`, one reduced-motion helper, one clock | Unit and visual suites |
| 7.4 | `motion` leaves: `NumberTicker` rolls in CSS like `Readout` | Its story and spec |
| 7.5 | A vocabulary to grow into: `size` `sm`, `md`, `lg` accepted everywhere `default` is; `tone` accepted wherever `variant` names a status; `start` and `end` for sides | Types and unit tests; nothing deprecated is removed |

## Not in 0.12

These need a decision or are new products of their own; each has a line in `docs/requests.md`.

- A sortable, selectable `DataTable`; form validation on Base UI `Form`; a tree view; a bottom drawer; a time picker; a menubar; more chart kinds.
- Removing deprecated names, splitting the grab-bag modules, moving `recharts`, `embla`, `cmdk` and `react-resizable-panels` to optional peers.
- `ConversationList` (pinned and recent chats with rename and share) and an install prompt for a PWA: wait for a second product to ask.
- Migrating Radiant, or any product, to 0.12.

## Status

Merged means: on `feat/0.12`, with `bun run check` green on the merged branch and the package's own spec run by its author. The whole visual suite runs on the merged branch after each wave.

| Package | State |
| --- | --- |
| Phase 1 documents | merged; the catalogue test of 1.8 is `tests/unit/docs-coverage.test.ts` |
| A1, A2, A3, A4 | merged |
| B1, B2, B3, B4 | merged |
| C1, C2, C3, C4 | merged; `ArtifactFrame` and `useAsyncRender` were built in C2 and removed before the release, by the owner's decision (2026-11-10) |
| D1, D2, D3 | merged (`GenerationFrame` went with D2) |
| E1, E2 | merged |
| F1 (not in the first plan): the bugs E2's keyboard specs found | merged |
| E3 | merged: 48 new pages and about 60 updated on ui.fabrials.com, the skill and `DESIGN.md`; ten exports have no page, all sub-parts (portals, overlays, contexts) |
| 7.1, 7.2 | merged: 29 and 13 parts, the sheets ship minified beside a readable copy. The first part of `@fabrials/ui` stays one block of 6,500 lines (`docs/requests.md`) |
| 7.3, 7.5 | merged, except `Attachments` on the house ring, the icons of `@fabrials/ai-ui` and `RelativeTime` on the shared clock (`docs/requests.md`) |
| 7.4 | merged |
| Version 0.12.0 | done on `feat/0.12`; not pushed, not tagged, not published |
| After the owner's review (2026-11-10) | merged: English as the one default language for everything that formats, with `timeZone` for the accounts family and a guard test (`tests/unit/default-locale.test.tsx`); the rail and the jump key of a conversation clear of the scrollbar; `docs/research-generative-ui.md` |
| Final runs | see the commit that closes the release: `bun run check`, the visual suite against the parts and against the minified sheets, the skeleton suite in three engines, gitleaks. Not verified: a screen reader, real Safari and Firefox, a phone, a microphone, any product on 0.12 |