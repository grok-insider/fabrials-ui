# Identity proposals (0.10)

Highstorm (0.7 to 0.9) fixed sober rules: one interaction colour, light only as dither, small radii, indexes instead of card grids, nothing centred. The rules removed the slop. They did not add a voice: a page built with Fabrials UI today reads as a tidy, neutral dashboard that could belong to anyone. This note records the diagnosis, the references studied and three directions, each with a mock in Storybook under **Identity proposals**. Nothing here ships until the owner picks a direction.

Mocks: `stories/identity/` (`instrument`, `folio`, `facet`), each with the same two screens, the fabrials.com landing and a product overview (Palanaeum), in both themes and at 390 px. Data is synthetic.

## Diagnosis

Screens checked on 5 November 2026 at 1440 and 390 px, light and dark: ui.fabrials.com, fabrials.com, the ai.fabrials.com and X Tracker sign-in pages, admin.fabrials.com, the Storybook patterns (Console, Settings, PublicSite, Highstorm landing) and Palanaeum's overview.

1. **One voice for everything.** Plex Sans Condensed 600 for titles and Plex Sans 14 px for every other word. Labels, values, metadata, captions and table heads share one face, one weight range and one grey. Plex Mono and Plex Serif ship in every product and are almost never seen.
2. **Every region is the same box.** Stat groups, charts and tables are rectangles with the same fill, the same 1 px border and the same 6 px corner. Palanaeum's overview and the ai-relay console are four boxed numbers, a boxed chart and a boxed table: the default shadcn dashboard, recoloured.
3. **The brand stops at the door.** Dither appears on landings and sign-in only. Inside a product there is a 20 px gem and nothing else; the Console, Settings and Palanaeum screens could be any SaaS.
4. **The storm is one stock picture.** fabrials.com, ui.fabrials.com, ai.fabrials.com and X Tracker show the same noise cloud, in the same place, cut by the same edge on sign-in. Repeated identically it reads as a template asset, not as art, and it never relates to the text beside it.
5. **Data has no material.** Charts use Recharts defaults in three unrelated hues (blue, teal, ochre). The dither engine that defines the brand is not used where the products show their most important content.
6. **Space without structure.** Wide screens leave large empty areas (Settings keeps 450 px of nothing on the right at 1440) with no grid, rule or caption to make the emptiness feel intended. Sections are separated by one identical hairline.
7. **No details at small scale.** No captions, no units set apart from values, no rulers or ticks, no icons of our own (lucide everywhere), no illustrated empty states, no marks at corners or ends of rules. Craft lives at this scale and there is none.
8. **Surfaces too close together.** Page `#eceeeb` and card `#f7f8f6` differ by about 2 % lightness; the whole light theme is one mid grey with a dark ink. Dark mode is better only because Stormlight carries more.

## References

What makes these feel made by hand, reduced to techniques we can use:

- **Linear** (2024 and 2025 redesigns): fewer, stronger neutrals generated from three inputs; a display cut of the text face for headings only; chrome reduced until content carries the hierarchy.
- **Vercel Geist**: the layout grid drawn on the page (guides, crosses at intersections, solid cells that occlude guides); mono for numbers and identifiers.
- **Teenage Engineering**: the product manual as a style. One family in few weights, labels like those printed on a device, technical drawings, numbering, radical restraint.
- **Stripe** (docs and annual letter): editorial measure, captions and figures treated as first-class, numbers stated in sentences.
- **Are.na, editorial publications**: margins that carry notes, running heads and folios, rules with weight, serif display against a sans interface.
- **Rauno Freiberg, Paco Coursey, Family, Raycast**: craft in the invisible details (state transitions, focus, hover affordances), a small number of signature interactions, personality in empty and loading states.
- **Nothing**: a dot-matrix motif applied consistently from the hardware to the type to the icons, so one texture says the brand everywhere.

The Cosmere gives the motifs, never literally: fabrials are engineered devices (instrument), the Palanaeum is a library (folio), gems are cut stones that hold Stormlight (facet), Shadesmar is a sea of beads (texture).

## A. Instrument

Fabrials as calibrated devices. A screen reads like a well-made instrument panel.

- **Construction shown.** Corner marks (a 9 px cross) on plates; the 12-column grid drawn as faint dashed guides in heroes; rulers with ticks on figures and limits.
- **A second voice.** Plex Mono 11 px, sentence case, for labels, units, captions, identifiers, axis text and readouts ("Last sync 14:32 UTC"). Values stay in Plex Sans Condensed, larger (40 px in apps, 52 px on landings).
- **Data drawn in dither.** Series are 2 px ordered patterns: the first series in Stormlight, the rest in ink at another density, so a chart reads in greyscale and in print.
- **Plates.** Containers become square (radius 0) with a hairline and corner marks; controls keep 5 px. Figures carry a caption strip ("Fig. 1 …").
- **Brand.** The storm becomes a framed plate with a ruler and a caption instead of a free-floating cloud.

Changes: new tokens (`--fui-font-label`, `--fui-guide`, `--fui-mark`), `--fui-radius-lg` to 0 for containers, label styles in `Stat`, `Table` heads, `Chart` axes and `PageHeader` metadata, new `Plate`, `Ruler`, `DitherSeries` pieces, chart theme. Breaks: little. Visual references for every container and stat change; products that box things themselves need to drop their own borders; Recharts colours are replaced by patterns (an accessibility gain, a migration for every chart).

## B. Folio

The archive at Kharbranth. Pages read like a well-set publication.

- **Serif display.** Plex Serif 500 for hero headlines, page titles, section titles and big numerals; Plex Sans stays the interface face.
- **Paper and lamplight.** Neutrals shift warm: paper `#efebe3` and warm ink in light, graphite and bone in dark. Stormlight stays as the ink of links and focus, like a fountain pen.
- **The margin works.** A margin column carries section marks (§ 1), notes and short facts; a running head and a folio frame each page; a thick-and-thin rule under titles.
- **Numbers in sentences.** Totals are said ("28,714 messages from 3 accounts; 6,102 are unread") with the figures set larger and underlined in Stormlight, which follows "say what happened".
- **Engraving.** Dither printed in two inks, ink and Stormlight, as plates with captions; charts use hatching.

Changes: palette retinted in `tokens.css` for both themes, `--fui-font-display` to Plex Serif, new rule and margin tokens, `PageHeader`, `SectionHeader` and `WorkspaceShell` gain a margin column and running head, `Stat` gains a sentence form, charts hatch. Breaks: the most. Every product changes colour temperature (Radiant's night sky and X Tracker's telemetry must be re-checked), the slate identity of 0.7 is replaced, dense screens lose width to the margin column below about 1200 px, and serif titles need a fallback for Greek (the shipped Plex Serif covers Latin, Cyrillic and Vietnamese only) and Arabic.

## C. Facet

The cut stone as the shape language, the product gem as ambient light.

- **The cut.** Containers, the primary button, nav rows and tags get two bevelled corners (`corner-shape: bevel`, 10 px on containers, 6 px on controls), like a gem's girdle. Browsers without `corner-shape` fall back to the current radii.
- **Our own glyphs.** A 9 × 9 pixel glyph set, symmetric and angular, for navigation and section marks in brand places, beside lucide for generic actions.
- **Gem light.** The product's gem lights the top of its shell (sidebar, a feature panel) as dithered light; the house gem sits large inside the storm on landings. Text never sits on it.
- **Facet marks.** Diamonds instead of dots and bars: status, legends, rule ends, a facet bar (a chain of diamonds) for proportions.
- **Beads.** A very faint lattice of dots on empty page areas, the sea of Shadesmar.

Changes: radii tokens gain `--fui-cut` and `--fui-cut-sm`, gem tokens are allowed on brand surfaces (a change to the rule "a gem signs the mark and nothing else"), new `Glyph`, `GemLight`, `FacetBar` pieces, status dots become diamonds, chart bars get a cut top. Breaks: moderate. The radius rule in `DESIGN.md` changes, `corner-shape` is Chromium-only today (Firefox and Safari keep rounded corners, so the look differs per browser), and gem light must be tuned for the duller gems (smokestone barely shows).

## Combining

The directions are not exclusive. A and C share the dither-as-material idea and differ in shape; B's sentence-numbers and margin notes can live inside A. The choice is which one leads.
