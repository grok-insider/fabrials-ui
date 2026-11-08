"use client";

import type { CSSProperties } from "react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  avatarInitials,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";
import { PORTRAITS } from "./fixtures";

type Presence = "online" | "away" | "offline";
type Member = { id: string; name: string; role: string; presence: Presence; seen?: string; photo?: string };

const MEMBERS: Member[] = [
  { id: "ana", name: "Ana López", role: "Owner", presence: "online", photo: PORTRAITS.ana },
  { id: "kai", name: "Kai Nakamura", role: "Support", presence: "online" },
  { id: "priya", name: "Priya Shah", role: "Operations", presence: "away" },
  { id: "rafael", name: "Rafael King", role: "Engineering", presence: "offline", seen: "2 h ago", photo: PORTRAITS.rafael },
  { id: "lena", name: "Lena Fischer", role: "Design", presence: "online", photo: PORTRAITS.lena },
  { id: "tom", name: "Tom Adeyemi", role: "Billing", presence: "offline", seen: "yesterday" },
  { id: "omar", name: "Omar Haddad", role: "Engineering", presence: "away" },
];

const PRESENCE: Record<Presence, { tone: "success" | "warning" | "neutral"; word: string }> = {
  online: { tone: "success", word: "Online" },
  away: { tone: "warning", word: "Away" },
  offline: { tone: "neutral", word: "Offline" },
};

function Face({ member, badge = false }: { member: Member; badge?: boolean }) {
  return (
    <Avatar>
      {member.photo ? <AvatarImage alt="" src={member.photo} /> : null}
      <AvatarFallback>{avatarInitials(member.name)}</AvatarFallback>
      {badge ? <AvatarBadge tone={PRESENCE[member.presence].tone} /> : null}
    </Avatar>
  );
}

const muted = { color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" } as const;

function Members() {
  return (
    <Card style={{ width: "min(100%, 30rem)" }}>
      <CardHeader>
        <CardTitle>North workspace</CardTitle>
        <CardDescription>7 members · 3 online</CardDescription>
        <CardAction>
          <AvatarGroup aria-label="7 members" max={4} role="img">
            {MEMBERS.map((member) => (
              <Face key={member.id} member={member} />
            ))}
          </AvatarGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {MEMBERS.slice(0, 4).map((member) => (
            <Item key={member.id} size="sm">
              <ItemMedia>
                <Face badge member={member} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{member.name}</ItemTitle>
                <ItemDescription>{member.role}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <span style={muted}>
                  {PRESENCE[member.presence].word}
                  {member.seen ? ` · ${member.seen}` : ""}
                </span>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-5)" } as const;
const stack = { display: "grid", gap: "var(--fui-space-4)", justifyItems: "start" } as const;
const initials = ["AL", "KN", "PS", "RK", "LF", "TA", "OH"];

export const avatarGroupExamples: ExampleSet = {
  preview: () => <Members />,
  previewCode: `import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  avatarInitials,
} from "@fabrials/ui";

type Member = {
  id: string;
  name: string;
  role: string;
  photo?: string;
  status: "Online" | "Away" | "Offline";
};

const tones = {
  Online: "success",
  Away: "warning",
  Offline: "neutral",
} as const;

// The status is written beside the face, so the dot is decorative (no label).
function Face({ member, badge = false }: { member: Member; badge?: boolean }) {
  return (
    <Avatar>
      {member.photo ? <AvatarImage alt="" src={member.photo} /> : null}
      <AvatarFallback>{avatarInitials(member.name)}</AvatarFallback>
      {badge ? <AvatarBadge tone={tones[member.status]} /> : null}
    </Avatar>
  );
}

export function Members({ members }: { members: Member[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>North workspace</CardTitle>
        <CardDescription>{members.length} members</CardDescription>
        <CardAction>
          <AvatarGroup
            role="img"
            aria-label={\`\${members.length} members\`}
            max={4}
          >
            {members.map((member) => (
              <Face key={member.id} member={member} />
            ))}
          </AvatarGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {members.slice(0, 4).map((member) => (
            <Item key={member.id} size="sm">
              <ItemMedia>
                <Face member={member} badge />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{member.name}</ItemTitle>
                <ItemDescription>{member.role}</ItemDescription>
              </ItemContent>
              <ItemActions>{member.status}</ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}`,
  examples: [
    {
      id: "count",
      title: "A count for the rest",
      description:
        "`max` draws that many faces and folds the rest into a count, named in full for assistive technology (`countLabel`, \"3 more\" by default). A count of one would take a face's place, so four people with `max={3}` show all four. Name the people somewhere readable too.",
      code: `<AvatarGroup max={4}>
  {members.map((member) => (
    <Avatar key={member.id}>
      <AvatarFallback>{avatarInitials(member.name)}</AvatarFallback>
    </Avatar>
  ))}
</AvatarGroup>`,
      render: () => (
        <div style={row}>
          <AvatarGroup max={4}>
            {initials.map((text) => (
              <Avatar key={text}>
                <AvatarFallback>{text}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <AvatarGroup max={3}>
            {initials.slice(0, 4).map((text) => (
              <Avatar key={text}>
                <AvatarFallback>{text}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "`size` on the group sizes the avatars in it and its count: `xs` (20 px) in a table cell, `sm` in a row, the default 32 px, `lg` in a header.",
      code: `<AvatarGroup size="sm" max={4}>
  …
</AvatarGroup>`,
      render: () => (
        <div style={stack}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <AvatarGroup key={size} max={4} size={size}>
              {initials.map((text) => (
                <Avatar key={text}>
                  <AvatarFallback>{text}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          ))}
        </div>
      ),
    },
    {
      id: "presence",
      title: "Presence",
      description:
        "`AvatarBadge` puts a dot on the avatar's edge in a `tone`. Write the status beside the face, and the dot is decorative; when the avatar stands alone, `label` says it to assistive technology. With a number inside it is a small count.",
      code: `<Avatar>
  <AvatarImage src={member.photo} alt="" />
  <AvatarFallback>AL</AvatarFallback>
  <AvatarBadge tone="success" />
</Avatar>
<span>Online</span>
<Avatar>
  <AvatarFallback>KN</AvatarFallback>
  <AvatarBadge tone="danger" label="3 unread">3</AvatarBadge>
</Avatar>`,
      render: () => (
        <div style={row}>
          {MEMBERS.slice(0, 4).map((member) => (
            <span key={member.id} style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
              <Avatar size="lg">
                {member.photo ? <AvatarImage alt="" src={member.photo} /> : null}
                <AvatarFallback>{avatarInitials(member.name)}</AvatarFallback>
                <AvatarBadge tone={PRESENCE[member.presence].tone} />
              </Avatar>
              <span style={muted}>{PRESENCE[member.presence].word}</span>
            </span>
          ))}
          <Avatar size="lg">
            <AvatarFallback>KN</AvatarFallback>
            <AvatarBadge label="3 unread" tone="danger">
              3
            </AvatarBadge>
          </Avatar>
        </div>
      ),
    },
    {
      id: "tint",
      title: "Initials on their own colour",
      description:
        "Initials sit on a tint of one of the five data hues, picked from the initials, so the same person keeps their colour everywhere and the people of a group tell apart. `tint={false}` keeps the neutral surface; `--fui-avatar-tint` on the avatar sets a hue of your own, such as a workspace's.",
      code: `<Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
<Avatar><AvatarFallback tint={false}>AL</AvatarFallback></Avatar>
<Avatar style={{ "--fui-avatar-tint": "var(--chart-2)" }}>
  <AvatarFallback>NW</AvatarFallback>
</Avatar>`,
      render: () => (
        <div style={stack}>
          <div style={row}>
            {initials.slice(0, 5).map((text) => (
              <Avatar key={text} size="lg">
                <AvatarFallback>{text}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div style={row}>
            <Avatar size="lg">
              <AvatarFallback tint={false}>AL</AvatarFallback>
            </Avatar>
            <Avatar size="lg" style={{ "--fui-avatar-tint": "var(--chart-2)" } as CSSProperties}>
              <AvatarFallback>NW</AvatarFallback>
            </Avatar>
          </div>
        </div>
      ),
    },
    {
      id: "surface",
      title: "On a card",
      description:
        "Each face is ringed in the colour of the surface under it, so overlapping faces read as cut apart: the page by default, a card's colour inside a `Card`. On a surface of your own, set `--fui-avatar-ring` to its colour.",
      code: `<Card>
  <CardContent>
    <AvatarGroup max={4}>…</AvatarGroup>
  </CardContent>
</Card>
<div style={{ background: "var(--secondary)", "--fui-avatar-ring": "var(--secondary)" }}>
  <AvatarGroup max={4}>…</AvatarGroup>
</div>`,
      render: () => (
        <div style={row}>
          <Card>
            <CardContent>
              <AvatarGroup max={4}>
                {MEMBERS.map((member) => (
                  <Face key={member.id} member={member} />
                ))}
              </AvatarGroup>
            </CardContent>
          </Card>
          <div
            style={{ padding: "var(--fui-space-5)", borderRadius: "var(--fui-radius-plate)", background: "var(--secondary)", "--fui-avatar-ring": "var(--secondary)" } as CSSProperties}
          >
            <AvatarGroup max={4}>
              {MEMBERS.map((member) => (
                <Face key={member.id} member={member} />
              ))}
            </AvatarGroup>
          </div>
        </div>
      ),
    },
  ],
};
