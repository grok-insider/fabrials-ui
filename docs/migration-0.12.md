# Migrating to 0.12

0.12 is additive: nothing is removed and nothing is renamed. A product on 0.11 can take it without changing a line. This note says what is new, what a product can now delete, and the few places where something looks or behaves differently. Each section below was written with the change it describes; the plan they follow is `docs/plan-0.12.md`.


## The chat pieces: right to left, forced colors, print

`@fabrials/ai-ui` adds no export here. Its stylesheet is corrected in place, and two components change one class name.

**Right to left.** Every rule that named a side of the screen is written in logical properties, so the chat pieces turn with `dir="rtl"`. In a left-to-right page nothing moves.

| Piece | In a right-to-left page |
| --- | --- |
| Markdown (`.fui-markdown`) | List markers and the quote's bar on the right, table heads read from the right, a task list's box before its text. Code blocks and inline code stay left to right; a code block's header follows the page (name at the right, copy at the left). KaTeX output (`.katex`, `.katex-display`) stays left to right |
| `ChatMessage`, `MessageActions` | The question sits at the left, the answer's actions start at the right edge |
| `ActivityDisclosure`, `ReasoningDisclosure`, `SearchStepsDisclosure` | The trigger hangs at the right, the body's rule and a search's rail are on the right, the live dot on the icon's left |
| `Sources`, `SourceCard`, search results | The stacked marks overlap leftwards. A host and a path are parts of an address: they stay left to right, the host before the path |
| `Attachments` | The remove key at the left of a tile, a chip and a row |
| `VoiceInputButton` | The recording dot on the mic's left |
| `AgentMark` (`scan`, `lines`, `type`), a document `GenerationFrame`, the arrow of a page a search opened | Mirrored: a scan sweeps, lines are read and a page is written from the right; the arrow points up and to the left |

As with `@fabrials/ui`, a right-to-left app sets both `dir="rtl"` on its root and `DirectionProvider direction="rtl"`.

**The chevron.** `Sources` and `ActivityDisclosure` (and the reasoning and search disclosures built on it) now draw their chevron with the class `fui-activity-chevron`. Before, they used `fui-disclosure-chevron`, the class of `@fabrials/ui`'s `Disclosure`, and the chat stylesheet styled that class on its own: with both stylesheets on a page, every `Disclosure` chevron was 14 px and faded to 60 % instead of 16 px.

- Looks different: a `Disclosure` on a page that also loads `@fabrials/ai-ui/styles.css` gets its 16 px chevron back. The chat pieces look as they did.
- A product that selects `.fui-disclosure-chevron` inside a sources or an activity trigger in its own CSS selects `.fui-activity-chevron` instead. A product that draws its own trigger with the old class inside `.fui-sources-trigger` or `.fui-activity-trigger` keeps the chat look.
- `tests/unit/stylesheet-collisions.test.ts` now fails when a class is defined on its own in both stylesheets, or when the chat stylesheet styles a class of `@fabrials/ui` outside one of its own pieces.

**Forced colors.** The older chat pieces get a form in system colours (Windows high contrast):

| Piece | Form |
| --- | --- |
| `CitationChip`, a source's number | An edge in the link's ink; the chip whose source is pointed at, and that source's card, carry a `Highlight` bar |
| The question's bubble | An edge |
| `ComposerToggle` pressed, `VoiceInputButton` recording | A `Highlight` edge and a bar under the label; the level dot is `Highlight` |
| `VoiceInputButton` in error, a failed attachment | A dashed edge |
| A tile's remove key | An edge around the disc |
| `ChatComposer` with focus in its field | A `Highlight` ring (its focus was a border colour and a shadow) |
| A search at work | The step it is on has a `Highlight` badge, the rail between steps is drawn, the live dot is `Highlight` |

**Print.** Message actions and the streaming caret are not printed, the question loses its bubble, a message is kept on one page when it fits, and code wraps instead of running off the sheet (a code block's copy and download keys are not printed).

**Pointer.** The message actions brighten under the pointer only where there is one (`@media (hover: hover)`), so a tap no longer leaves an action highlighted.

Nothing to delete in a product unless it carried its own right-to-left overrides for these pieces (`[dir="rtl"] .fui-markdown ul { padding-right: … }` and the like): those can go.
