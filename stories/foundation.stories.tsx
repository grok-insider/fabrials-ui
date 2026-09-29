import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Plus,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  Menu,
  Activity,
  Users,
  KeyRound,
  CircleGauge,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  BulkActions,
  Button,
  Card,
  Checkbox,
  CollectionToolbar,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Input,
  Label,
  PageHeader,
  ProductLockup,
  Progress,
  SectionHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetContent,
  Skeleton,
  StatePanel,
  Switch,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  WorkspaceShell,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Foundation",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ControlsDemo() {
  const [enabled, setEnabled] = useState(true);
  return (
    <main className="catalogue">
      <PageHeader
        title="Controls"
        description="Shared components, meaningful states and predictable keyboard behavior."
      />
      <section className="catalogue-stack" aria-label="Buttons">
        <SectionHeader title="Actions" />
        <div className="catalogue-row">
          <Button>
            <Plus aria-hidden /> Add account
          </Button>
          <Button variant="outline">View details</Button>
          <Button variant="secondary">Refresh</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">
            <Trash2 aria-hidden /> Remove
          </Button>
          <Button disabled>Unavailable</Button>
          <Button variant="link">Read documentation</Button>
          <Button variant="accent">Connect</Button>
          <Button loading>Saving…</Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Refresh accounts"
                  />
                }
              >
                <RefreshCw aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Refresh accounts</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>
      <section className="catalogue-grid" aria-label="Fields">
        <Card className="catalogue-stack">
          <SectionHeader title="Form fields" />
          <Field
            label="Account name"
            description="A name your team can recognize."
          >
            {(props) => <Input {...props} placeholder="Engineering" />}
          </Field>
          <Field label="Endpoint" error="Enter a valid HTTPS address.">
            {(props) => <Input {...props} defaultValue="not-a-url" />}
          </Field>
          <Field label="Notes">
            {(props) => (
              <Textarea
                {...props}
                defaultValue="Shared operational workspace"
              />
            )}
          </Field>
          <Field label="Disabled field">
            {(props) => (
              <Input
                {...props}
                value="Managed by your organization"
                disabled
                readOnly
              />
            )}
          </Field>
        </Card>
        <Card className="catalogue-stack">
          <SectionHeader title="Selection and status" />
          <Label className="catalogue-row">
            <Checkbox defaultChecked /> Include in selection
          </Label>
          <Label className="catalogue-row">
            <Checkbox indeterminate /> Partially selected
          </Label>
          <Label className="catalogue-row">
            <Switch checked={enabled} onCheckedChange={setEnabled} /> Automatic
            updates
          </Label>
          <Field label="Provider">
            {(props) => (
              <Select
                defaultValue="all"
                items={{ all: "All providers", openai: "OpenAI", grok: "Grok" }}
              >
                <SelectTrigger {...props}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
          <div className="catalogue-row">
            <Badge>Configured</Badge>
            <Badge tone="success">Connected</Badge>
            <Badge tone="warning">Stale</Badge>
            <Badge tone="danger">Needs attention</Badge>
          </div>
          <Label htmlFor="quota-progress">Quota usage · 42%</Label>
          <Progress id="quota-progress" max={100} value={42} />
        </Card>
      </section>
      <section>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Account details">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="restricted" disabled>
              Restricted
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Your account summary.</TabsContent>
          <TabsContent value="activity">No recent activity.</TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function OverlaysDemo() {
  const [open, setOpen] = useState(false);
  return (
    <main className="catalogue">
      <PageHeader
        title="Overlays"
        description="Keyboard-accessible overlays with focus restoration and explicit actions."
      />
      <div className="catalogue-row">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Add account</DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
            >
              <DialogHeader>
                <DialogTitle>Add account</DialogTitle>
                <DialogDescription>
                  This example uses synthetic data and does not contact a
                  provider.
                </DialogDescription>
              </DialogHeader>
              <Field
                label="Account alias"
                description="Use a descriptive team name."
              >
                {(props) => <Input {...props} name="alias" required />}
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Remove account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <DialogHeader>
              <AlertDialogTitle>Remove this account?</AlertDialogTitle>
              <AlertDialogDescription>
                This example removes nothing. A real destructive action needs an
                explicit confirmation.
              </AlertDialogDescription>
            </DialogHeader>
            <DialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>
                Keep account
              </AlertDialogClose>
              <AlertDialogClose render={<Button variant="destructive" />}>
                Confirm removal
              </AlertDialogClose>
            </DialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Open filters
          </DialogTrigger>
          <SheetContent>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
              <DialogDescription>
                Narrow the visible collection without leaving your workspace.
              </DialogDescription>
            </DialogHeader>
            <Label className="catalogue-row">
              <Checkbox /> Needs attention only
            </Label>
            <DialogFooter>
              <DialogClose render={<Button />}>Done</DialogClose>
            </DialogFooter>
          </SheetContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            More actions
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Rename account</DropdownMenuItem>
              <DropdownMenuItem disabled>Unavailable action</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Remove account</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </main>
  );
}

const accounts = [
  {
    id: "engineering",
    name: "Engineering",
    provider: "OpenAI",
    alias: "team-engineering",
    state: "Connected",
    usage: 42,
  },
  {
    id: "research",
    name: "Research",
    provider: "Grok",
    alias: "research-workspace",
    state: "Connected",
    usage: 18,
  },
  {
    id: "automation",
    name: "Automation",
    provider: "Nous",
    alias: "build-agents",
    state: "Needs attention",
    usage: 86,
  },
  {
    id: "platform",
    name: "Platform infrastructure and developer productivity",
    provider: "OpenAI",
    alias: "platform-infrastructure-production",
    state: "Connected",
    usage: 61,
  },
  {
    id: "design",
    name: "Design",
    provider: "Grok",
    alias: "design-tools",
    state: "Stale",
    usage: 28,
  },
];

function AccountsDemo() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = accounts.filter((account) =>
    `${account.name} ${account.provider} ${account.alias}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const navigation = (
    <>
      <Button variant="ghost">
        <CircleGauge aria-hidden />
        Overview
      </Button>
      <Button variant="ghost" aria-current="page">
        <Users aria-hidden />
        Accounts
      </Button>
      <Button variant="ghost">
        <KeyRound aria-hidden />
        Proxy keys
      </Button>
      <Button variant="ghost">
        <Activity aria-hidden />
        Usage
      </Button>
    </>
  );
  return (
    <WorkspaceShell
      navigation={
        <aside className="catalogue-nav">
          <div className="catalogue-brand">
            <ProductLockup product="ai-relay" tagline="Operator console" gem="sapphire" />
          </div>
          <nav aria-label="Main navigation">{navigation}</nav>
        </aside>
      }
      header={
        <>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  className="catalogue-mobile-menu"
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu aria-hidden />
            </DialogTrigger>
            <SheetContent>
              <DialogHeader>
                <DialogTitle>Navigation</DialogTitle>
                <DialogDescription>
                  Move between workspace sections.
                </DialogDescription>
              </DialogHeader>
              <nav
                className="catalogue-nav-mobile"
                aria-label="Mobile navigation"
              >
                {navigation}
              </nav>
            </SheetContent>
          </Dialog>
          <span>AI Relay</span>
          <span className="catalogue-topbar-spacer" />
          <Badge>Reference preview</Badge>
        </>
      }
    >
      <PageHeader
        title="Accounts"
        description="Manage your provider accounts and see which ones need attention."
        actions={
          <Dialog>
            <DialogTrigger render={<Button />}>
              <Plus aria-hidden />
              Add account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add account</DialogTitle>
                <DialogDescription>
                  Connect your provider in the product. This catalogue has no
                  credentials.
                </DialogDescription>
              </DialogHeader>
              <Field label="Account name">
                {(props) => <Input {...props} />}
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <CollectionToolbar
        search={
          <Input
            type="search"
            aria-label="Search accounts"
            placeholder="Search by account or provider…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        }
        actions={
          <span className="catalogue-table-meta" role="status">
            {filtered.length} accounts
          </span>
        }
      />
      <BulkActions count={selected.length}>
        <Button variant="ghost" onClick={() => setSelected([])}>
          Clear selection
        </Button>
      </BulkActions>
      {filtered.length ? (
        <Table aria-label="Provider accounts">
          <thead>
            <tr>
              <th scope="col">Select</th>
              <th scope="col">Account</th>
              <th scope="col">Status</th>
              <th scope="col">Usage</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((account) => (
              <tr
                key={account.id}
                data-selected={selected.includes(account.id) || undefined}
              >
                <td>
                  <Checkbox
                    aria-label={`Select ${account.name}`}
                    checked={selected.includes(account.id)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, account.id]
                          : current.filter((id) => id !== account.id),
                      )
                    }
                  />
                </td>
                <td>
                  <span className="catalogue-truncate" title={account.name}>
                    {account.name}
                  </span>
                  <span className="catalogue-table-meta">
                    {account.provider} · {account.alias}
                  </span>
                </td>
                <td>
                  <Badge
                    tone={
                      account.state === "Connected"
                        ? "success"
                        : account.state === "Stale"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {account.state}
                  </Badge>
                </td>
                <td>
                  <span>{account.usage}%</span>
                  <Progress
                    aria-label={`${account.name} quota usage`}
                    max={100}
                    value={account.usage}
                  />
                </td>
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${account.name}`}
                        />
                      }
                    >
                      <MoreHorizontal aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Refresh quota</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <StatePanel
          state="empty"
          title="No matching accounts"
          description="Try a different account name or provider."
          actions={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      )}
      <section className="catalogue-panel">
        <SectionHeader
          title="Observation freshness"
          description="Provider snapshots are not live guarantees of remaining capacity."
        />
        <StatePanel
          state="stale"
          title="One account needs a refresh"
          description="Last reported values remain visible until a new observation is available."
          actions={
            <Button variant="outline">
              <RefreshCw aria-hidden />
              Refresh observations
            </Button>
          }
        />
      </section>
    </WorkspaceShell>
  );
}

function StatesDemo() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Collection states"
        description="Useful context instead of silent failures or decorative empty screens."
      />
      <div className="catalogue-stack">
        <StatePanel
          state="loading"
          title="Loading accounts"
          description="Retrieving the latest saved observations."
        />
        <StatePanel
          state="empty"
          title="No accounts yet"
          description="Connect a provider to begin."
          actions={
            <Button>
              <Plus aria-hidden />
              Add account
            </Button>
          }
        />
        <StatePanel
          state="error"
          title="Accounts unavailable"
          description="The service could not be reached. Your settings have not changed."
          actions={<Button variant="outline">Try again</Button>}
        />
        <StatePanel
          state="offline"
          title="You are offline"
          description="Showing the last successful snapshot."
        />
        <StatePanel
          state="stale"
          title="Observation is stale"
          description="Refresh before relying on the reported balance."
        />
        <StatePanel
          state="success"
          title="Account connected"
          description="The provider is ready to use."
        />
        <Skeleton style={{ height: "3rem" }} />
      </div>
    </main>
  );
}

function ThemeIslandsDemo() {
  const island = (theme: "light" | "dark", label: string) => (
    <section
      data-theme={theme}
      aria-label={label}
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--fui-radius-lg)",
        padding: "var(--fui-space-4)",
        display: "grid",
        gap: "var(--fui-space-3)",
      }}
    >
      <strong>{label}</strong>
      <ProductLockup product="Open Email" gem="emerald" size="sm" />
      <div style={{ display: "flex", gap: "var(--fui-space-2)", flexWrap: "wrap" }}>
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Badge tone="success" dot>Connected</Badge>
      </div>
    </section>
  );
  return (
    <main style={{ padding: "var(--fui-page-padding)", display: "grid", gap: "var(--fui-space-4)" }}>
      <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
        A light island inside a dark root resets to the light palette, and a dark island inside a light root keeps the dark one.
        The page theme follows the Storybook toolbar; each island sets its own theme attribute.
      </p>
      {island("light", "Light island")}
      {island("dark", "Dark island")}
    </main>
  );
}

export const Controls: Story = { render: () => <ControlsDemo /> };
export const Overlays: Story = { render: () => <OverlaysDemo /> };
export const Accounts: Story = { render: () => <AccountsDemo /> };
export const States: Story = { render: () => <StatesDemo /> };
export const ThemeIslands: Story = { render: () => <ThemeIslandsDemo /> };
