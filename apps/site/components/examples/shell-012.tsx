"use client";

// The app a sidebar makes in 0.12: the account row at its foot, its search, the bar of the page beside it, a sheet that
// closes when the person navigates, and the tokens of the current row. Packages only and synthetic data.
import { useState, type CSSProperties } from "react";
import {
  Button,
  DropdownMenuItem,
  Sidebar,
  SidebarAccount,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInsetContent,
  SidebarInsetHeader,
  SidebarInsetHeaderActions,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSearch,
  useIsMobile,
  type ThemePreference,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const frame = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  blockSize: "24rem",
  borderRadius: "var(--fui-radius-lg)",
  overflow: "clip",
} as const;
const muted = { margin: 0, color: "var(--muted-foreground)" } as const;

const CHATS = ["Harbour notes", "Orchard survey", "Quarry ledger"];

function AccountMenu() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <div style={{ ...frame, inlineSize: "min(100%, 16rem)" }}>
      <SidebarProvider style={{ blockSize: "100%", display: "block", minBlockSize: 0 }}>
        <Sidebar collapsible="none" style={{ blockSize: "100%" }}>
          <SidebarContent />
          <SidebarFooter>
            <SidebarAccount email="ada@example.com" name="Ada Rivera" onThemeChange={setTheme} theme={theme}>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </SidebarAccount>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
      <p style={{ ...muted, padding: "var(--fui-space-2) var(--fui-space-3)" }}>Theme: {theme}</p>
    </div>
  );
}

function SidebarApp() {
  const [current, setCurrent] = useState(CHATS[0]);
  // On a phone the sidebar is the sheet, shut until its key is pressed: the page is the inset alone.
  const mobile = useIsMobile();
  return (
    <div style={{ ...frame, inlineSize: "min(100%, 40rem)" }}>
      <SidebarProvider style={{ blockSize: "100%", minBlockSize: 0 }}>
        {mobile ? null : (
          <Sidebar collapsible="none">
            <SidebarHeader>
              <SidebarSearch aria-label="Search chats" placeholder="Search chats" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>This week</SidebarGroupLabel>
                <SidebarMenu>
                  {CHATS.map((chat) => (
                    <SidebarMenuItem key={chat}>
                      <SidebarMenuButton isActive={chat === current} onClick={() => setCurrent(chat)}>
                        {chat}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarAccount email="ada@example.com" name="Ada Rivera" />
            </SidebarFooter>
          </Sidebar>
        )}
        <SidebarInset style={{ blockSize: "100%", minBlockSize: 0 }}>
          <SidebarInsetHeader title={current} visibility="always">
            <SidebarInsetHeaderActions>
              <Button size="sm" variant="ghost">
                Share
              </Button>
            </SidebarInsetHeaderActions>
          </SidebarInsetHeader>
          <SidebarInsetContent style={{ padding: "var(--fui-space-4)" }}>
            <p style={{ margin: 0 }}>{current}</p>
            <p style={{ ...muted, marginBlockStart: "var(--fui-space-2)" }}>Synthetic data. Three keys share this session.</p>
          </SidebarInsetContent>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export const sidebarAccountExamples: ExampleSet = {
  examples: [
    {
      id: "account",
      title: "The account row at the foot",
      description:
        "`SidebarAccount` shows the picture (or the initials of the name), the name and a second line, and a menu above it. With `theme` and `onThemeChange` the menu ends with a labelled group of three, ready for a `ThemeProvider`.",
      code: `<SidebarFooter>
  <SidebarAccount name="Ada Rivera" email="ada@example.com" theme={theme} onThemeChange={setTheme}>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Sign out</DropdownMenuItem>
  </SidebarAccount>
</SidebarFooter>`,
      render: () => <AccountMenu />,
      align: "start",
    },
    {
      id: "app",
      title: "The row, the search and the bar",
      description:
        "A sidebar app: `SidebarSearch` at the top, the rows, the account row at the foot, and `SidebarInsetHeader` over the page beside it. A part deep in the page adds its key to that bar with `SidebarInsetHeaderActions`, without knowing where the bar is.",
      code: `<SidebarProvider>
  <Sidebar collapsible="none">
    <SidebarHeader><SidebarSearch aria-label="Search chats" /></SidebarHeader>
    <SidebarContent>{…rows…}</SidebarContent>
    <SidebarFooter><SidebarAccount name={name} email={email} /></SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <SidebarInsetHeader title={current}>
      <SidebarInsetHeaderActions>
        <Button size="sm" variant="ghost">Share</Button>
      </SidebarInsetHeaderActions>
    </SidebarInsetHeader>
    <SidebarInsetContent>{…the page…}</SidebarInsetContent>
  </SidebarInset>
</SidebarProvider>`,
      render: () => <SidebarApp />,
      align: "start",
    },
  ],
};

function NavigationSidebar() {
  const [place, setPlace] = useState("overview");
  return (
    <div style={{ ...frame, inlineSize: "min(100%, 16rem)" }}>
      <SidebarProvider navigationKey={place} style={{ blockSize: "100%", display: "block", minBlockSize: 0 }}>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>North workspace</SidebarGroupLabel>
              <SidebarMenu>
                {["overview", "accounts", "keys"].map((one) => (
                  <SidebarMenuItem key={one}>
                    <SidebarMenuButton isActive={one === place} onClick={() => setPlace(one)}>
                      {one[0]!.toUpperCase() + one.slice(1)}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}

export const sidebarExamples: ExampleSet = {
  examples: [
    {
      id: "navigation",
      title: "A sheet that closes on navigation",
      description:
        "`navigationKey` is any value that changes when the person navigates (the host's pathname): the phone sheet closes when it does, so a row that is a link needs no handler of its own. `sheetCloseButton` puts the close key in a row of its own at the top of the sheet; `SidebarClose` is the same key for a header that has room for it.",
      code: `<SidebarProvider navigationKey={pathname}>
  <Sidebar sheetCloseButton side="start">
    {rows.map((row) => (
      <SidebarMenuItem key={row.href}>
        <SidebarMenuButton render={<a href={row.href} />} isActive={row.href === pathname}>
          {row.label}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))}
  </Sidebar>
</SidebarProvider>`,
      render: () => <NavigationSidebar />,
      align: "start",
    },
    {
      id: "tokens",
      title: "The current row, painted by tokens",
      description:
        "The current row reads `--fui-sidebar-active-ink`, `-icon`, `-shadow` and `-bar`, with a fallback each, so a product sets them on the page, the provider or one sidebar and they follow the theme. `none` flattens the shadow and `transparent` hides the 2 px bar; forced colors always show it.",
      code: `<div style={{ "--fui-sidebar-active-ink": "var(--brand-ink)", "--fui-sidebar-active-bar": "transparent" }}>
  <SidebarProvider>
    <Sidebar>…rows…</Sidebar>
  </SidebarProvider>
</div>`,
      render: () => (
        <div
          style={
            {
              ...frame,
              inlineSize: "min(100%, 16rem)",
              "--fui-sidebar-active-bar": "transparent",
              "--fui-sidebar-active-ink": "var(--brand-ink)",
              "--fui-sidebar-active-shadow": "none",
            } as CSSProperties
          }
        >
          <SidebarProvider style={{ blockSize: "100%", display: "block", minBlockSize: 0 }}>
            <Sidebar collapsible="none">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>A row painted by tokens</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>Current page</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Another page</SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </div>
      ),
      align: "start",
    },
  ],
};
