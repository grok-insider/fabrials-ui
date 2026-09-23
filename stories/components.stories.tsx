import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleAlert,
  CircleCheck,
  Info,
  Plus,
  RefreshCw,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  Kbd,
  Label,
  Meter,
  PageHeader,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Radio,
  RadioGroup,
  SectionHeader,
  Snippet,
  Stat,
  StatGroup,
  StatusDot,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThemeSwitcher,
  ToggleGroup,
  ToggleGroupItem,
  type ThemePreference,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Components",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ComponentsGallery() {
  const [range, setRange] = useState(["7d"]);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [saving, setSaving] = useState(false);
  return (
    <main className="catalogue">
      <PageHeader
        eyebrow={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">Design system</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Components</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="Components"
        description="The 0.4 additions next to the restyled controls. Synthetic data only."
        actions={<ThemeSwitcher value={theme} onValueChange={setTheme} />}
      />

      <section className="catalogue-stack" aria-labelledby="gallery-actions" id="components">
        <SectionHeader title={<span id="gallery-actions">Actions</span>} description="Ink for the primary action, Stormlight only when one action must stand out." />
        <div className="catalogue-row">
          <Button>
            <Plus aria-hidden /> Add account
          </Button>
          <Button variant="accent">Connect to Fabrials</Button>
          <Button variant="outline">View details</Button>
          <Button variant="secondary">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Revoke key</Button>
          <Button variant="link">Read the guide</Button>
        </div>
        <div className="catalogue-row">
          <Button size="xs" variant="outline">Extra small</Button>
          <Button size="sm" variant="outline">Small</Button>
          <Button variant="outline">Default</Button>
          <Button size="lg" variant="outline">Large</Button>
          <Button size="icon-sm" variant="ghost" aria-label="Settings">
            <Settings2 aria-hidden />
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setSaving(true);
              window.setTimeout(() => setSaving(false), 1200);
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <ButtonGroup aria-label="Refresh">
            <Button variant="outline">
              <RefreshCw aria-hidden /> Refresh
            </Button>
            <Button variant="outline">Every 5 min</Button>
          </ButtonGroup>
        </div>
      </section>

      <section className="catalogue-stack" aria-labelledby="gallery-metrics">
        <SectionHeader title={<span id="gallery-metrics">Metrics</span>} description="Stat values use Plex Sans tabular figures; trends carry a sign and an icon, not only color." />
        <StatGroup>
          <Stat label="List price" value="$1,284.40" delta="+12.4%" trend="up" deltaTone="negative" hint="vs last 7 days" sparkline={[12, 18, 14, 22, 19, 27, 31]} />
          <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs last 7 days" sparkline={[30, 32, 29, 35, 34, 38, 40]} />
          <Stat label="Tokens" value="92.4" unit="M" delta="−1.8%" trend="down" deltaTone="neutral" hint="vs last 7 days" sparkline={[40, 38, 41, 36, 35, 33, 34]} />
          <Stat label="Cache hit rate" value="61.2%" delta="No change" trend="flat" hint="vs last 7 days" />
        </StatGroup>
        <div className="catalogue-grid">
          <Card>
            <div className="catalogue-stack">
              <Meter label="Weekly quota" value={42} hint="Resets Friday at 09:00" />
              <Meter label="Session" value={81} hint="Resets in 2 h 10 min" />
              <Meter label="Monthly credits" value={96} hint="Top up or wait for the reset" />
            </div>
          </Card>
          <Card>
            <div className="catalogue-stack">
              <StatusDot tone="success" label="Relay online" pulse />
              <StatusDot tone="warning" label="Observation is 3 h old" />
              <StatusDot tone="danger" label="Authorization expired" />
              <StatusDot tone="info" label="Syncing history" />
              <StatusDot label="Configured, not verified" />
            </div>
          </Card>
        </div>
      </section>

      <section className="catalogue-stack" aria-labelledby="gallery-labels">
        <SectionHeader title={<span id="gallery-labels">Badges</span>} description="Pills are passive labels. Rectangles are for actions." />
        <div className="catalogue-row">
          <Badge>Configured</Badge>
          <Badge tone="info">Syncing</Badge>
          <Badge tone="success" dot>Connected</Badge>
          <Badge tone="warning" dot>Stale</Badge>
          <Badge tone="danger" dot>Needs attention</Badge>
        </div>
        <div className="catalogue-row">
          <Badge variant="outline">Outline</Badge>
          <Badge variant="outline" tone="info">Beta</Badge>
          <Badge variant="solid">Solid</Badge>
          <Badge variant="solid" tone="success">Live</Badge>
          <Badge variant="solid" tone="danger">Failed</Badge>
        </div>
      </section>

      <section className="catalogue-grid" aria-label="Choices">
        <Card>
          <CardHeader>
            <CardTitle>Routing</CardTitle>
            <CardDescription>How autosteer picks the next account.</CardDescription>
            <CardAction>
              <Badge tone="info">Autosteer</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="balanced" aria-label="Routing mode">
              <Label className="fui-choice">
                <Radio value="balanced" /> Balanced across accounts
              </Label>
              <Label className="fui-choice">
                <Radio value="drain" /> Drain one account at a time
              </Label>
              <Label className="fui-choice">
                <Radio value="manual" /> Manual only
              </Label>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button size="sm">Save routing</Button>
            <Button size="sm" variant="ghost">Reset</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Range and view</CardTitle>
            <CardDescription>Segmented choices keep the selection visible.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="catalogue-stack">
              <ToggleGroup aria-label="Range" value={range} onValueChange={(value) => value.length && setRange(value)}>
                <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
                <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
                <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
              </ToggleGroup>
              <Tabs defaultValue="models">
                <TabsList variant="segmented" aria-label="Usage view">
                  <TabsTrigger value="models">Models</TabsTrigger>
                  <TabsTrigger value="keys">Proxy keys</TabsTrigger>
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                </TabsList>
                <TabsContent value="models">Usage grouped by model.</TabsContent>
                <TabsContent value="keys">Usage grouped by proxy key.</TabsContent>
                <TabsContent value="accounts">Usage grouped by account.</TabsContent>
              </Tabs>
              <ThemeSwitcher value={theme} onValueChange={setTheme} showLabels label="Theme with labels" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="catalogue-grid" aria-label="Details">
        <div className="catalogue-stack">
          <SectionHeader title="Install" description="Commands copy without the prompt." />
          <Snippet label="Linux and macOS install">{"curl -fsSL https://fabrials.com/install/spanreed.sh | sh"}</Snippet>
          <Snippet label="Windows install" prompt=">">{"# PowerShell\nirm https://fabrials.com/install/spanreed.ps1 | iex"}</Snippet>
        </div>
        <div className="catalogue-stack">
          <SectionHeader title="Environment" description="Identity is independent from endpoint reachability." />
          <DescriptionList>
            <DescriptionItem>
              <DescriptionTerm>Relay ID</DescriptionTerm>
              <DescriptionDetails>
                <code className="fui-code">relay_7f3a2c</code>
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Version</DescriptionTerm>
              <DescriptionDetails>0.1.0</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>HTTP</DescriptionTerm>
              <DescriptionDetails>
                <StatusDot tone="success" label="https://relay.example.com" />
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Operators</DescriptionTerm>
              <DescriptionDetails>
                <span className="catalogue-row catalogue-avatars">
                  <Avatar size="sm"><AvatarFallback>AD</AvatarFallback></Avatar>
                  <Avatar size="sm"><AvatarFallback>NR</AvatarFallback></Avatar>
                  <Avatar size="sm"><AvatarFallback>PK</AvatarFallback></Avatar>
                </span>
              </DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>
        </div>
      </section>

      <section className="catalogue-stack" aria-labelledby="gallery-feedback">
        <SectionHeader title={<span id="gallery-feedback">Feedback</span>} description="Say what happened and what to do next." />
        <div className="catalogue-grid">
          <Alert variant="info">
            <Info aria-hidden />
            <AlertTitle>History sync is paused</AlertTitle>
            <AlertDescription>Resume it in Settings when this machine is linked.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheck aria-hidden />
            <AlertTitle>Account connected</AlertTitle>
            <AlertDescription>Quota appears after the first observation.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlert aria-hidden />
            <AlertTitle>Budget is a soft guard</AlertTitle>
            <AlertDescription>Parallel requests can settle after the threshold.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertTitle>Authorization expired</AlertTitle>
            <AlertDescription>Sign in with the provider again to resume routing.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="catalogue-grid" aria-label="Disclosure and paging">
        <div>
          <SectionHeader title="Questions" />
          <Accordion defaultValue={["share"]}>
            <AccordionItem value="share">
              <AccordionTrigger>What does sharing publish?</AccordionTrigger>
              <AccordionContent>Provider, plan and usage summaries. Never credentials or prompts.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>Does Spanreed work offline?</AccordionTrigger>
              <AccordionContent>It shows the last observation and marks it as stale.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="keys">
              <AccordionTrigger>Where are keys stored?</AccordionTrigger>
              <AccordionContent>In the operating system's secret store.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="catalogue-stack">
          <SectionHeader title="Paging" description={<>Move with <Kbd>J</Kbd> and <Kbd>K</Kbd>.</>} />
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#components" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#components">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#components" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#components">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#components" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <ComponentsGallery /> };
