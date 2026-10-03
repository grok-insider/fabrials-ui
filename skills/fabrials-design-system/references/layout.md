# Layout recipes

Page anatomy for the surfaces Fabrials builds. Each recipe names the components, the structure and the classes or tokens that hold it together. `DESIGN.md` › "Layout and composition" is the rule; this file is how to apply it. Tailwind snippets assume the `@fabrials/ui/tailwind.css` bridge; without Tailwind, use the same tokens in CSS.

## The frame every page shares

- **Gutter.** Page content starts at `--fui-page-padding`: 24 px, and 16 px below 768 px (`tokens.css`). Headers, sections and footers use the same gutter, so their left edges line up.
- **No centred page column.** Never `mx-auto`, `margin-inline: auto`, `justify-content: center` or `text-center` on a page container, hero or section. A reading limit is a `max-width` on the text block (`max-w-[38rem]`, `max-width: 68ch`), anchored left.
- **Wide screens get room, not an island.** At 1440 and 2560 px, tables, rows and panels grow; prose keeps its measure and the rest of the row stays free on the right or goes to a panel. Do not wrap the page in an 80rem centred box. `--fui-content` (80rem) is a cap for a text block or a form, never a centred container.
- **Sections** are separated by a hairline and vertical space (`border-t py-14` on the site home), not by boxes.
- **Headings.** Hero: display face 40 to 80 px, `leading-[0.98]`. Page title: `PageHeader` (display, 24 px). Marketing section title: display 28 px (`font-display text-[1.75rem] leading-tight font-semibold`). Subsections: 16 px semibold (`SectionHeader`).
- **Phones.** Single column, 16 px gutter, 44 px targets, nothing scrolls sideways except a labelled table region.

Breakpoints that already exist in the code:

| Width | What changes |
| --- | --- |
| below 768 px, or a coarse pointer | Controls become 44 px; `SiteHeader` hides `navigation` and shows `mobileMenu`; dialog footers stretch their buttons |
| below 768 px | Gutter 16 px; `Sidebar` becomes a sheet; `SettingsSection` stacks |
| from 1024 px | `AuthLayout` shows its `aside` beside the form |
| docs: 1023 / 1279 / 1800 px | Sidebar to a sheet with a phone bar / page index moves inline / wider columns and larger reading type |

## Site header

`SiteHeader` spans the window. Structure: `.fui-site-header` (sticky, hairline bottom, translucent background) > `.fui-site-header-inner` (56 px tall, padded by the page gutter) > brand, navigation (fills the row), actions (pushed right).

```tsx
import { Button, ProductLockup, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SiteHeader, ThemeSwitcher } from "@fabrials/ui";
import { Menu } from "lucide-react";

<SiteHeader
  brand={<a href="/" aria-label="Spanreed home"><ProductLockup product="Spanreed" gem="ruby" size="sm" /></a>}
  navigation={<nav aria-label="Main navigation">{links}</nav>}
  actions={<><ThemeSwitcher value={theme} onValueChange={setTheme} /><Button size="sm">Sign in</Button></>}
  mobileMenu={
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}><Menu /></SheetTrigger>
      <SheetContent side="right">
        <SheetHeader><SheetTitle>Spanreed</SheetTitle></SheetHeader>
        <nav aria-label="Mobile navigation">{links}</nav>
      </SheetContent>
    </Sheet>
  }
/>
```

- Links are plain anchors; mark the current one with `aria-current="page"` (it turns to full ink). Do not add pills, underlines or blue to the active link.
- Navigation that will grow groups its items in a `NavigationMenu` panel (fabrials.com's Products menu groups tools by how people use them, each with its gem).
- Actions: theme switcher, one sign-in or primary action, optionally a repository link. No icon rows.
- Reference: `apps/site/components/site-shell.tsx`.

## Landing hero

Left-aligned and asymmetric: headline, one lead paragraph, one command or primary action and one quiet link on the left; the storm on the right. The hero is never centred and never a card.

```tsx
import { Button, DitherScene } from "@fabrials/ui";

<main id="main-content" className="w-full px-(--fui-page-padding)">
  <section className="hero relative isolate -mx-(--fui-page-padding) px-(--fui-page-padding) pt-16 pb-24 lg:pt-24" aria-labelledby="hero-title">
    <DitherScene className="hero-storm" />
    <div className="relative z-10 max-w-[38rem]">
      <h1 id="hero-title" className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.015em] text-balance">
        See what your coding subscriptions cost.
      </h1>
      <p className="mt-6 max-w-[46ch] text-lg leading-7 text-muted-foreground">One sentence that says who it is for and what it does.</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button size="lg">Install Spanreed</Button>
        <a href="/docs" className="text-sm underline underline-offset-4">Read the docs</a>
      </div>
    </div>
  </section>
</main>
```

```css
/* The storm covers the right of the hero and fades into the page. */
.hero-storm.fui-dither-scene { left: 40%; }
@media (max-width: 767px) {
  .hero-storm.fui-dither-scene { left: 0; top: auto; height: 12rem; }
  .hero { padding-bottom: 14rem; }
}
```

- `DitherScene` is absolute: the parent needs `position: relative` (and `isolation: isolate` if other layers sit around it). `variant="hero"` puts the dense front on the right; text stays on the calm left or on a solid surface.
- The scene's `reveal` (1200 ms by default, skipped under reduced motion) is the page's one orchestrated moment. Nothing else on the page animates on load.
- On phones the storm moves below the text, it never sits behind it.
- A command can replace the button (`PackageInstall` or `Snippet`), as on ui.fabrials.com.
- A large `DitherGem` (40 px) may stand beside the headline. Only one of them reveals: `DitherGem` has no reveal unless you pass one, `DitherScene` reveals unless you pass `reveal={0}`.
- References: `apps/site/app/page.tsx` with `apps/site/app/globals.css` (`.home-storm`), `stories/highstorm.stories.tsx` › Landing with `stories/highstorm.css`.

## Product or feature index

Rows, not a grid of identical cards. Each row: mark, name, one line, one link, separated by hairlines.

```tsx
import { DitherGem } from "@fabrials/ui";

<ul className="border-t">
  {products.map((p) => (
    <li key={p.name} className="grid grid-cols-[28px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b py-4 md:grid-cols-[28px_minmax(0,3fr)_minmax(0,6fr)_minmax(0,3fr)] md:gap-x-5">
      <DitherGem gem={p.gem} size={28} className="self-center" />
      <h3 className="font-display text-[1.375rem] leading-tight font-semibold">{p.name}</h3>
      <p className="col-start-2 text-muted-foreground md:col-start-auto">{p.summary}</p>
      <a href={p.href} className="col-start-2 text-sm text-brand-ink underline underline-offset-4 md:col-start-auto md:justify-self-end">{p.linkLabel}</a>
    </li>
  ))}
</ul>
```

- The link names its destination ("Install Spanreed", "Read the Syl docs"), without an arrow.
- Numbers in a leading column only when they are real counts (the site home shows component counts); numbered markers only for real sequences.
- A catalogue of dozens of peer entries with search and filters (ui.fabrials.com `/components`) may use one bordered panel split into cells by hairlines (`.docs-index-grid` in `apps/site/components/docs/docs.css`): no per-item card, shadow or icon tile.
- `SuggestionGrid` is for empty-state prompts in a chat or workspace, not for listing products.

## Brand panel on a public page

A public stats page or product overview may carry one `DitherBand` above the heading it signs, inside a panel:

```tsx
<section className="overflow-hidden rounded-lg border bg-card [--fui-dither-bg:var(--card)]" aria-labelledby="usage-title">
  <DitherBand />
  <div className="grid gap-3 px-5 pt-4 pb-5">
    <h2 id="usage-title" className="font-display text-[1.75rem] leading-tight font-semibold">Usage AI</h2>
    <p className="text-muted-foreground">Anonymous weekly totals from people who share a snapshot.</p>
  </div>
</section>
```

At most one band per view. Set `--fui-dither-bg` to the surface the canvas sits on so the ramp fades into it.

## Documentation

The ui.fabrials.com docs are the reference (`apps/site/components/docs/docs-shell.tsx`, `docs-toc.tsx`, `docs.css`, `apps/site/lib/docs-nav.ts`). They are site code, not package exports: adapt them, keep the structure.

- **Frame.** `SiteHeader` on top; below it a three-column grid: `minmax(17.5rem, 1fr) minmax(0, 56rem) minmax(16rem, 1fr)`. The frame (`DocsFrame`) stays mounted between pages so the sidebar keeps its scroll and open groups.
- **Sidebar panel.** Its `--sidebar` background and right hairline run to the window's left edge; the navigation sits against the article. Contents, top to bottom: search button (`Search` + `Kbd` Ctrl K), the library switcher, collapsible groups, a `RepoInfo` link.
- **Library switcher.** A `DropdownMenu` whose trigger shows the root's mark (`DitherGem` for Fabrials UI, a lucide icon or initials for others), title and one-line description, with a check on the current root. Roots: guides, Fabrials UI, WebMCP & MCP, all libraries, each library.
- **Navigation groups.** `Collapsible` per group; pages hang off a 1 px hairline rail; the current page has `aria-current="page"`, an `--accent` background and a 2 px Stormlight bar on the rail.
- **Article.** `PageHeader` with `eyebrow` as sentence-case context (a breadcrumb such as "Components / Controls"), title, description and the page's actions; then content in a single column where prose stops at 80ch and code, tables and previews take the full column; then a previous/next pager.
- **Page index.** "On this page" as a thread: an SVG line that steps in for subsections with a short diagonal; the stretch covering the sections on screen is Stormlight and ends in a dot; a "Back to top" link. Below 1280 px it becomes an inline collapsible above the content.
- **Phones.** Below 1024 px the sidebar becomes a start-side dialog opened from a sticky phone bar ("Browse docs" + search); the pager stacks below 640 px.
- **Large screens.** From 1800 px the columns widen (sidebar 18.5rem, article 60rem, index 17rem) and reading type grows to 16 px; the line length does not.
- Code samples use `CodePanel`, `CodeTabs` and `PackageInstall`; file trees use `Files`; callouts use `Alert`. Syntax colours are the muted `--fui-syntax-*` inks, never Stormlight.

## App workspace

Operational screens (consoles, trackers, mail, admin) use a shell with persistent navigation. Two supported shells:

- `WorkspaceShell`: `navigation` slot, `header` slot and a `main` with a skip link. The host renders its own `aside`/`nav` and phone sheet.
- `SidebarProvider` + `Sidebar` + `SidebarInset`: the shadcn-style sidebar with groups, badges, an icon-collapsed state (`collapsible="icon"`, Ctrl/Cmd+B) and a sheet below 768 px.

Recipes for a mail-style workspace (0.8): the top bar is `AppHeader` (56 px, no blur; `brand`, `navigation`, a `command` slot and `actions`); it answers to its own width, so nothing in it uses the viewport. Below it the panes are `ResizablePanelGroup` with a 1 px `ResizableHandle` (name every handle; a `minSize` in rem keeps a pane usable). Navigation in a pane, a sheet or a popover is `SidebarMenu` rows of `size="touch"` (no provider); which mailbox or project you are in is a `NavSwitcher` above them. Records in the list pane are `ItemGroup` and `Item stretch` rows; the open one is `current` (soft Stormlight fill, 2 px bar), a picked one is `selected`. A settings dialog with a section rail is `Tabs orientation="vertical"` (`scrollable` on a phone), and the sections in its panel are `SettingsSection`s that follow the panel's width.

```tsx
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, Button, CollectionToolbar, Input, PageHeader, ProductLockup,
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
  Table, TableBody, TableHead, TableHeader, TableRow, ThemeSwitcher,
} from "@fabrials/ui";
import { Users } from "lucide-react";

<SidebarProvider>
  <Sidebar collapsible="icon">
    <SidebarHeader><ProductLockup product="X Tracker" gem="emerald" /></SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Monitor</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Accounts"><Users aria-hidden /><span>Accounts</span></SidebarMenuButton>
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
  <SidebarInset>
    <header className="flex min-h-14 items-center gap-3 border-b px-(--fui-page-padding)">
      <SidebarTrigger />
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Accounts</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      <span className="flex-1" />
      <ThemeSwitcher value={theme} onValueChange={setTheme} />
    </header>
    <div className="p-(--fui-page-padding)">
      <PageHeader title="Accounts" description="Accounts you monitor and when each was last read." actions={<Button>Add account</Button>} />
      <CollectionToolbar search={<Input type="search" aria-label="Search accounts" placeholder="Search accounts…" />} filters={filters} actions={exportButton} />
      <Table aria-label="Accounts" stickyHeader>
        <TableHeader><TableRow><TableHead>Account</TableHead><TableHead numeric>Posts</TableHead></TableRow></TableHeader>
        <TableBody>{rows}</TableBody>
      </Table>
    </div>
  </SidebarInset>
</SidebarProvider>
```

- **Header row.** 56 px (`--fui-header-height`), hairline bottom: sidebar trigger, breadcrumb, a spacer, a search button with `Kbd`, the theme switcher. The content column fills the width; do not centre it.
- **Page header.** One `PageHeader` per page: title, one-line description, the primary action. Status of the whole page goes in `actions` as a `StatusDot` with a word.
- **Collection.** `CollectionToolbar` directly above the collection: search on the left, filters (`ToggleGroup` for views and ranges, `Select`/`MultiSelect`/`NativeSelect` for fields, `FilterChip` for active filters) and collection actions on the right. `BulkActions` appears above the table only once rows are selected.
- **Records are rows.** `Table` with `numeric` columns right-aligned in tabular figures; the table scrolls inside its own labelled region. Row actions: a `DropdownMenu` from a button that names the record. Do not render records as cards.
- **Summary numbers.** `StatGroup` of `Stat` above the collection when the page has totals; `SeriesChart` or `Sparkline` for trends; `Meter` for quotas.
- **Panels.** Group a chart or a secondary table in one panel (`border`, `rounded-lg`, `bg-card`) with a title row and hairline dividers inside. Never a card inside a card.
- **Actions on one record.** A `Toolbar variant="bar" sticky` under the title: one tab stop, `ToolbarGroup`s named for what they hold, a `ToolbarSeparator` between them. The primary action is `variant="secondary"` with `reveal="early"` so its label appears once there is room; low-priority actions are `tier="low"` and reappear as items of a `DropdownMenu` whose trigger is a `tier="overflow"` `ToolbarButton`. The toolbar measures its own width, so it works in a 358 px pane and a 62 rem column alike.
- **Detail.** A record opens on its own URL with `NavTabs` for its sections, or in a `Sheet` (`side="right"`) for a quick look. Properties use `DescriptionList`; history uses `Timeline`.
- **Density.** `data-density="compact"` on a container tightens its controls to 32 px and its rows; it is a composition choice for dense tables, not a user preference.
- References: `stories/patterns.stories.tsx` › Console (sidebar shell), `stories/foundation.stories.tsx` › Accounts (`WorkspaceShell`), `stories/monitoring.stories.tsx`.

## Settings

A settings page is a left-anchored column of `SettingsSection` rows separated by hairlines: title, description and status on the left (13rem), controls on the right; stacked below 768 px.

```tsx
import { Badge, Button, Field, Input, PageHeader, SettingsSection, Switch } from "@fabrials/ui";

<PageHeader title="Settings" description="How this workspace looks, notifies and connects." />
<div className="grid max-w-(--fui-content) gap-6">
  <SettingsSection id="profile" title="Profile" description="How other members see you." status={<Badge tone="success">Saved</Badge>}>
    <Field label="Display name">{(props) => <Input {...props} defaultValue="Ada" />}</Field>
  </SettingsSection>
  <SettingsSection id="digest" title="Daily digest" description="A summary every morning, in the workspace time zone.">
    <label className="flex items-center gap-3"><Switch defaultChecked /> Email me a daily digest</label>
  </SettingsSection>
  <SettingsSection id="danger" title="Remove this machine" description="Local history stays on disk; the link is revoked.">
    <Button variant="destructive">Unlink machine</Button>
  </SettingsSection>
</div>
```

- `Switch` for a change that takes effect now; `Checkbox` inside a form saved together; `RadioGroup` for one choice in a form; `ThemeSwitcher` for the theme.
- Save state is shown where it happened (a `Badge` in the section's `status`, or a toast for a completed action), never only in a global banner.
- Destructive actions sit last and confirm with `AlertDialog` or `ConfirmDialog`; the confirm button names the consequence.
- The older Settings story (`stories/patterns.stories.tsx` › Settings) stacks `Card`s in a centred column; prefer `SettingsSection` (`stories/generic-patterns.stories.tsx` › Settings sections).

## Sign-in

The storm lives on sign-in. Two layouts:

- **`AuthLayout` with an aside** (product sign-in). The form card, brand and footer note in the main column; from 1024 px the `aside` shows beside it on the `--sidebar` surface, positioned so a `DitherScene` inside it fades into that surface. The ui.fabrials.com demo is `apps/site/components/ui-demos-more.tsx` › `auth-layout`.

```tsx
import { AuthLayout, Button, DitherScene, Field, Input, ProductLockup } from "@fabrials/ui";

<AuthLayout
  brand={<ProductLockup product="Open Email" gem="emerald" size="lg" />}
  title="Sign in to your mailbox"
  description="Use your mailbox password. Your administrator can reset it."
  footer="Your password is used only by this server."
  aside={<DitherScene variant="full" />}
  actions={<PublicPreferences />}
>
  <form className="grid gap-4">
    <Field label="Email address">{(props) => <Input {...props} type="email" autoComplete="username" />}</Field>
    <Field label="Password">{(props) => <Input {...props} type="password" autoComplete="current-password" />}</Field>
    <Button type="submit" size="lg">Sign in</Button>
  </form>
</AuthLayout>
```

- **Full storm** (house sign-in, `stories/highstorm.stories.tsx` › Sign in): a positioned page with `DitherScene variant="full"` behind it and a small solid card (`bg-card`, hairline, 8 px corners, about 22.5rem) anchored at the left gutter and vertically centred. Text never sits on the dither.
- One primary action; say what the provider can read ("We read your X handle and avatar, nothing else").
- `AuthLayout` is the page's `<main>` since 0.9 (the card, the footer note and the `actions` corner are inside it; the `aside` sits beside it): do not wrap it in another `<main>`. Where the host already has one around it, pass `as="div"`. `id`, `aria-label` and the other props go to that landmark (`id="main"` for a skip link).
- `AuthLayout` places its own card: beside an `aside` it anchors to the inline start of its column from 1024 px (`align="auto"`), without one it centres; `align="start"` or `"center"` override. Do not add more centring around it. The appearance and language menu goes in `actions` (a corner control that follows the card in the DOM), not in an absolutely positioned wrapper of your own.
- `MoonPhase` and `Starfield` are allowed only on sign-in and landing surfaces and stop under reduced motion.

## States

### A first load with `Loading`

```tsx
import { Loading, placeholderList, placeholderText } from "@fabrials/ui";

const placeholders = placeholderList(5, (i) => ({ id: `p${i}`, name: placeholderText(16, i), plan: placeholderText(6, i + 2) }));

<Loading when={!accounts} label="Loading accounts">
  <AccountsTable rows={accounts ?? placeholders} />
</Loading>
```

- Render the same components the finished view uses; `Loading` turns text into a bar per line, media into blocks, coloured controls into neutral shapes, keeps borders and surfaces, removes colour, and changes only paint, so nothing moves when data arrives.
- Placeholder lengths and row counts close to the real data (`placeholderText(length, seed)`, `placeholderList(count, make)`).
- `label` names what loads for assistive technology; the content is inert while loading, so keep the refresh button outside.
- `data-skeleton="keep|hide|block|fill"` tunes one part; `useLoading()` lets a component skip work it cannot show.
- As a Suspense fallback or in a Next.js `loading.tsx`: the same `<Loading when>` with placeholders; it renders on the server.
- Full guide: https://ui.fabrials.com/docs/loading-states (`apps/site/content/loading-states.mdx`).

Every collection and panel has these states. Put them where the content would be, at the content's size.

| State | Use | Notes |
| --- | --- | --- |
| First load | The real components with placeholder data inside `<Loading when label>` (0.7): it paints them as their own skeleton with no layout shift. Older versions: `Skeleton` blocks; `SidebarMenuSkeleton` in a sidebar | Not a centred spinner on an empty page, not hand-drawn grey boxes |
| Refresh | Keep the last value and show when it was read (`RelativeTime`) | A stale value says so: `StatePanel state="stale"` or a hint |
| Long wait with unknown duration | `Spinner` or `Button loading` with text that says what is happening | `Progress` only when the fraction is real |
| Empty | `StatePanel state="empty"` with the next action | Title says what is missing, description what to do |
| No results | `StatePanel state="empty"` with "Clear filters" | Keep the toolbar visible |
| Error | `StatePanel state="error"` (role alert) or an inline `Alert variant="destructive"` | What happened, what is unchanged, how to retry; no apology |
| Offline | `StatePanel state="offline"` | Show the last snapshot |
| Completed action | `toast` from a mounted `Toaster` | Errors that need a decision stay on the page |

`StatePanel` aligns to the start by default; `align="center"` only inside a bounded empty region (an empty table body, a blank chat). A 404 page is left-anchored like any page: display title, one sentence, a list of links (`apps/site/app/not-found.tsx`).

## Responsive checks

- 390 px: one column, 16 px gutter, no sideways scroll, 44 px targets (segmented toggles and tabs keep their look and get a 44 px hit area there), the storm below the hero text, menus in sheets.
- 768 px: gutter 24 px, sidebar visible, settings in two columns.
- 1440 px: the everyday desktop; the visual suite's widest size.
- 2560 x 1315: the owner's screen. Content still starts at the left gutter; tables and rows use the width; prose keeps its measure; no giant empty centred column and no stretched 3-up card rows.
- 200 % text size: nothing clips or overlaps.
