"use client";

import { ArrowUpRight } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardCaption,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Meter,
  SeriesChart,
  Stat,
  StatGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";
import { PORTRAITS } from "./fixtures";

const WEEK = [
  { day: "Mon", requests: 412 },
  { day: "Tue", requests: 538 },
  { day: "Wed", requests: 601 },
  { day: "Thu", requests: 577 },
  { day: "Fri", requests: 649 },
  { day: "Sat", requests: 318 },
  { day: "Sun", requests: 244 },
];

const SENDERS = [
  { name: "Northwind Weekly", address: "weekly@news.northwind.example", messages: 1874, unread: 1502, unsubscribe: "One-click" },
  { name: "Contoso Deals", address: "deals@mail.contoso.example", messages: 1611, unread: 1590, unsubscribe: "One-click" },
  { name: "Forum digest", address: "digest@forum.example", messages: 929, unread: 412, unsubscribe: "By email" },
];

const grouped = new Intl.NumberFormat("en");
const PORTRAIT = PORTRAITS.ana;

export const cardExamples: ExampleSet = {
  examples: [
    {
      id: "parts",
      title: "Header, content and footer",
      description:
        "A card is one plate. `CardHeader` holds the `CardTitle` and its `CardDescription`, with `CardAction` at the end of the header; `CardContent` is the body; `CardFooter` sits on the plate with no line above it.",
      code: `<Card>
  <CardHeader>
    <CardTitle>Routing</CardTitle>
    <CardDescription>How autosteer picks the next account.</CardDescription>
    <CardAction><Badge tone="info">Autosteer</Badge></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>
    <Button size="sm">Save routing</Button>
    <Button size="sm" variant="ghost">Reset</Button>
  </CardFooter>
</Card>`,
      render: () => (
        <Card style={{ width: "min(100%, 26rem)" }}>
          <CardHeader>
            <CardTitle>Routing</CardTitle>
            <CardDescription>How autosteer picks the next account.</CardDescription>
            <CardAction>
              <Badge tone="info">Autosteer</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p style={{ margin: 0 }}>Balanced across 3 accounts. The next request goes to Personal.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Save routing</Button>
            <Button size="sm" variant="ghost">
              Reset
            </Button>
          </CardFooter>
        </Card>
      ),
    },
    {
      id: "figure",
      title: "A figure with its caption",
      description: "A chart or a figure ends in `CardCaption`: what it shows on the start side, one reading on the end side, both in the label voice.",
      code: `<Card>
  <CardContent>
    <SeriesChart data={week} xKey="day" series={[{ key: "requests", label: "Requests" }]} caption="Requests per day" />
  </CardContent>
  <CardCaption>
    <span>Requests per day, thousands.</span>
    <span>Peak 649k on Friday</span>
  </CardCaption>
</Card>`,
      render: () => (
        <Card style={{ width: "min(100%, 30rem)" }}>
          <CardContent>
            <SeriesChart caption="Requests per day this week, in thousands" data={WEEK} height={180} series={[{ key: "requests", label: "Requests" }]} xKey="day" yFormat={(v) => `${v}k`} />
          </CardContent>
          <CardCaption>
            <span>Requests per day, thousands.</span>
            <span>Peak 649k on Friday</span>
          </CardCaption>
        </Card>
      ),
    },
    {
      id: "interactive",
      title: "A card that is a link",
      description:
        "`interactive` gives a card that leads somewhere its affordance: it lifts a pixel under the pointer and draws the focus ring round the card. Give its one link the `fui-card-link` class and the link covers the whole card, so the card is a single target.",
      code: `<Card interactive>
  <CardHeader>
    <CardTitle><a className="fui-card-link" href="/accounts/personal">Personal</a></CardTitle>
    <CardDescription>ana@proton.example · synced 2 minutes ago</CardDescription>
  </CardHeader>
</Card>`,
      render: () => (
        <Card interactive style={{ width: "min(100%, 22rem)" }}>
          <CardHeader>
            <CardTitle as="h3">
              <a className="fui-card-link" href="#example-interactive">
                Personal
              </a>
            </CardTitle>
            <CardDescription>ana@proton.example · synced 2 minutes ago</CardDescription>
            <CardAction>
              <ArrowUpRight aria-hidden size={16} />
            </CardAction>
          </CardHeader>
        </Card>
      ),
    },
  ],
};

export const statExamples: ExampleSet = {
  examples: [
    {
      id: "group",
      title: "Totals as one plate",
      description:
        "A `StatGroup` is one plate whose figures are divided by soft lines. Each `Stat` has a `label` in the label voice, a `value` and an optional `unit`; `delta` with `trend` says the change with a sign and an arrow, not only a colour.",
      code: `<StatGroup>
  <Stat label="List price" value="$1,284.40" delta="+12.4%" trend="up" deltaTone="negative" hint="vs last 7 days" />
  <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs last 7 days" />
  <Stat label="Tokens" value="92.4" unit="M" delta="−1.8%" trend="down" hint="vs last 7 days" />
</StatGroup>`,
      render: () => (
        <StatGroup style={{ width: "100%" }}>
          <Stat delta="+12.4%" deltaTone="negative" hint="vs last 7 days" label="List price" trend="up" value="$1,284.40" />
          <Stat delta="+3.1%" hint="vs last 7 days" label="Requests" trend="up" value="48,210" />
          <Stat delta="−1.8%" hint="vs last 7 days" label="Tokens" trend="down" unit="M" value="92.4" />
        </StatGroup>
      ),
      align: "start",
    },
    {
      id: "trend",
      title: "A figure and its week",
      description: "`sparkline` draws the recent values under the figure as a scanline area; `deltaTone` says whether going up is good news (a cost going up is not).",
      code: `<Stat label="Requests" value="48,210" sparkline={[412, 538, 601, 577, 649, 318, 244]} />`,
      render: () => <Stat label="Requests" sparkline={WEEK.map((day) => day.requests)} style={{ width: "min(100%, 16rem)" }} value="48,210" />,
    },
    {
      id: "meter",
      title: "A share on a ruler",
      description: "When the figure is a share or a level (unread of total, a quota), `meter` adds a ruler under it, inked up to the value, with a name for assistive technology.",
      code: `<Stat label="Unread" value="6,102" hint="21% of indexed" meter={{ value: 21, label: "21% of indexed messages are unread" }} />`,
      render: () => (
        <Stat hint="21% of indexed" label="Unread" meter={{ value: 21, label: "21% of indexed messages are unread" }} style={{ width: "min(100%, 16rem)" }} value="6,102" />
      ),
    },
  ],
};

export const meterExamples: ExampleSet = {
  examples: [
    {
      id: "bar",
      title: "A level with thresholds",
      description:
        "`Meter` shows where a value sits in a range. Without a `tone`, it turns to warning at `warnAt` (75 %) and danger at `dangerAt` (90 %), and notches the track where they begin, so the threshold shows before it is crossed. `hint` is the line under it.",
      code: `<Meter label="Weekly quota" value={42} hint="Resets Friday at 09:00" />
<Meter label="Session" value={81} hint="Resets in 2 h 10 min" />
<Meter label="Monthly credits" value={96} hint="Top up or wait for the reset" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 24rem)" }}>
          <Meter hint="Resets Friday at 09:00" label="Weekly quota" value={42} />
          <Meter hint="Resets in 2 h 10 min" label="Session" value={81} />
          <Meter hint="Top up or wait for the reset" label="Monthly credits" value={96} />
        </div>
      ),
    },
    {
      id: "ruler",
      title: "A ruler",
      description: "`variant=\"ruler\"` draws a scale of `ticks`, inked up to the value with a Stormlight mark at it; when the value changes the ticks ink in order and the mark travels.",
      code: `<Meter variant="ruler" label="Disk" value={412} max={2048} ticks={40} />`,
      render: () => (
        <div style={{ width: "min(100%, 24rem)" }}>
          <Meter label="Header index" max={2048} value={412} variant="ruler" />
        </div>
      ),
    },
  ],
};

export const tableExamples: ExampleSet = {
  examples: [
    {
      id: "plate",
      title: "Records as rows",
      description:
        "A table is one plate: the head is an inset band in the label voice, rows are divided by soft lines and light under the pointer. `numeric` right-aligns a column in tabular mono.",
      code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Sender</TableHead>
      <TableHead numeric>Messages</TableHead>
      <TableHead>Unsubscribe</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {senders.map((sender) => (
      <TableRow key={sender.address}>
        <TableCell>{sender.name}</TableCell>
        <TableCell numeric>{sender.messages}</TableCell>
        <TableCell><Badge tone="success">{sender.unsubscribe}</Badge></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
      render: () => (
        <div style={{ width: "100%" }}>
          <Table>
            <caption className="fui-sr-only">Top senders</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead numeric>Messages</TableHead>
                <TableHead numeric>Unread</TableHead>
                <TableHead>Unsubscribe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SENDERS.map((sender) => (
                <TableRow key={sender.address}>
                  <TableCell>
                    <div style={{ display: "grid" }}>
                      <span style={{ fontWeight: 500 }}>{sender.name}</span>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--fui-font-mono)", fontSize: "var(--fui-text-xs)" }}>{sender.address}</span>
                    </div>
                  </TableCell>
                  <TableCell numeric>{grouped.format(sender.messages)}</TableCell>
                  <TableCell numeric>{grouped.format(sender.unread)}</TableCell>
                  <TableCell>
                    <Badge tone={sender.unsubscribe === "One-click" ? "success" : "neutral"}>{sender.unsubscribe}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ),
      align: "start",
    },
    {
      id: "selected",
      title: "Selected rows",
      description: "`data-selected` on a row tints it in Stormlight at the state strength; pair it with a checkbox in the row so the selection is not only a colour.",
      code: `<TableRow data-selected={selected.has(sender.id) || undefined}>…</TableRow>`,
      render: () => (
        <div style={{ width: "100%" }}>
          <Table>
            <caption className="fui-sr-only">Senders, one selected</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead numeric>Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SENDERS.slice(0, 2).map((sender, index) => (
                <TableRow data-selected={index === 0 || undefined} key={sender.address}>
                  <TableCell>{sender.name}</TableCell>
                  <TableCell numeric>{grouped.format(sender.messages)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ),
      align: "start",
    },
  ],
};

export const avatarExamples: ExampleSet = {
  examples: [
    {
      id: "sizes",
      title: "Picture or initials",
      description: "`AvatarImage` shows the picture once it loads; `AvatarFallback` (initials) shows until then and if it fails. `size` runs from `xs` (20 px) to `xl` (56 px).",
      code: `<Avatar size="lg">
  <AvatarImage src={person.photo} alt="Kai Nakamura" />
  <AvatarFallback>KN</AvatarFallback>
</Avatar>`,
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <Avatar key={size} size={size}>
              <AvatarImage alt="Kai Nakamura" src={PORTRAIT} />
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
          ))}
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      id: "group",
      title: "A team",
      description: "`AvatarGroup` overlaps faces, each ringed in the colour of the surface under it; with `max` the rest become a count named in full. Initials sit on a colour of their own, picked from the initials. Write the names somewhere readable too.",
      code: `<AvatarGroup max={4}>
  {team.map((person) => (
    <Avatar key={person.id}><AvatarFallback>{person.initials}</AvatarFallback></Avatar>
  ))}
</AvatarGroup>`,
      render: () => (
        <AvatarGroup max={4}>
          {["AL", "KN", "PS", "TA", "LF", "OH"].map((initials) => (
            <Avatar key={initials}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      ),
    },
    {
      id: "badge",
      title: "Presence",
      description: "`AvatarBadge` puts a dot (or a small count) on the avatar's edge in a `tone`; `label` says it to assistive technology.",
      code: `<Avatar>
  <AvatarFallback>AL</AvatarFallback>
  <AvatarBadge tone="success" label="Online" />
</Avatar>`,
      render: () => (
        <div style={{ display: "flex", gap: "var(--fui-space-4)" }}>
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
            <AvatarBadge label="Online" tone="success" />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>KN</AvatarFallback>
            <AvatarBadge label="3 unread" tone="danger">
              3
            </AvatarBadge>
          </Avatar>
        </div>
      ),
    },
  ],
};
