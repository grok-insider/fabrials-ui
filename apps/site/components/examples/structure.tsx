"use client";

import { useState } from "react";
import { Archive, Copy, KeyRound, Mail, MoreHorizontal, Pencil, Star, Trash2, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  IconButton,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const panel = { padding: "var(--fui-space-3) 0", color: "var(--muted-foreground)" } as const;

export const tabsExamples: ExampleSet = {
  examples: [
    {
      id: "underline",
      title: "Views of one thing",
      description: "`Tabs` switch between views of the same subject. `defaultValue` (or `value` with `onValueChange`) names the open tab; the underline slides to it.",
      code: `<Tabs defaultValue="models">
  <TabsList aria-label="Usage">
    <TabsTrigger value="models">Models</TabsTrigger>
    <TabsTrigger value="keys">Proxy keys</TabsTrigger>
    <TabsTrigger value="accounts">Accounts</TabsTrigger>
  </TabsList>
  <TabsContent value="models">Usage grouped by model.</TabsContent>
  …
</Tabs>`,
      render: () => (
        <Tabs defaultValue="models" style={{ width: "min(100%, 26rem)" }}>
          <TabsList aria-label="Usage">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="keys">Proxy keys</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>
          <TabsContent style={panel} value="models">
            Usage grouped by model.
          </TabsContent>
          <TabsContent style={panel} value="keys">
            Usage grouped by proxy key.
          </TabsContent>
          <TabsContent style={panel} value="accounts">
            Usage grouped by account.
          </TabsContent>
        </Tabs>
      ),
      align: "start",
    },
    {
      id: "segmented",
      title: "Segmented",
      description: "`variant=\"segmented\"` on the list draws the tabs as segments in a well, for a small switch of view inside a panel.",
      code: `<TabsList variant="segmented" aria-label="Chart">…</TabsList>`,
      render: () => (
        <Tabs defaultValue="day">
          <TabsList aria-label="Chart" variant="segmented">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      ),
    },
    {
      id: "vertical",
      title: "A rail of sections",
      description: "`orientation=\"vertical\"` is a settings rail: the current section is a raised row with the Stormlight bar, and the arrows move up and down.",
      code: `<Tabs defaultValue="identity" orientation="vertical">
  <TabsList aria-label="Settings sections">
    <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
    <TabsTrigger value="identity">Identity</TabsTrigger>
    <TabsTrigger value="privacy">Privacy</TabsTrigger>
  </TabsList>
  <TabsContent value="identity">…</TabsContent>
</Tabs>`,
      render: () => (
        <Tabs
          defaultValue="identity"
          orientation="vertical"
          style={{ width: "min(100%, 30rem)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "hidden", background: "var(--card)" }}
        >
          <TabsList aria-label="Settings sections">
            <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          <TabsContent style={{ padding: "var(--fui-space-4)" }} value="mailboxes">
            Three mailboxes.
          </TabsContent>
          <TabsContent style={{ padding: "var(--fui-space-4)" }} value="identity">
            How you appear when you send.
          </TabsContent>
          <TabsContent style={{ padding: "var(--fui-space-4)" }} value="privacy">
            What leaves this device.
          </TabsContent>
        </Tabs>
      ),
      align: "start",
    },
  ],
};

export const accordionExamples: ExampleSet = {
  examples: [
    {
      id: "questions",
      title: "Questions and answers",
      description: "Each `AccordionItem` has a `value`; `defaultValue` lists the open ones. The body rises out of a slight blur as it opens, and the chevron turns.",
      code: `<Accordion defaultValue={["share"]}>
  <AccordionItem value="share">
    <AccordionTrigger>What does sharing publish?</AccordionTrigger>
    <AccordionContent>Provider, plan and usage summaries. Never credentials or prompts.</AccordionContent>
  </AccordionItem>
  …
</Accordion>`,
      render: () => (
        <Accordion defaultValue={["share"]} style={{ width: "min(100%, 28rem)" }}>
          <AccordionItem value="share">
            <AccordionTrigger>What does sharing publish?</AccordionTrigger>
            <AccordionContent>Provider, plan and usage summaries. Never credentials or prompts.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="offline">
            <AccordionTrigger>Does Spanreed work offline?</AccordionTrigger>
            <AccordionContent>Yes. It reads the local logs; sharing waits for the connection.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="keys">
            <AccordionTrigger>Where are keys stored?</AccordionTrigger>
            <AccordionContent>In the system keychain, never in a file.</AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      align: "start",
    },
    {
      id: "rows",
      title: "A stack of tools",
      description:
        "`variant=\"rows\"` turns each item into a 44 px row; the trigger takes an `icon` and an `aside` (tags, counts) that sits outside it and describes it, for independent panels such as the tools of a reader. Several can be open at once with `multiple`.",
      code: `<Accordion variant="rows" multiple defaultValue={["senders"]}>
  <AccordionItem value="senders">
    <AccordionTrigger icon={<Users />} aside={<Badge>1,206</Badge>}>Senders</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>`,
      render: () => (
        <Accordion defaultValue={["senders"]} multiple style={{ width: "min(100%, 26rem)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "hidden", background: "var(--card)" }} variant="rows">
          <AccordionItem value="senders">
            <AccordionTrigger aside={<Badge>1,206</Badge>} icon={<Users />}>
              Senders
            </AccordionTrigger>
            <AccordionContent>318 send bulk mail; 41 offer one-click unsubscribe.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="keys">
            <AccordionTrigger aside={<Badge tone="warning">2 expiring</Badge>} icon={<KeyRound />}>
              App passwords
            </AccordionTrigger>
            <AccordionContent>Two expire this month.</AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      align: "start",
    },
  ],
};

function RenameDialog() {
  const [name, setName] = useState("Engineering");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil aria-hidden /> Rename account
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
          <DialogDescription>The new name shows in the account list and in reports.</DialogDescription>
        </DialogHeader>
        <Field label="Account alias">{(props) => <Input {...props} onChange={(event) => setName(event.currentTarget.value)} value={name} />}</Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save name</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const dialogExamples: ExampleSet = {
  examples: [
    {
      id: "form",
      title: "A small task on top of the page",
      description:
        "`DialogTrigger` opens it with `render` to keep your button; `DialogHeader` holds the `DialogTitle` (its name) and `DialogDescription`; `DialogFooter` the actions, with `DialogClose` for the ones that close it. Focus moves in, stays in, and returns to the trigger.",
      code: `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Rename account</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Rename account</DialogTitle>
      <DialogDescription>The new name shows in the account list and in reports.</DialogDescription>
    </DialogHeader>
    <Field label="Account alias">{(props) => <Input {...props} />}</Field>
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
      <DialogClose render={<Button />}>Save name</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      render: () => <RenameDialog />,
    },
  ],
};

function SenderMenu() {
  const [starred, setStarred] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <MoreHorizontal aria-hidden /> Sender actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Northwind Weekly</DropdownMenuLabel>
        <DropdownMenuItem>
          <Mail aria-hidden /> Open messages
          <DropdownMenuShortcut>O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy aria-hidden /> Copy address
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>
          Starred
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Archive aria-hidden /> Archive all
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2 aria-hidden /> Delete all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const dropdownMenuExamples: ExampleSet = {
  examples: [
    {
      id: "actions",
      title: "Actions on one thing",
      description:
        "A menu of actions on what it belongs to. `DropdownMenuLabel` names the subject, `DropdownMenuShortcut` shows a key, `DropdownMenuCheckboxItem` keeps a state, `DropdownMenuSeparator` groups, and `variant=\"destructive\"` marks the action that removes.",
      code: `<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline" />}>Sender actions</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Northwind Weekly</DropdownMenuLabel>
    <DropdownMenuItem>Open messages <DropdownMenuShortcut>O</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>Starred</DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete all</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      render: () => <SenderMenu />,
    },
  ],
};

export const tooltipExamples: ExampleSet = {
  examples: [
    {
      id: "name",
      title: "Repeat a name, never hide one",
      description: "A tooltip repeats what a control is for, on hover and on keyboard focus. It is never the only place a name lives: an icon button keeps its `aria-label` (or use `IconButton`, which does both).",
      code: `<Tooltip>
  <TooltipTrigger render={<Button variant="outline" aria-label="Star sender" />}>
    <Star aria-hidden />
  </TooltipTrigger>
  <TooltipContent>Star sender</TooltipContent>
</Tooltip>`,
      render: () => (
        <div style={{ display: "flex", gap: "var(--fui-space-2)" }}>
          <Tooltip>
            <TooltipTrigger render={<Button aria-label="Star sender" size="icon" variant="outline" />}>
              <Star aria-hidden />
            </TooltipTrigger>
            <TooltipContent>Star sender</TooltipContent>
          </Tooltip>
          <IconButton label="Archive all" variant="outline">
            <Archive aria-hidden />
          </IconButton>
        </div>
      ),
    },
  ],
};

export const itemExamples: ExampleSet = {
  examples: [
    {
      id: "rows",
      title: "Records as rows",
      description:
        "`Item` is a record row in an `ItemGroup`: `ItemMedia` (an icon tile or a picture), `ItemContent` with `ItemTitle` and `ItemDescription`, and `ItemActions` at the end. With `stretch`, the link in the title covers the whole row and the actions stay targets of their own.",
      code: `<ItemGroup bordered aria-label="Accounts">
  <Item stretch>
    <ItemMedia variant="icon"><Mail aria-hidden /></ItemMedia>
    <ItemContent>
      <ItemTitle><a href="/accounts/personal">Personal</a></ItemTitle>
      <ItemDescription>ana@proton.example · synced 2 minutes ago</ItemDescription>
    </ItemContent>
    <ItemActions><Badge tone="success" dot>Synced</Badge></ItemActions>
  </Item>
</ItemGroup>`,
      render: () => (
        <ItemGroup aria-label="Accounts" bordered style={{ width: "min(100%, 30rem)" }}>
          {[
            { name: "Personal", detail: "ana@proton.example · synced 2 minutes ago", badge: <Badge dot tone="success">Synced</Badge> },
            { name: "Work", detail: "ana@work.example · reading INBOX, 61%", badge: <Badge dot tone="info">Syncing</Badge> },
            { name: "Old", detail: "ana.old@mail.example · password rejected", badge: <Badge dot tone="danger">Fix</Badge> },
          ].map((account, index) => (
            <Item current={index === 0} key={account.name} stretch>
              <ItemMedia variant="icon">
                <Mail aria-hidden />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <a href={`#example-rows-${account.name.toLowerCase()}`}>{account.name}</a>
                </ItemTitle>
                <ItemDescription>{account.detail}</ItemDescription>
              </ItemContent>
              <ItemActions>{account.badge}</ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ),
      align: "start",
    },
    {
      id: "states",
      title: "Current, selected and unread",
      description: "`current` marks the open record with a soft fill and the Stormlight bar, `selected` tints a chosen one, and `unread` weighs its title.",
      code: `<Item current>…</Item>
<Item selected>…</Item>
<Item unread>…</Item>`,
      render: () => (
        <ItemGroup aria-label="Messages" bordered style={{ width: "min(100%, 30rem)" }}>
          <Item current>
            <ItemContent>
              <ItemTitle>Quarterly planning notes</ItemTitle>
              <ItemDescription>Current: the message open in the reader.</ItemDescription>
            </ItemContent>
          </Item>
          <Item selected>
            <ItemContent>
              <ItemTitle>Nightly build 4182 passed</ItemTitle>
              <ItemDescription>Selected: chosen for a bulk action.</ItemDescription>
            </ItemContent>
          </Item>
          <Item unread>
            <ItemContent>
              <ItemTitle>Invitation: design review</ItemTitle>
              <ItemDescription>Unread: the title weighs more.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      ),
      align: "start",
    },
  ],
};
