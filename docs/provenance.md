# Provenance of catalog additions

These controls were copied into `@fabrials/ui` on 2026-09-22 because a product
screen already imported them. Each source file starts with the same origin
note. Fabrials will modify the copies. The public registry at ui.fabrials.com
does not document these controls; it stays the WebMCP catalog.

The package already owned button, input, textarea, select, checkbox, switch,
label, dialog, sheet, dropdown menu, tooltip, badge, card, alert, separator,
skeleton, progress, table, tabs, combobox, and field. Those were not copied
again. Dropdown items accept the shadcn `variant="destructive"` alias in
addition to `destructive`, so Radiant menus can use the existing menu.

| File | Origin | Requested by |
| --- | --- | --- |
| `collapsible.tsx` | shadcn/ui (Base UI Collapsible) | Radiant chat (search, reasoning, sources, tools) |
| `scroll-area.tsx` | shadcn/ui (Base UI Scroll Area) | Radiant suggestions |
| `spinner.tsx` | shadcn/ui | Radiant login and composer |
| `button-group.tsx` | shadcn/ui (Base UI render helpers) | Radiant message actions |
| `input-group.tsx` | shadcn/ui | Radiant composer |
| `hover-card.tsx` | shadcn/ui (Base UI Preview Card) | Radiant composer, attachments, citations |
| `popover.tsx` | shadcn/ui (Base UI Popover) | Copied from the fabrials.com kit. No in-scope screen imports it yet. |
| `navigation-menu.tsx` | shadcn/ui (Base UI Navigation Menu) | fabrials.com header |
| `sidebar.tsx` | shadcn/ui sidebar | Radiant app shell and the ai-relay dashboard |
| `command.tsx` | shadcn/ui (cmdk) | Radiant composer |
| `carousel.tsx` | shadcn/ui (Embla Carousel) | Radiant inline citations |
| `toaster.tsx` | shadcn/ui sonner wrapper | Radiant and ai-relay toasts |

`class-variance-authority`, `cmdk`, `embla-carousel-react`, and `sonner` are
dependencies of this package. Hosts should not depend on them directly.
`@base-ui/react` and `lucide-react` stay package dependencies too. The
catalog source does not import Radix. `cmdk` 1.1.1 still depends on
`@radix-ui/react-dialog` for its own dialog primitive.

Left in the host on purpose:

- fabrials.com `bubble` and `message` are product composition, not catalog controls.
- Radiant chat keeps Streamdown, `motion`, and `@radix-ui/react-use-controllable-state` for reasoning state.
- news-monitor, grok-desktop-portable, and the Ditox GUI were not switched in this pass.
