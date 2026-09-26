# Adopting Fabrials UI 0.5

0.5 keeps every 0.4 export and token. It adds controls that came out of the
Radiant redesign. Nothing has to change in a host that stays on 0.4 behavior.

## New in `@fabrials/ui`

- `ConfirmDialog` and `ConfirmActionButton` for confirm-first async actions.
- `TruncatedText` shows a tooltip only when the text is actually cut off.
- `SettingsSection` for two-column settings rows.
- `FilterChip` for removable active filters, as a link or a button.
- `FileThumb` and `fileTypeLabel` for file lists.
- `SuggestionCard` and `SuggestionGrid` for empty-state prompts.
- `ShimmerText`, a CSS-only loading label.
- `groupByRecency` and `RECENCY_LABELS` for Today, Yesterday, Previous 7 and
  30 days, then months.
- `MoonPhase`, `Starfield`, `lunarPhase`, `lunarPhaseName`: sign-in and
  landing effects. They are the only sanctioned glow and continuous motion,
  and they stop under reduced motion. The glow is drawn from the lit shape,
  so it follows the shadow. `variant` picks a moon type from `MOON_VARIANTS`
  (earthshine, moon halo, harvest, supermoon, micromoon, blue, blood, super
  blood); `variant="random"` rolls a weighted type at each new moon and
  `caption` names it. Server code imports the pure helpers from
  `@fabrials/ui/moon`.

## New in `@fabrials/ai-ui`

- `ChatMessage`, `MessageActions`, `MessageAction`, `CopyMessageAction`,
  `MessageTimestamp`.
- `ChatComposer`, `ComposerToggle`, `ComposerButton`.
- `CodeBlock` and the `.fui-markdown` answer styles, which also target
  Streamdown's `data-streamdown` attributes.
- `CitationProvider`, `CitationChip`, `Sources`, `SourceCard`, `SourceFavicon`.
- `ActivityDisclosure`, `ActivityIcon`, `ReasoningDisclosure`,
  `SearchStepsDisclosure`.
- `Attachments`, `AttachmentChip`.
- `VoiceInputButton`: the host supplies transcription through `onRecorded`.

The AI package still depends only on `@fabrials/ui` and React.

## Distribution

After `bun run build`, write `fabrials-ui-0.5.0` (and `fabrials-ai-ui-0.5.0`
for AI hosts) with `bun run vendor <product> --write`, point the host
`package.json` at the new directories and run `bun install`. 0.4.0 copies stay
in place for rollback; a `--check` against 0.5 fails until the product is
re-vendored.
