"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CircleCheck, CloudOff, Inbox, Info, Lock, OctagonX, RefreshCw } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  StatePanel,
  StatusDot,
  Toaster,
  toast,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;
const stack = { display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 34rem)" } as const;

type AccountState = "synced" | "syncing" | "stale" | "paused";

const ACCOUNTS: { name: string; plan: string; status: AccountState }[] = [
  { name: "North workspace", plan: "Team", status: "synced" },
  { name: "Relay staging", plan: "Personal", status: "syncing" },
  { name: "Harbour lab", plan: "Team", status: "stale" },
  { name: "Archive", plan: "Team", status: "paused" },
];

const ACCOUNT_STATES: Record<AccountState, ReactNode> = {
  synced: (
    <Badge dot tone="success">
      Synced
    </Badge>
  ),
  syncing: (
    <Badge dot pulse tone="info">
      Syncing
    </Badge>
  ),
  stale: (
    <Badge dot tone="warning">
      3 h old
    </Badge>
  ),
  paused: <Badge dot="hollow">Paused</Badge>,
};

function ConnectedAccounts() {
  return (
    <Card style={{ width: "min(100%, 28rem)" }}>
      <CardHeader>
        <CardTitle style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
          Connected accounts <Badge>{ACCOUNTS.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul style={{ display: "grid", gap: "var(--fui-space-1)", margin: 0, padding: 0, listStyle: "none" }}>
          {ACCOUNTS.map((account) => (
            <li key={account.name} style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", minHeight: "2rem" }}>
              <span style={{ fontWeight: 500 }}>{account.name}</span>
              <Badge size="sm" variant="outline">
                {account.plan}
              </Badge>
              <span style={{ marginInlineStart: "auto" }}>{ACCOUNT_STATES[account.status]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const LABELS = [
  ["Travel", "var(--chart-2)"],
  ["Receipts", "var(--chart-3)"],
  ["Family", "var(--chart-5)"],
] as const;

function LabelFilter() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div style={row}>
      {LABELS.map(([name, colour]) => (
        <Badge
          dot
          key={name}
          render={<button aria-pressed={picked === name} onClick={() => setPicked(picked === name ? null : name)} type="button" />}
          style={{ "--fui-badge-solid": colour } as CSSProperties}
        >
          {name}
        </Badge>
      ))}
      <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }} role="status">
        {picked ? `Showing ${picked}` : "Showing every label"}
      </span>
    </div>
  );
}

export const badgeExamples: ExampleSet = {
  preview: () => <ConnectedAccounts />,
  previewCode: `import type { ReactNode } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@fabrials/ui";

type Status = "synced" | "syncing" | "stale" | "paused";

const states: Record<Status, ReactNode> = {
  synced: (
    <Badge dot tone="success">
      Synced
    </Badge>
  ),
  syncing: (
    <Badge dot pulse tone="info">
      Syncing
    </Badge>
  ),
  stale: (
    <Badge dot tone="warning">
      3 h old
    </Badge>
  ),
  paused: <Badge dot="hollow">Paused</Badge>,
};

export function ConnectedAccounts({
  accounts,
}: {
  accounts: { name: string; plan: string; status: Status }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connected accounts <Badge>{accounts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1">
          {accounts.map((account) => (
            <li key={account.name} className="flex min-h-8 items-center gap-2">
              <span className="font-medium">{account.name}</span>
              <Badge size="sm" variant="outline">
                {account.plan}
              </Badge>
              <span className="ms-auto">{states[account.status]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}`,
  examples: [
    {
      id: "tones",
      title: "Tones",
      description:
        "`tone` tints the tag and inks its text: `neutral` (the default), `info`, `success`, `warning` and `danger`. The word carries the meaning; the colour repeats it.",
      code: `<Badge>Configured</Badge>
<Badge tone="info">Syncing</Badge>
<Badge tone="success">Connected</Badge>
<Badge tone="warning">Stale</Badge>
<Badge tone="danger">Needs attention</Badge>`,
      render: () => (
        <div style={row}>
          <Badge>Configured</Badge>
          <Badge tone="info">Syncing</Badge>
          <Badge tone="success">Connected</Badge>
          <Badge tone="warning">Stale</Badge>
          <Badge tone="danger">Needs attention</Badge>
        </div>
      ),
    },
    {
      id: "icons",
      title: "With an icon",
      description: "An icon goes before the word, at 12 px in the tag's ink. Mark it `aria-hidden`: the word says what it means.",
      code: `<Badge tone="success"><CircleCheck aria-hidden /> Connected</Badge>
<Badge tone="warning"><CloudOff aria-hidden /> Offline</Badge>
<Badge tone="danger"><OctagonX aria-hidden /> Failed</Badge>
<Badge><Lock aria-hidden /> Private</Badge>`,
      render: () => (
        <div style={row}>
          <Badge tone="success">
            <CircleCheck aria-hidden /> Connected
          </Badge>
          <Badge tone="warning">
            <CloudOff aria-hidden /> Offline
          </Badge>
          <Badge tone="danger">
            <OctagonX aria-hidden /> Failed
          </Badge>
          <Badge>
            <Lock aria-hidden /> Private
          </Badge>
        </div>
      ),
    },
    {
      id: "dot",
      title: "A state with a dot",
      description:
        "`dot` adds a round light before the word, for a state that changes (synced, paused); `dot=\"hollow\"` is an archived or inactive one. `pulse` makes the dot ripple while the state is live, and stops it when it is not; it holds still under reduced motion.",
      code: `<Badge dot pulse tone="info">Syncing</Badge>
<Badge dot tone="success">Synced</Badge>
<Badge dot tone="warning">3 h old</Badge>
<Badge dot="hollow">Archived</Badge>`,
      render: () => (
        <div style={row}>
          <Badge dot pulse tone="info">
            Syncing
          </Badge>
          <Badge dot tone="success">
            Synced
          </Badge>
          <Badge dot tone="warning">
            3 h old
          </Badge>
          <Badge dot="hollow">Archived</Badge>
        </div>
      ),
    },
    {
      id: "variants",
      title: "Facts and counts",
      description:
        "`variant=\"outline\"` is for a plain fact (a licence, a version) that is not a state. A number on its own is a count: it sits centred in a tag at least as wide as it is tall. `variant=\"solid\"` is the rare tag that must shout: a new item, a count that needs attention.",
      code: `<Badge variant="outline">MIT</Badge>
<Badge variant="outline">v0.11.0</Badge>
<Badge>3</Badge>
<Badge variant="solid">12</Badge>
<Badge variant="solid" tone="danger">99+</Badge>
<Badge variant="solid" tone="info">New</Badge>`,
      render: () => (
        <div style={row}>
          <Badge variant="outline">MIT</Badge>
          <Badge variant="outline">v0.11.0</Badge>
          <Badge>3</Badge>
          <Badge variant="solid">12</Badge>
          <Badge tone="danger" variant="solid">
            99+
          </Badge>
          <Badge tone="info" variant="solid">
            New
          </Badge>
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "`size=\"sm\"` (18 px) fits a dense row, the default (20 px) most places, `size=\"lg\"` (24 px) sits beside a heading or in a card's header.",
      code: `<Badge size="sm" variant="outline">Team</Badge>
<Badge>Team</Badge>
<h3>Usage export <Badge size="lg" tone="info">Beta</Badge></h3>`,
      render: () => (
        <div style={{ ...row, gap: "var(--fui-space-4)" }}>
          <Badge size="sm" variant="outline">
            Team
          </Badge>
          <Badge>Team</Badge>
          <h3 style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-2)", margin: 0, fontSize: "var(--fui-text-lg)" }}>
            Usage export{" "}
            <Badge size="lg" tone="info">
              Beta
            </Badge>
          </h3>
        </div>
      ),
    },
    {
      id: "data",
      title: "Colour that comes from data",
      description:
        "A label whose colour is data (a mailbox label, a project) sets `--fui-badge-solid` on the badge: it tints the tag, its hairline and its dot while the text stays legible. `render` makes the tag a link or a button, here one that filters by its label; `truncate` keeps a long name on its row.",
      code: `<Badge
  dot
  render={<button type="button" aria-pressed={picked === label.name} onClick={() => pick(label.name)} />}
  style={{ "--fui-badge-solid": label.colour }}
>
  {label.name}
</Badge>
<Badge truncate variant="outline" style={{ "--fui-badge-max": "9rem" }}>
  A label that is far too long for its row
</Badge>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
          <LabelFilter />
          <Badge style={{ "--fui-badge-max": "9rem" } as CSSProperties} truncate variant="outline">
            A label that is far too long for its row
          </Badge>
        </div>
      ),
    },
  ],
};

export const statusDotExamples: ExampleSet = {
  examples: [
    {
      id: "tones",
      title: "A light and its word",
      description: "`StatusDot` is a round light with a halo in its `tone`, and a `label` that is always there for assistive technology; `hideLabel` hides it from the eye only.",
      code: `<StatusDot tone="success" label="Relay online" />
<StatusDot tone="warning" label="Observation is 3 h old" />
<StatusDot tone="danger" label="Authorization expired" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <StatusDot label="Relay online" tone="success" />
          <StatusDot label="Observation is 3 h old" tone="warning" />
          <StatusDot label="Authorization expired" tone="danger" />
          <StatusDot label="Syncing history" tone="info" />
        </div>
      ),
      align: "start",
    },
    {
      id: "pulse",
      title: "Live",
      description: "`pulse` sends a ring out from the light while something is live or in progress, and stops under reduced motion. Use it for one thing at a time.",
      code: `<StatusDot tone="info" pulse label="Receiving events" />`,
      render: () => <StatusDot label="Receiving events" pulse tone="info" />,
    },
  ],
};

export const alertExamples: ExampleSet = {
  preview: () => (
    <div style={stack}>
      <Alert variant="warning">
        <CloudOff aria-hidden />
        <AlertTitle>Observation is 3 hours old</AlertTitle>
        <AlertDescription>The relay has not reported since 11:42. Figures below may be out of date.</AlertDescription>
      </Alert>
    </div>
  ),
  previewCode: `import { CloudOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@fabrials/ui";

export function StaleObservation() {
  return (
    <Alert variant="warning">
      <CloudOff aria-hidden />
      <AlertTitle>Observation is 3 hours old</AlertTitle>
      <AlertDescription>
        The relay has not reported since 11:42. Figures below may be out of
        date.
      </AlertDescription>
    </Alert>
  );
}`,
  examples: [
    {
      id: "variants",
      title: "Tinted by what it says",
      description:
        "`variant` is `default`, `info`, `success`, `warning` or `destructive`. The alert is a plate tinted by its tone with an edge in the same tone; an icon as the first child takes the tone's ink.",
      code: `<Alert variant="info">
  <Info aria-hidden />
  <AlertTitle>History sync is paused</AlertTitle>
  <AlertDescription>Resume it in Settings when this machine is linked.</AlertDescription>
</Alert>`,
      render: () => (
        <div style={stack}>
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
          <Alert variant="destructive">
            <OctagonX aria-hidden />
            <AlertTitle>Authorization expired</AlertTitle>
            <AlertDescription>Sign in with the provider again to resume routing.</AlertDescription>
          </Alert>
        </div>
      ),
      align: "start",
    },
    {
      id: "action",
      title: "With the fix",
      description:
        "`AlertAction` holds what to do about it. With `layout=\"inline\"` the alert lays itself out on one line once its own width reaches 48rem, and stacks below that.",
      code: `<Alert layout="inline" variant="warning">
  <AlertTitle>You are offline</AlertTitle>
  <AlertDescription>Changes wait for the connection.</AlertDescription>
  <AlertAction>
    <Button variant="outline" size="sm">Retry now</Button>
  </AlertAction>
</Alert>`,
      render: () => (
        <div style={{ width: "100%" }}>
          <Alert layout="inline" variant="warning">
            <AlertTitle>You are offline</AlertTitle>
            <AlertDescription>Changes wait for the connection.</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline">
                <RefreshCw aria-hidden /> Retry now
              </Button>
            </AlertAction>
          </Alert>
        </div>
      ),
      align: "start",
    },
  ],
};

export const statePanelExamples: ExampleSet = {
  examples: [
    {
      id: "empty",
      title: "Empty, with the next step",
      description:
        "`state` picks the icon and the role: `empty`, `loading`, `error` (an alert), `stale`, `offline` and `success` (a status). An empty state says what to do and offers it in `actions`.",
      code: `<StatePanel
  state="empty"
  title="No folders yet"
  description="Create one to sort your mail."
  actions={<Button size="sm" variant="secondary">New folder</Button>}
/>`,
      render: () => (
        <div style={stack}>
          <StatePanel
            actions={
              <Button size="sm" variant="secondary">
                New folder
              </Button>
            }
            description="Create one to sort your mail."
            icon={<Inbox size={20} />}
            state="empty"
            title="No folders yet"
          />
        </div>
      ),
      align: "start",
    },
    {
      id: "error",
      title: "Errors say how to fix them",
      description: "An error panel is tinted and announced. Say what happened and offer the fix; never only \"Something went wrong\".",
      code: `<StatePanel
  state="error"
  title="Folders failed to load"
  description="The connection dropped before the list arrived."
  actions={<Button size="sm" variant="outline">Retry</Button>}
/>`,
      render: () => (
        <div style={stack}>
          <StatePanel
            actions={
              <Button size="sm" variant="outline">
                Retry
              </Button>
            }
            description="The connection dropped before the list arrived."
            state="error"
            title="Folders failed to load"
          />
        </div>
      ),
      align: "start",
    },
    {
      id: "sizes",
      title: "Centred, small or inline",
      description:
        "`align=\"center\"` for a region of its own (an empty reader pane, with `fill` to take its height); `size=\"sm\"` for a drawer or a popover; `variant=\"inline\"` drops the surface inside something that already has one.",
      code: `<StatePanel state="stale" align="center" title="Showing the last folders" description="They may be out of date." />
<StatePanel state="offline" size="sm" title="You are offline" />
<StatePanel state="loading" variant="inline" title="Loading folders" />`,
      render: () => (
        <div style={stack}>
          <StatePanel align="center" description="They may be out of date." state="stale" title="Showing the last folders" />
          <StatePanel size="sm" state="offline" title="You are offline" />
          <StatePanel state="loading" title="Loading folders" variant="inline" />
        </div>
      ),
      align: "start",
    },
  ],
};

export const spinnerExamples: ExampleSet = {
  examples: [
    {
      id: "words",
      title: "Busy, with words",
      description: "The busy mark is a ring of square cells lighting in turn. `label` names it for assistive technology; put the same words beside it for everyone.",
      code: `<p className="row">
  <Spinner label="Refreshing the pool" />
  Refreshing the pool
</p>`,
      render: () => (
        <p style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", margin: 0 }}>
          <Spinner label="Refreshing the pool" />
          Refreshing the pool
        </p>
      ),
    },
    {
      id: "button",
      title: "In a button",
      description: "For an action in progress, use the button's own `loading` instead: it keeps the button's size and blocks repeated presses.",
      code: `<Button loading>Saving</Button>`,
      render: () => <Button loading>Saving</Button>,
    },
  ],
};

export const toasterExamples: ExampleSet = {
  examples: [
    {
      id: "types",
      title: "Say what happened",
      description:
        "Mount one `Toaster` per app and call `toast` from anywhere. `toast.success`, `toast.error`, `toast.warning` and `toast.info` set the icon; `description` is a second line. Toasts are polite announcements and pause on hover.",
      code: `<Toaster />

toast.success("Account saved");
toast.error("Could not save the key", { description: "Check the connection and try again." });`,
      render: () => (
        <div style={row}>
          <Button onClick={() => toast.success("Account saved", { toasterId: "example-types" })} variant="outline">
            Save
          </Button>
          <Button
            onClick={() => toast.error("Could not save the key", { description: "Check the connection and try again.", toasterId: "example-types" })}
            variant="outline"
          >
            Fail
          </Button>
          <Button onClick={() => toast.info("History sync paused", { description: "Resume it in Settings.", toasterId: "example-types" })} variant="outline">
            Inform
          </Button>
          <Toaster id="example-types" />
        </div>
      ),
    },
    {
      id: "promise",
      title: "A promise, from start to end",
      description: "`toast.promise` shows the busy mark while the work runs and turns into the result. Keep the words the same through the flow: \"Revoking key\", then \"Key revoked\".",
      code: `toast.promise(revokeKey(id), {
  loading: "Revoking key",
  success: "Key revoked",
  error: "Could not revoke the key",
});`,
      render: () => (
        <div style={row}>
          <Button
            onClick={() =>
              toast.promise(new Promise((resolve) => window.setTimeout(resolve, 1600)), {
                loading: "Revoking key",
                success: "Key revoked",
                error: "Could not revoke the key",
                toasterId: "example-promise",
              })
            }
            variant="destructive"
          >
            Revoke key
          </Button>
          <Toaster id="example-promise" />
        </div>
      ),
    },
  ],
};
