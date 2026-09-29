// @vitest-environment jsdom
// Behaviour of the 0.8 structure and navigation pieces: Item focus order and targets, the sidebar without a provider and
// its shortcut, NavSwitcher focus, Tabs (vertical arrows, scrollable reveal, RTL), heading focus, ResizableHandle.
// Markup and CSS contracts are asserted in tests/unit/structure.test.tsx (bun); this file needs a DOM, so it lives with
// the site's jsdom suite and runs against the built package (bun run build first).
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppHeader,
  AppHeaderAction,
  AppHeaderBrand,
  AppHeaderCaret,
  AppHeaderLabel,
  AppHeaderLink,
  AppHeaderNav,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Item,
  ItemActions,
  ItemCheck,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemTitle,
  NativeCheckbox,
  NavSwitcher,
  NavSwitcherContent,
  NavSwitcherItem,
  NavSwitcherSeparator,
  NavSwitcherTrigger,
  PageHeader,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SectionHeader,
  SettingsSection,
  Sidebar,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";

// jsdom has no layout engine and no ResizeObserver; the resizable library needs the constructor to mount.
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= NoResizeObserver;

// jsdom has no matchMedia; the sidebar reads (max-width: 767px) to choose between the panel and the phone sheet.
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Item", () => {
  it("keeps the focus order checkbox, link, controls, and Enter follows the link while the controls stay separate targets", async () => {
    const user = userEvent.setup();
    const star = vi.fn();
    const follow = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <ItemGroup aria-label="Messages">
        <Item stretch current unread>
          <ItemCheck>
            <NativeCheckbox aria-label="Select: Plan" />
          </ItemCheck>
          <ItemContent>
            <ItemTitle render={<h3 />}>
              <ItemLink href="#m1" current onClick={follow}>Plan</ItemLink>
            </ItemTitle>
            <ItemDescription>Preview</ItemDescription>
          </ItemContent>
          <ItemActions>
            <button type="button" onClick={star}>Star</button>
          </ItemActions>
        </Item>
      </ItemGroup>,
    );
    const item = screen.getByRole("listitem");
    expect(item.getAttribute("data-current")).toBe("");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Plan");
    const link = screen.getByRole("link", { name: "Plan" });
    expect(link.getAttribute("aria-current")).toBe("true");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Select: Plan" }));
    await user.tab();
    expect(document.activeElement).toBe(link);
    await user.keyboard("{Enter}");
    expect(follow).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Star" }));
    await user.keyboard("{Enter}");
    expect(star).toHaveBeenCalledTimes(1);
    expect(follow).toHaveBeenCalledTimes(1); // the control is its own target, not the row's
  });

  it("a button target selects with Space and Enter, and reports it with aria-pressed", async () => {
    const user = userEvent.setup();
    function Copies() {
      const [picked, setPicked] = useState("");
      return (
        <ItemGroup aria-label="Copies">
          {["One", "Two"].map((name) => (
            <Item key={name} stretch current={picked === name}>
              <ItemContent>
                <ItemTitle>
                  <ItemLink render={<button type="button" aria-pressed={picked === name} onClick={() => setPicked(name)} />}>{name}</ItemLink>
                </ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      );
    }
    render(<Copies />);
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "One" }).getAttribute("aria-pressed")).toBe("true");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Two" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "One" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getAllByRole("listitem").filter((row) => row.hasAttribute("data-current"))).toHaveLength(1);
  });

  it("a separator in a group leaves the list valid: only li children, and the hidden one is not announced", () => {
    render(
      <ItemGroup aria-label="List">
        <Item>a</Item>
        <li aria-hidden="true" />
      </ItemGroup>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1); // the hidden li is out of the accessibility tree
  });
});

describe("AppHeader", () => {
  function Header() {
    return (
      <AppHeader
        brand={<AppHeaderBrand href="#home">Open Email</AppHeaderBrand>}
        navigation={
          <AppHeaderNav label="Workspace">
            <AppHeaderLink href="#mail" current><span>Mail</span></AppHeaderLink>
            <AppHeaderLink href="#contacts"><span>Contacts</span></AppHeaderLink>
          </AppHeaderNav>
        }
        command={<button type="button">Commands</button>}
        actions={
          <>
            <IconButton label="Settings"><svg aria-hidden="true" /></IconButton>
            <DropdownMenu>
              <DropdownMenuTrigger render={<AppHeaderAction />}>
                <AppHeaderLabel>alex@example.test</AppHeaderLabel>
                <AppHeaderCaret />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
    );
  }

  it("tabs through brand, navigation, command, settings and the account menu in that order, and marks the current link", async () => {
    const user = userEvent.setup();
    render(<Header />);
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeTruthy();
    const order = ["Open Email", "Mail", "Contacts", "Commands", "Settings", "alex@example.test"];
    for (const name of order) {
      await user.tab();
      expect(document.activeElement?.textContent || document.activeElement?.getAttribute("aria-label")).toBe(name);
    }
    expect(screen.getByRole("link", { name: "Mail" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Contacts" }).hasAttribute("aria-current")).toBe(false);
  });

  it("the account trigger is a menu button that opens with Enter, takes Escape and gives focus back", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const trigger = screen.getByRole("button", { name: "alex@example.test" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Sign out" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Sign out" })).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});

describe("Sidebar", () => {
  const rows = (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="touch" isActive render={<a href="#inbox" />}>
          <span>Inbox</span>
          <SidebarMenuBadge>12</SidebarMenuBadge>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );

  it("renders rows without a provider and the count is part of the link's name", () => {
    render(<nav aria-label="Mailboxes">{rows}</nav>);
    const link = screen.getByRole("link", { name: /^Inbox\s*12$/ });
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-size")).toBe("touch");
    expect(link.querySelector("span[data-slot='sidebar-menu-badge']")?.textContent).toBe("12");
  });

  function mount(props: Partial<React.ComponentProps<typeof SidebarProvider>> = {}) {
    const { open = true, ...rest } = props;
    return render(
      <SidebarProvider {...rest} defaultOpen={open}>
        <Sidebar collapsible="offcanvas" labels={{ title: "Navegación", description: "Navegación principal" }}>
          {rows}
          <SidebarRail label="Alternar navegación" />
        </Sidebar>
        <SidebarTrigger label="Alternar" />
        <input aria-label="Field" />
        <div contentEditable suppressContentEditableWarning role="textbox" aria-label="Editor" />
      </SidebarProvider>,
    );
  }
  const expanded = () => document.querySelector(".fui-sidebar")?.getAttribute("data-state");

  it("Ctrl+B toggles it, but leaves the keystroke to a field or an editor (Ctrl+B is Bold there)", async () => {
    mount();
    expect(expanded()).toBe("expanded");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    await waitFor(() => expect(expanded()).toBe("collapsed"));
    const input = screen.getByRole("textbox", { name: "Field" });
    const blocked = fireEvent.keyDown(input, { key: "b", ctrlKey: true });
    expect(blocked).toBe(true); // not prevented: the field keeps it
    expect(expanded()).toBe("collapsed");
    const editor = screen.getByRole("textbox", { name: "Editor" });
    Object.defineProperty(editor, "isContentEditable", { value: true });
    expect(fireEvent.keyDown(editor, { key: "b", metaKey: true })).toBe(true);
    expect(expanded()).toBe("collapsed");
    fireEvent.keyDown(window, { key: "B", metaKey: true });
    await waitFor(() => expect(expanded()).toBe("expanded"));
  });

  it("keyboardShortcut picks another key or turns the shortcut off", async () => {
    const view = mount({ keyboardShortcut: "\\" });
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(expanded()).toBe("expanded");
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });
    await waitFor(() => expect(expanded()).toBe("collapsed"));
    view.unmount();
    mount({ keyboardShortcut: false });
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(expanded()).toBe("expanded");
  });

  it("persist={false} writes no cookie, and by default the state is remembered", async () => {
    document.cookie = "sidebar_state=; max-age=0; path=/";
    const view = mount({ persist: false });
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar" }));
    expect(document.cookie).not.toContain("sidebar_state");
    view.unmount();
    mount();
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar" }));
    expect(document.cookie).toContain("sidebar_state=false");
    document.cookie = "sidebar_state=; max-age=0; path=/";
  });

  it("names its trigger and rail in the host's language", () => {
    mount();
    expect(screen.getByRole("button", { name: "Alternar" }).getAttribute("aria-expanded")).toBe("true");
    const rail = document.querySelector<HTMLButtonElement>("[data-slot='sidebar-rail']")!;
    expect(rail.getAttribute("aria-label")).toBe("Alternar navegación");
    expect(rail.getAttribute("title")).toBe("Alternar navegación");
  });
});

describe("NavSwitcher", () => {
  function Demo() {
    return (
      <NavSwitcher>
        <NavSwitcherTrigger label="Switch mailbox" mark="A" title="ana@example.test" description="Personal" />
        <NavSwitcherContent label="Switch mailbox" listLabel="Mailboxes" footer={<p>Stale</p>}>
          <NavSwitcherItem render={<a href="#all" />}>All inboxes</NavSwitcherItem>
          <NavSwitcherItem render={<a href="#ana" />} current description={<span>Active</span>}>ana@example.test</NavSwitcherItem>
          <NavSwitcherSeparator />
          <NavSwitcherItem render={<a href="#link" />}>Link a mailbox</NavSwitcherItem>
        </NavSwitcherContent>
      </NavSwitcher>
    );
  }

  it("opens on the trigger, focuses the current link, names the landmark, and Escape returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: /^Switch mailbox:\s*ana@example\.test/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    const nav = await screen.findByRole("navigation", { name: "Mailboxes" });
    expect(nav.querySelectorAll("li[aria-hidden='true']")).toHaveLength(1);
    const current = screen.getByRole("link", { name: /ana@example.test/ });
    expect(current.getAttribute("aria-current")).toBe("page");
    await waitFor(() => expect(document.activeElement).toBe(current));
    expect(current.querySelector(".fui-nav-switcher-check")).not.toBeNull();
    expect(screen.getByText("Stale")).toBeTruthy(); // the footer sits outside the scrolling list
    expect(nav.contains(screen.getByText("Stale"))).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Link a mailbox" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("navigation", { name: "Mailboxes" })).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("opens with Enter and Space from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("navigation", { name: "Mailboxes" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("navigation", { name: "Mailboxes" })).toBeNull());
    await user.keyboard(" ");
    expect(await screen.findByRole("navigation", { name: "Mailboxes" })).toBeTruthy();
  });
});

describe("Tabs", () => {
  const labels = ["Mailboxes", "Appearance", "Privacy"];
  function Rail({ dir }: { dir?: "rtl" }) {
    return (
      <Tabs defaultValue="Mailboxes" orientation="vertical" dir={dir}>
        <TabsList aria-label="Sections">
          {labels.map((label) => <TabsTrigger key={label} value={label}>{label}</TabsTrigger>)}
        </TabsList>
        {labels.map((label) => <TabsContent key={label} value={label}>{label} panel</TabsContent>)}
      </Tabs>
    );
  }

  it("a vertical rail moves with ArrowDown and ArrowUp, Home and End, and marks its orientation", async () => {
    const user = userEvent.setup();
    render(<Rail />);
    const list = screen.getByRole("tablist", { name: "Sections" });
    expect(list.getAttribute("aria-orientation")).toBe("vertical");
    expect(list.getAttribute("data-orientation")).toBe("vertical");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Mailboxes" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Appearance" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Privacy" }));
    await user.keyboard("{ArrowUp}{Home}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Mailboxes" }));
  });

  function Strip({ start }: { start: string }) {
    const [value, setValue] = useState(start);
    return (
      <Tabs value={value} onValueChange={(next) => setValue(String(next))}>
        <TabsList aria-label="Sections" scrollable>
          {labels.map((label) => <TabsTrigger key={label} value={label}>{label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    );
  }
  /** Layout for jsdom: the list is 100 px wide from x=0 (or from x=300 when `rtl`), the selected tab is where the test says. */
  function layout(box: { left: number; width: number }, tabAt: (label: string) => { left: number; width: number }) {
    const rect = ({ left, width }: { left: number; width: number }) => ({ left, right: left + width, width, top: 0, bottom: 40, height: 40, x: left, y: 0, toJSON() {} }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("role") === "tablist") return rect(box);
      if (this.getAttribute("role") === "tab") return rect(tabAt(this.textContent ?? ""));
      return rect({ left: 0, width: 0 });
    });
    const scrollBy = vi.fn();
    HTMLElement.prototype.scrollBy = scrollBy as unknown as typeof HTMLElement.prototype.scrollBy;
    return scrollBy;
  }

  it("keeps the selected tab in view by scrolling the list's own box, only when it is out of view, and never on other renders", async () => {
    const scrollBy = layout({ left: 0, width: 100 }, (label) => (label === "Privacy" ? { left: 140, width: 60 } : { left: 10, width: 60 }));
    const view = render(<Strip start="Privacy" />);
    await waitFor(() => expect(scrollBy).toHaveBeenCalledTimes(1));
    // Physical centre of the tab (170) minus centre of the list (50): the same delta serves left-to-right and right-to-left lists.
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 120 }));
    view.rerender(<Strip start="Privacy" />);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(scrollBy).toHaveBeenCalledTimes(1); // no selection change, no scroll: it never fights a manual scroll
    await userEvent.setup().click(screen.getByRole("tab", { name: "Mailboxes" })); // in view
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });

  it("reveals a tab that is off the start side too (right-to-left lists scroll the other way)", async () => {
    const scrollBy = layout({ left: 300, width: 100 }, (label) => (label === "Mailboxes" ? { left: 250, width: 60 } : { left: 320, width: 60 }));
    render(<Strip start="Mailboxes" />);
    await waitFor(() => expect(scrollBy).toHaveBeenCalled());
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -70 })); // (250 + 30) - (300 + 50)
  });
});

describe("headings", () => {
  it("focuses the heading through its ref, and a section is named by the id given in headingProps", async () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <>
        <PageHeader title="Tools" headingLevel={2} headingRef={ref} headingProps={{ tabIndex: -1, id: "tools-heading" }} />
        <SectionHeader title="Runs" headingLevel={3} headingProps={{ tabIndex: -1 }} />
        <SettingsSection title="Signature" headingLevel={4} headingProps={{ id: "sig-title" }}>x</SettingsSection>
      </>,
    );
    ref.current?.focus();
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "Tools" }));
    expect(screen.getByRole("heading", { level: 3, name: "Runs" }).getAttribute("tabindex")).toBe("-1");
    const region = screen.getByRole("region", { name: "Signature" });
    expect(region.getAttribute("aria-labelledby")).toBe("sig-title");
    expect(screen.getByRole("heading", { level: 4, name: "Signature" }).id).toBe("sig-title");
  });
});

describe("Resizable", () => {
  function Panes(props: { onLayoutChanged?: (layout: Record<string, number>, meta: { isUserInteraction: boolean }) => void; disabled?: boolean }) {
    return (
      <ResizablePanelGroup id="panes" orientation="horizontal" onLayoutChanged={props.onLayoutChanged} style={{ width: 400, height: 100 }}>
        <ResizablePanel id="a" defaultSize="30%" minSize="10%">A</ResizablePanel>
        <ResizableHandle label="Resize the list" disabled={props.disabled} />
        <ResizablePanel id="b" defaultSize="70%" minSize="10%">B</ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  it("a handle is a named, focusable separator; disabled takes it out of the tab order", () => {
    const view = render(<Panes />);
    const handle = screen.getByRole("separator", { name: "Resize the list" });
    expect(handle.getAttribute("tabindex")).toBe("0");
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(handle.className).toContain("fui-resizable-handle");
    view.rerender(<Panes disabled />);
    const disabled = screen.getByRole("separator", { name: "Resize the list" });
    expect(disabled.hasAttribute("tabindex")).toBe(false);
    expect(disabled.getAttribute("data-separator")).toBe("disabled");
  });
});
