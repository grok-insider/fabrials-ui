import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  Label,
  Loading,
  Meter,
  PageHeader,
  SectionHeader,
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
} from "@fabrials/ui";
import { ChatMessage } from "@fabrials/ai-ui";
import "@fabrials/ai-ui/styles.css";

const meta = {
  title: "Fabrials/Loading",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const accounts = [
  { name: "North workspace", owner: "AL", status: "Connected", tone: "success" as const },
  { name: "Research sandbox", owner: "MR", status: "Stale", tone: "warning" as const },
  { name: "Billing export", owner: "JK", status: "Needs attention", tone: "danger" as const },
];

/** One view with synthetic data; rendered twice, loaded and as its own skeleton. */
function Sample({ id }: { id: string }) {
  return (
    <div className="catalogue-stack">
      <StatGroup>
        <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs last 7 days" sparkline={[30, 32, 29, 35, 34, 38, 40]} />
        <Stat label="Cache hit rate" value="61.2%" delta="No change" trend="flat" hint="vs last 7 days" />
      </StatGroup>
      <Card>
        <CardHeader>
          <CardTitle>Routing</CardTitle>
          <CardDescription>How autosteer picks the next account when one runs out of quota.</CardDescription>
          <CardAction>
            <Badge tone="info">Autosteer</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="catalogue-stack">
          <Meter label="Weekly quota" value={42} hint="Resets Friday at 09:00" />
          <StatusDot tone="success" label="Relay online" />
          <div className="catalogue-row">
            <Button>
              <Plus aria-hidden /> Add account
            </Button>
            <Button variant="accent">Connect</Button>
            <Button variant="outline">View details</Button>
          </div>
        </CardContent>
      </Card>
      <Table>
        <caption className="fui-sr-only">Synthetic accounts</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.name}>
              <TableCell>
                <span className="catalogue-row" style={{ gap: "0.5rem" }}>
                  <Avatar size="sm">
                    <AvatarFallback>{account.owner}</AvatarFallback>
                  </Avatar>
                  {account.name}
                </span>
              </TableCell>
              <TableCell>
                <Badge tone={account.tone} dot>
                  {account.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Field label="Account alias" description="Shown in the switcher and in usage exports.">
        {(props) => <Input {...props} name={`${id}-alias`} defaultValue="Engineering" />}
      </Field>
      <div className="catalogue-row">
        <Label className="fui-choice">
          <Switch defaultChecked /> Notify on quota
        </Label>
        <Label className="fui-choice">
          <Checkbox defaultChecked /> Include archived
        </Label>
      </div>
      <Alert variant="warning">
        <AlertTitle>Observation is 3 hours old</AlertTitle>
        <AlertDescription>Refresh the account to see its current quota.</AlertDescription>
      </Alert>
      <ChatMessage from="assistant">
        <p>
          The weekly quota resets on Friday. Until then, autosteer sends new requests to the research sandbox, which
          has the most room left.
        </p>
      </ChatMessage>
    </div>
  );
}

export const Gallery: Story = {
  render: () => (
    <main className="catalogue">
      <PageHeader
        title="Loading"
        description="Loading paints real components as their own skeleton: the same view, loaded and loading. Synthetic data only."
      />
      <div className="catalogue-grid">
        <section className="catalogue-stack" aria-labelledby="loading-loaded">
          <SectionHeader title={<span id="loading-loaded">Loaded</span>} />
          <Sample id="loaded" />
        </section>
        <section className="catalogue-stack" aria-labelledby="loading-skeleton">
          <SectionHeader title={<span id="loading-skeleton">Loading</span>} />
          <Loading when label="Loading accounts">
            <Sample id="skeleton" />
          </Loading>
        </section>
      </div>
    </main>
  ),
};
