import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Activity,
  ArrowUpRight,
  Blocks,
  CircleGauge,
  History,
  KeyRound,
  Menu,
  Route,
  Search,
  Settings,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AuthLayout,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CollectionToolbar,
  DialogFooter,
  DialogHeader,
  Field,
  Input,
  Kbd,
  Label,
  NativeSelect,
  PageHeader,
  ProductLockup,
  SectionHeader,
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
  SidebarRail,
  SidebarTrigger,
  SiteHeader,
  Snippet,
  Stat,
  StatGroup,
  StatusDot,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ThemeSwitcher,
  type ThemePreference,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Patterns",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const hourly = [
  { hour: "00", grok: 4.2, claude: 2.1, codex: 1.2 },
  { hour: "03", grok: 2.8, claude: 1.4, codex: 0.6 },
  { hour: "06", grok: 3.4, claude: 2.8, codex: 1.1 },
  { hour: "09", grok: 9.6, claude: 6.2, codex: 3.4 },
  { hour: "12", grok: 12.4, claude: 7.9, codex: 4.2 },
  { hour: "15", grok: 10.1, claude: 8.8, codex: 5.1 },
  { hour: "18", grok: 7.3, claude: 5.2, codex: 2.9 },
  { hour: "21", grok: 5.5, claude: 3.1, codex: 1.8 },
];

const models = [
  { model: "grok-4.5", requests: "18,204", tokens: "41.2 M", cost: "$612.40" },
  { model: "claude-sonnet-5", requests: "12,880", tokens: "28.9 M", cost: "$401.15" },
  { model: "gpt-5.6", requests: "9,412", tokens: "17.6 M", cost: "$214.80" },
  { model: "grok-4.5-fast", requests: "7,714", tokens: "4.7 M", cost: "$56.05" },
];

const operate = [
  { label: "Overview", icon: CircleGauge, active: true },
  { label: "Autosteer", icon: Route },
  { label: "Accounts", icon: Users, badge: "12" },
  { label: "Proxy keys", icon: KeyRound },
  { label: "Local consumption", icon: Activity },
  { label: "Private history", icon: History },
  { label: "Connectors", icon: Blocks },
];

function ConsoleDemo() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <SidebarProvider data-gem="sapphire">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <ProductLockup product="ai-relay" tagline="Operator console" gem="sapphire" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operate</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operate.map((item) => (
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
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Installation">
                    <Settings aria-hidden />
                    <span>Installation</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="fixture-operator">
                <Avatar size="sm">
                  <AvatarFallback>FO</AvatarFallback>
                </Avatar>
                <span className="catalogue-user">
                  <strong>fixture-operator</strong>
                  <span>Desktop relay</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="catalogue-console-header">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>relay_7f3a2c</BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="catalogue-topbar-spacer" />
          <Button variant="outline" size="sm" className="catalogue-search-button">
            <Search aria-hidden />
            Search
            <Kbd>Ctrl K</Kbd>
          </Button>
          <ThemeSwitcher value={theme} onValueChange={setTheme} />
        </header>
        <div className="catalogue-console-body">
          <PageHeader
            title="Overview"
            description="List price, requests and tokens for the last 7 days. Synchronized local logs are included once."
            actions={<StatusDot tone="success" label="Relay online" pulse />}
          />
          <CollectionToolbar
            label="Overview filters"
            filters={
              <>
                <NativeSelect aria-label="Range" defaultValue="7d" data-density="compact">
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </NativeSelect>
                <NativeSelect aria-label="Model" defaultValue="any">
                  <option value="any">Any model</option>
                  <option value="grok">grok-4.5</option>
                </NativeSelect>
                <NativeSelect aria-label="Proxy key" defaultValue="any">
                  <option value="any">Any proxy key</option>
                </NativeSelect>
              </>
            }
          />
          <StatGroup>
            <Stat label="List price" value="$1,284.40" delta="+12.4%" trend="up" deltaTone="negative" hint="vs previous 7 days" />
            <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs previous 7 days" />
            <Stat label="Tokens" value="92.4" unit="M" delta="−1.8%" trend="down" deltaTone="neutral" hint="vs previous 7 days" />
            <Stat label="Input cache rate" value="61.2%" delta="No change" trend="flat" hint="vs previous 7 days" />
          </StatGroup>
          <Card className="catalogue-panel">
            <CardHeader>
              <CardTitle>Usage by model</CardTitle>
              <CardDescription>List price per 3 hours, UTC.</CardDescription>
            </CardHeader>
            <CardContent>
              <SeriesChart
                data={hourly}
                xKey="hour"
                stacked
                series={[
                  { key: "grok", label: "Grok" },
                  { key: "claude", label: "Claude" },
                  { key: "codex", label: "Codex" },
                ]}
                yFormat={(value) => `$${value.toFixed(0)}`}
                caption="Synthetic list price by model and hour"
                height={220}
              />
            </CardContent>
          </Card>
          <section className="catalogue-panel" aria-labelledby="console-models">
            <SectionHeader title={<span id="console-models">Top models</span>} description="Ranked by list price." />
            <Table aria-label="Top models">
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead numeric>Requests</TableHead>
                  <TableHead numeric>Tokens</TableHead>
                  <TableHead numeric>List price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((row) => (
                  <TableRow key={row.model}>
                    <TableCell>
                      <code className="fui-code">{row.model}</code>
                    </TableCell>
                    <TableCell numeric>{row.requests}</TableCell>
                    <TableCell numeric>{row.tokens}</TableCell>
                    <TableCell numeric>{row.cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const productCards = [
  { product: "Spanreed", gem: "ruby" as const, text: "Track AI coding subscription usage from the terminal, the status bar or the desktop." },
  { product: "ai-relay", gem: "sapphire" as const, text: "A self-hosted relay that routes Grok and other providers across your accounts." },
  { product: "Open Email", gem: "emerald" as const, text: "A calm JMAP mail client with an assistant that only acts when you ask." },
];

function PublicSiteDemo() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <div className="catalogue-site" data-gem="heliodor">
      <SiteHeader
        brand={
          <a href="#site-main" className="catalogue-home-link" aria-label="Fabrials home">
            <ProductLockup product="Fabrials" gem="heliodor" />
          </a>
        }
        navigation={
          <nav aria-label="Primary" className="catalogue-site-nav">
            <a href="#site-products" aria-current="page">
              Products
            </a>
            <a href="#site-install">Usage AI</a>
            <a href="#site-install">News</a>
            <a href="#site-install">Learn</a>
          </nav>
        }
        actions={
          <>
            <ThemeSwitcher value={theme} onValueChange={setTheme} />
            <Button size="sm">Sign in</Button>
          </>
        }
        mobileMenu={
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu aria-hidden />
          </Button>
        }
      />
      <main id="site-main" className="catalogue-site-main">
        <section className="catalogue-hero" aria-labelledby="site-hero-title">
          <h1 id="site-hero-title">Tools that sit next to your agents, not on top of them.</h1>
          <p className="fui-description catalogue-hero-lead">
            Spanreed and ai-relay are the products. Usage AI is the public Spanreed pool. Sign in with X for your metrics and the hosted relay.
          </p>
          <div className="fui-actions">
            <Button size="lg">Install Spanreed</Button>
            <Button size="lg" variant="outline">
              Read the docs <ArrowUpRight aria-hidden />
            </Button>
          </div>
        </section>
        <section id="site-products" aria-labelledby="site-products-title" className="catalogue-stack">
          <SectionHeader title={<span id="site-products-title">Products</span>} />
          <div className="catalogue-grid">
            {productCards.map((item) => (
              <Card key={item.product} interactive>
                <div className="catalogue-stack">
                  <ProductLockup product={item.product} gem={item.gem} />
                  <p className="fui-description">{item.text}</p>
                  <a className="fui-link catalogue-card-link" href="#site-products">
                    Open {item.product}
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
        <section id="site-install" aria-labelledby="site-install-title" className="catalogue-stack catalogue-panel">
          <SectionHeader title={<span id="site-install-title">Install</span>} description="The canonical bootstrap is on fabrials.com, not the release page." />
          <Snippet label="Linux and macOS">{"curl -fsSL https://fabrials.com/install/spanreed.sh | sh"}</Snippet>
        </section>
      </main>
      <footer className="catalogue-site-footer">
        <ProductLockup product="Fabrials" tagline="Tools for agents and coding CLIs" gem="heliodor" size="sm" />
        <span className="catalogue-table-meta">Spanreed and Syl are independent projects.</span>
      </footer>
    </div>
  );
}

function SignInDemo() {
  return (
    <AuthLayout
      brand={<ProductLockup product="Open Email" tagline="by Fabrials" gem="emerald" size="lg" />}
      title="Sign in to your mailbox"
      description="Use your mailbox password. Your administrator can reset it."
      footer="Your password is used only by this server and is never shared with AI providers."
      aside={
        <>
          <ProductLockup product="Open Email" gem="emerald" />
          <div className="catalogue-aside-copy">
            <p className="catalogue-serif">Your mail. A clearer mind.</p>
            <p className="fui-description">Read with focus, write with intention, and keep your inbox your own.</p>
          </div>
          <span className="catalogue-table-meta">Built by Fabrials.</span>
        </>
      }
    >
      <form className="catalogue-stack" onSubmit={(event) => event.preventDefault()}>
        <Field label="Email address">
          {(props) => <Input {...props} type="email" autoComplete="username" spellCheck={false} placeholder="you@example.com" />}
        </Field>
        <Field label="Password">
          {(props) => <Input {...props} type="password" autoComplete="current-password" />}
        </Field>
        <Button type="submit" size="lg">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

function SettingsDemo() {
  const [theme, setTheme] = useState<ThemePreference>("dark");
  const [notify, setNotify] = useState(true);
  return (
    <main className="catalogue catalogue-narrow">
      <PageHeader title="Workspace settings" description="Appearance, notifications and how this machine connects to Fabrials." />
      <div className="catalogue-stack">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Follow the system or choose a theme for Spanreed.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher value={theme} onValueChange={setTheme} showLabels />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Desktop notices when a quota resets or an account needs attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="catalogue-setting">
              <Label htmlFor="settings-reset">Quota resets</Label>
              <Switch id="settings-reset" checked={notify} onCheckedChange={setNotify} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sharing</CardTitle>
            <CardDescription>Each option is independent. A Fabrials sign-in is also required.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="catalogue-stack">
              <Label className="fui-choice">
                <Checkbox /> Publish aggregate usage metrics
              </Label>
              <Label className="fui-choice">
                <Checkbox defaultChecked /> Synchronize private usage history
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm">Save sharing</Button>
            <Badge tone="success" dot>
              Saved
            </Badge>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remove this machine</CardTitle>
            <CardDescription>Local history stays on disk; the link to Fabrials is revoked.</CardDescription>
          </CardHeader>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>Unlink machine</AlertDialogTrigger>
              <AlertDialogContent>
                <DialogHeader>
                  <AlertDialogTitle>Unlink this machine?</AlertDialogTitle>
                  <AlertDialogDescription>This example changes nothing. Real unlinking revokes the device token.</AlertDialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <AlertDialogClose render={<Button variant="outline" />}>Keep linked</AlertDialogClose>
                  <AlertDialogClose render={<Button variant="destructive" />}>Unlink machine</AlertDialogClose>
                </DialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

export const Console: Story = { render: () => <ConsoleDemo /> };
export const PublicSite: Story = { render: () => <PublicSiteDemo /> };
export const SignIn: Story = { render: () => <SignInDemo /> };
export const SettingsPage: Story = { name: "Settings", render: () => <SettingsDemo /> };
