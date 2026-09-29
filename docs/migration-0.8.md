# Adopting Fabrials UI 0.8

0.8 keeps every 0.7 export, token and class name. It adds public API (the pieces
Open Email had to build itself while moving to Highstorm) and folds in what was
prepared as 0.7.1, which was never published. Nothing in a host has to change to
update; each entry below says which host workaround the new piece makes
deletable.

## Carried over from 0.7.1

### Theme islands

`.light` and `[data-theme="light"]` now scope the light palette next to `:root`
(dark already had `.dark` and `[data-theme="dark"]`). A light island inside a
dark root, such as a preview of how a logo looks in the other theme, resets to
light instead of inheriting dark. A product that draws a gem inside an island
sets `data-gem` on the island's own root, because `[data-gem]` selectors match
only the element that carries them. Additive: nothing changes for a page that
sets the theme on `<html>` only.

### Touch targets of segmented controls

`Toggle` (and so `ToggleGroup` and `ThemeSwitcher`) and the tabs of a segmented
`TabsList` were 38 px tall on touch and narrow screens, because they sit inside a
group with 3 px of padding. Their hit area is now extended by that padding to
44 px with a pseudo-element, so nothing in the layout moves. Nothing to change in
hosts; a host that worked around it (a min-height override on the toggles) can
drop the override. In 0.8 the painted control itself is 44 px there too; see
"Toggle and ToggleGroup at 44 px" below.

## New in `@fabrials/ui` 0.8

### Batch 1: controls
