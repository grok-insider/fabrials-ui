import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox, LayoutDashboard, ListFilter, Sparkles, Users } from "lucide-react";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Button,
  Card,
  Checkbox,
  CardAction,
  CardCaption,
  CardContent,
  CardHeader,
  CardTitle,
  CornerMarks,
  DitherGem,
  DitherScene,
  GridGuides,
  Kbd,
  Meter,
  PageHeader,
  ProductLockup,
  Readout,
  SeriesChart,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SiteHeader,
  Snippet,
  Spinner,
  Stat,
  StatGroup,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  type GemName,
} from "@fabrials/ui";
import "./instrument.css";

// 0.10 "Instrument": the reference landing and product overview, composed only from package pieces. Synthetic data.

const meta = {
  title: "Patterns/Instrument",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const products: { name: string; gem: GemName; line: string; runs: string; release: string; link: string }[] = [
  { name: "Spanreed", gem: "ruby", line: "What your AI coding subscriptions use and cost, from the terminal or the tray.", runs: "macOS, Linux, Windows", release: "0.7.2", link: "Install Spanreed" },
  { name: "Syl", gem: "sapphire", line: "Lets your agents drive and test desktop, browser and Android apps.", runs: "Linux, Windows", release: "0.1.0", link: "Read the Syl docs" },
  { name: "ai.fabrials.com", gem: "amethyst", line: "A hosted relay for Grok, Cursor and Nous, with limits per key.", runs: "Hosted", release: "Online", link: "Open the relay" },
  { name: "Usage AI", gem: "heliodor", line: "Weekly numbers from Spanreed users who choose to share them.", runs: "Open data", release: "Week 45", link: "See this week" },
];

const week = [
  { day: "Mon", requests: 412 },
  { day: "Tue", requests: 538 },
  { day: "Wed", requests: 601 },
  { day: "Thu", requests: 577 },
  { day: "Fri", requests: 649 },
  { day: "Sat", requests: 318 },
  { day: "Sun", requests: 244 },
];

const daily = [
  ["Oct 23", 142, 38], ["Oct 24", 168, 41], ["Oct 25", 96, 22], ["Oct 26", 88, 17], ["Oct 27", 151, 44],
  ["Oct 28", 173, 52], ["Oct 29", 160, 47], ["Oct 30", 181, 39], ["Oct 31", 149, 35], ["Nov 1", 92, 19],
  ["Nov 2", 84, 15], ["Nov 3", 166, 49], ["Nov 4", 188, 56], ["Nov 5", 121, 31],
].map(([day, bulk, personal]) => ({ day, bulk, personal }));

const senders = [
  { name: "Northwind Weekly", address: "weekly@news.northwind.example", messages: 1874, unread: 1502, last: "3 hours ago", unsubscribe: "One-click" },
  { name: "Contoso Deals", address: "deals@mail.contoso.example", messages: 1611, unread: 1590, last: "Yesterday", unsubscribe: "One-click" },
  { name: "Forum digest", address: "digest@forum.example", messages: 929, unread: 412, last: "Nov 2", unsubscribe: "By email" },
  { name: "Fabrikam Updates", address: "updates@fabrikam.example", messages: 727, unread: 18, last: "Oct 29", unsubscribe: "Link" },
  { name: "Bank alerts", address: "alerts@bank.example", messages: 622, unread: 0, last: "Today", unsubscribe: "None" },
];

function Landing() {
  return (
    <div className="ins">
      <SiteHeader
        sticky={false}
        brand={
          <a className="ins-wordmark" href="#top">
            <DitherGem gem="stormlight" size={20} />
            Fabrials
          </a>
        }
        navigation={
          <nav aria-label="Main" className="ins-nav">
            <a href="#tools">Products</a>
            <a href="#week">Usage AI</a>
            <a href="#top">News</a>
            <a href="#top">Learn</a>
          </nav>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              Search <Kbd>Ctrl K</Kbd>
            </Button>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </>
        }
      />
      <section className="ins-hero" id="top" aria-labelledby="ins-title">
        <GridGuides />
        <div className="ins-hero-copy">
          <h1 id="ins-title">Tools for people who work beside AI agents.</h1>
          <p>Spanreed shows what your coding subscriptions cost. Syl lets your agents drive and test real apps. Both run on your own machine.</p>
          <Snippet>curl -fsSL https://fabrials.com/install/spanreed.sh | sh</Snippet>
          <div className="ins-actions">
            <Button>Install Spanreed</Button>
            <a href="#tools">Browse all tools</a>
          </div>
        </div>
        <CornerMarks className="ins-hero-plate">
          <Card>
            <div className="ins-scene">
              <DitherScene variant="full" seed={7} />
            </div>
            <CardCaption>
              <span>Fig. 1. A storm front, ordered dither, 3 px dots.</span>
              <span>8×8 Bayer</span>
            </CardCaption>
          </Card>
        </CornerMarks>
      </section>

      <section className="ins-section" id="tools" aria-labelledby="ins-tools">
        <PageHeader headingLevel={2} title="Everything on fabrials.com" eyebrow="4 tools, 2 run on your machine" />
        <ul className="ins-index">
          {products.map((p) => (
            <li key={p.name}>
              <DitherGem gem={p.gem} size={28} />
              <h3>{p.name}</h3>
              <p>{p.line}</p>
              <span className="ins-label ins-runs">{p.runs}</span>
              <span className="ins-label ins-release">{p.release}</span>
              <a href="#tools">{p.link}</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="ins-section ins-week" id="week" aria-labelledby="ins-week">
        <div>
          <PageHeader headingLevel={2} title="Usage AI, this week" eyebrow="Week 45, 2026. Updated every Monday." />
          <StatGroup>
            <Stat label="Shared snapshots" value="1,284" hint="from 9 countries" />
            <Stat label="Requests priced" value="3.9" unit="M" hint="+6% on week 44" />
            <Stat label="Median cost per day" value="$4.12" hint="per person" />
          </StatGroup>
        </div>
        <Card>
          <CardContent>
            <SeriesChart data={week} xKey="day" series={[{ key: "requests", label: "Requests" }]} yFormat={(v) => `${v}k`} caption="Requests per day this week, in thousands" height={200} />
          </CardContent>
          <CardCaption>
            <span>Requests per day, thousands.</span>
            <span>Peak 649k on Friday</span>
          </CardCaption>
        </Card>
      </section>

      <footer className="ins-foot">
        <span>Fabrials. Tools for agents and coding CLIs.</span>
        <span className="ins-label">Set in IBM Plex. Light dithered at 3 px.</span>
      </footer>
    </div>
  );
}

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Senders", icon: Users, badge: "1,206" },
  { label: "Cleanup", icon: Sparkles },
];

function Workspace() {
  return (
    <SidebarProvider data-gem="smokestone">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <ProductLockup product="Palanaeum" tagline="Mail steward" gem="smokestone" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Mail</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isActive={item.active} tooltip={item.label}>
                      <item.icon aria-hidden />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Setup</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Accounts">
                    <Inbox aria-hidden />
                    <span>Accounts</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Rules">
                    <ListFilter aria-hidden />
                    <span>Rules</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Meter variant="ruler" label="Header index" value={412} max={2048} showValue={false} hint="412 MB of 2 GB" className="ins-side-meter" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="ins-bar">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Mail</BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="ins-spacer" />
          <StatusDot tone="success" label="Synced 2 minutes ago" className="ins-sync" />
          <Button variant="outline" size="sm">
            Sync now
          </Button>
        </header>
        <div className="ins-body">
          <PageHeader eyebrow="Last 14 days, local time" title="Overview" description="What Palanaeum has indexed from your mailboxes. Only headers are read; message bodies stay on the server." />
          <StatGroup>
            <Stat label="Messages indexed" value="28,714" hint="3 accounts" meter={{ value: 100, label: "All indexed messages" }} />
            <Stat label="Unread" value="6,102" hint="21% of indexed" meter={{ value: 21, label: "21% of indexed messages are unread" }} />
            <Stat label="Senders" value="1,206" hint="318 send bulk mail" meter={{ value: 26, label: "26% of senders send bulk mail" }} />
            <Stat label="Bulk mail" value="19,930" hint="69% of indexed" meter={{ value: 69, label: "69% of indexed messages are bulk mail" }} />
          </StatGroup>
          <div className="ins-row">
            <Card>
              <CardHeader>
                <CardTitle>Mail received per day</CardTitle>
              </CardHeader>
              <CardContent>
                <SeriesChart
                  data={daily}
                  xKey="day"
                  stacked
                  series={[
                    { key: "bulk", label: "Bulk" },
                    { key: "personal", label: "Personal" },
                  ]}
                  caption="Mail received per day, bulk and personal, last 14 days"
                  height={240}
                />
              </CardContent>
              <CardCaption>
                <span>Last 14 days, local time.</span>
                <span>Peak 244 on Nov 4</span>
              </CardCaption>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accounts</CardTitle>
                <CardAction>
                  <a href="#accounts">Manage</a>
                </CardAction>
              </CardHeader>
              <ul className="ins-accounts">
                <li>
                  <StatusDot tone="success" label="Personal" />
                  <span className="ins-label">ana@proton.example</span>
                  <span>Synced 2 minutes ago</span>
                </li>
                <li>
                  <StatusDot tone="info" label="Work" pulse />
                  <span className="ins-label">ana@work.example</span>
                  <span>Reading INBOX, 61%</span>
                </li>
                <li>
                  <StatusDot tone="danger" label="Old" />
                  <span className="ins-label">ana.old@mail.example</span>
                  <span className="ins-danger">Password rejected. Update it in Accounts.</span>
                </li>
              </ul>
            </Card>
          </div>
          <Table aria-label="Senders of the most bulk mail">
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead numeric>Messages</TableHead>
                <TableHead numeric>Unread</TableHead>
                <TableHead>Last message</TableHead>
                <TableHead>Unsubscribe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senders.map((s) => (
                <TableRow key={s.address}>
                  <TableCell>
                    <strong className="ins-strong">{s.name}</strong>
                    <span className="ins-label">{s.address}</span>
                  </TableCell>
                  <TableCell numeric>{s.messages.toLocaleString("en")}</TableCell>
                  <TableCell numeric>{s.unread.toLocaleString("en")}</TableCell>
                  <TableCell>{s.last}</TableCell>
                  <TableCell>
                    <Badge tone={s.unsubscribe === "None" ? "neutral" : "success"}>{s.unsubscribe}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const readings = ["14:32 UTC", "14:47 UTC", "15:02 UTC"];

function Motion() {
  const [step, setStep] = useState(0);
  const [range, setRange] = useState("7d");
  const level = [21, 64, 88][step % 3]!;
  return (
    <section aria-labelledby="ins-p0" className="ins-motion">
      <h2 id="ins-p0">Motion that answers</h2>
      <div className="ins-motion-row">
        <Button variant="outline" size="sm" onClick={() => setStep((n) => n + 1)}>
          Sync now
        </Button>
        <span className="ins-label">
          Last sync <Readout value={readings[step % 3]!} />
        </span>
      </div>
      <Meter variant="ruler" label="Weekly quota" value={level} />
      <ToggleGroup aria-label="Range" value={[range]} onValueChange={(next) => next[0] && setRange(String(next[0]))}>
        <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
        <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
        <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
      </ToggleGroup>
      <div className="ins-motion-row">
        <label className="ins-check">
          <Checkbox defaultChecked /> Synchronize history
        </label>
        <Spinner label="Reading INBOX" />
        <Button loading>Saving</Button>
      </div>
    </section>
  );
}

function Pieces() {
  return (
    <div className="ins-pieces">
      <h1>Instrument pieces</h1>
      <Motion />
      <section aria-labelledby="ins-p1">
        <h2 id="ins-p1">CornerMarks and CardCaption</h2>
        <CornerMarks>
          <Card>
            <CardHeader>
              <CardTitle>Plate</CardTitle>
            </CardHeader>
            <CardContent>A plate with a hairline; the marks sit on its corners, like registration marks round a print.</CardContent>
            <CardCaption>
              <span>Fig. 2. Caption strip.</span>
              <span>Reading</span>
            </CardCaption>
          </Card>
        </CornerMarks>
      </section>
      <section aria-labelledby="ins-p2">
        <h2 id="ins-p2">Meter as a ruler</h2>
        <div className="ins-meters">
          <Meter variant="ruler" label="Quota" value={21} />
          <Meter variant="ruler" label="Disk" value={82} />
          <Meter variant="ruler" label="Monthly budget" value={94} />
        </div>
      </section>
      <section aria-labelledby="ins-p3" className="ins-guides-demo">
        <GridGuides />
        <h2 id="ins-p3">GridGuides</h2>
        <p>The layout grid drawn behind a hero. Hidden under 768 px.</p>
      </section>
      <section aria-labelledby="ins-p4">
        <h2 id="ins-p4">Series in dither</h2>
        <SeriesChart
          data={daily.slice(0, 7)}
          xKey="day"
          series={[
            { key: "bulk", label: "Bulk" },
            { key: "personal", label: "Personal" },
          ]}
          caption="Mail per day, grouped bars"
          height={200}
        />
      </section>
    </div>
  );
}

export const LandingPage: Story = { name: "Landing", render: () => <Landing /> };
export const WorkspacePage: Story = { name: "Workspace", render: () => <Workspace /> };
export const PiecesPage: Story = { name: "Pieces", render: () => <Pieces /> };
