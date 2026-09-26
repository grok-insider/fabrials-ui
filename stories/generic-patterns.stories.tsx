import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, BookOpen, Code2, FileAudio, Lightbulb, MoreHorizontal, Search } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmActionButton,
  ConfirmDialog,
  FileThumb,
  FilterChip,
  Input,
  Label,
  PageHeader,
  SectionHeader,
  SettingsSection,
  ShimmerText,
  SuggestionCard,
  SuggestionGrid,
  Switch,
  TruncatedText,
  groupByRecency,
  type ConfirmResult,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Generic patterns",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="catalogue">
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const swatch =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#5b7fa8"/><circle cx="56" cy="24" r="12" fill="#e8eef5"/><path d="M0 80 L30 40 L52 64 L64 52 L80 72 V80Z" fill="#2c3e57"/></svg>',
  );

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(0);
  return (
    <Frame
      title="Confirm dialog"
      description="Async confirmation. The action shows a spinner, errors stay inline and keep the dialog open, and success closes it."
    >
      <section className="catalogue-stack" aria-label="Confirm dialog examples">
        <div className="catalogue-row">
          <ConfirmActionButton
            buttonProps={{ variant: "outline" }}
            confirmLabel="Restore"
            description="The workspace and its files return to every member's list."
            onConfirm={async () => {
              await wait(900);
              return { ok: true };
            }}
            pendingLabel="Restoring…"
            title="Restore workspace?"
          >
            Restore (succeeds)
          </ConfirmActionButton>
          <ConfirmActionButton
            buttonProps={{ variant: "destructive" }}
            confirmLabel="Revoke link"
            description="Anyone holding the public link loses access immediately."
            destructive
            onConfirm={async (): Promise<ConfirmResult> => {
              await wait(700);
              return { ok: false, error: "The link was already revoked by another administrator." };
            }}
            pendingLabel="Revoking…"
            title="Revoke public link?"
          >
            Revoke (fails)
          </ConfirmActionButton>
          <ConfirmActionButton
            buttonProps={{ variant: "ghost" }}
            confirmLabel="Delete"
            description="This cannot be undone."
            destructive
            onConfirm={() => {
              throw new Error("Network unreachable. Try again when you are back online.");
            }}
            title="Delete member?"
          >
            Delete (throws)
          </ConfirmActionButton>
        </div>
        <div className="catalogue-row">
          <Button onClick={() => setOpen(true)} variant="secondary">
            Controlled with details
          </Button>
          <span>Removed: {removed}</span>
        </div>
        <ConfirmDialog
          confirmLabel="Remove 3 members"
          description="They lose access to every shared conversation in this workspace."
          destructive
          details={
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              <li>ada.lovelace.with.a.very.long.address.that.keeps.going@example.org</li>
              <li>grace@example.org</li>
              <li>edsger@example.org</li>
            </ul>
          }
          onConfirm={async () => {
            await wait(600);
            setRemoved((count) => count + 3);
          }}
          onOpenChange={setOpen}
          open={open}
          title="Remove members from Averylongworkspacenamewithoutanyspacesatallthatmustwrap?"
        />
      </section>
    </Frame>
  );
}

const rows = [
  "Short title",
  "Quarterly planning notes for the storage migration and the retention policy review",
  "Draft reply",
  "Averyveryverylongsinglewordtitlethatcannotwrapanywhereatall",
];

function TruncatedDemo() {
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <Frame
      title="Truncated text"
      description="A tooltip appears only when the text is actually cut off. It never intercepts clicks on row actions."
    >
      <section className="catalogue-stack" aria-label="Truncated rows" style={{ maxWidth: "18rem" }}>
        {rows.map((row) => (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              minHeight: 40,
              padding: "0 4px 0 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <TruncatedText side="right" sideOffset={40}>
              {row}
            </TruncatedText>
            <Button aria-label={`Actions for ${row}`} onClick={() => setClicked(row)} size="icon-sm" variant="ghost">
              <MoreHorizontal aria-hidden />
            </Button>
          </div>
        ))}
        <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
          Last action: {clicked ?? "none"}
        </p>
      </section>
    </Frame>
  );
}

function SettingsDemo() {
  return (
    <Frame title="Settings sections" description="Title, description and status on the left, controls on the right. Stacks on narrow screens.">
      <div className="catalogue-stack" style={{ gap: "1.5rem" }}>
        <SettingsSection
          description="How other members see you in shared conversations."
          id="profile"
          status={<Badge tone="success">Saved</Badge>}
          title="Profile"
        >
          <div className="catalogue-stack">
            <Label htmlFor="display-name">Display name</Label>
            <Input defaultValue="Ada" id="display-name" />
          </div>
        </SettingsSection>
        <SettingsSection
          description="Send a summary every morning. Delivery starts the next day and follows the workspace time zone, which an administrator can change from the organization page."
          id="digest"
          title="Daily digest with an unusually long section title that wraps"
        >
          <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Switch defaultChecked /> Email me a daily digest
          </label>
        </SettingsSection>
        <SettingsSection id="loading" status={<Badge>Loading</Badge>} title="Connected apps">
          <ShimmerText as="span">Checking connections</ShimmerText>
        </SettingsSection>
        <SettingsSection
          description="Could not load the current retention policy."
          id="retention"
          status={<Badge tone="danger">Error</Badge>}
          title="Retention"
        >
          <Button variant="outline">Try again</Button>
        </SettingsSection>
      </div>
    </Frame>
  );
}

function FilterDemo() {
  const [filters, setFilters] = useState([
    { label: "Owner", value: "ada@example.org" },
    { label: "Type", value: "image/png" },
    { label: "Workspace", value: "A remarkably long workspace name that should truncate inside the chip" },
  ]);
  return (
    <Frame title="Filter chips" description="Active filters with a one-click clear, as a link or a button. 44px on touch.">
      <section className="catalogue-stack" aria-label="Filter chips">
        <SectionHeader title="Links" />
        <div className="catalogue-row" style={{ gap: 8 }}>
          <FilterChip href="?owner=" label="Owner" value="ada@example.org" />
          <FilterChip href="?type=" label="Type" value="application/pdf" />
        </div>
        <SectionHeader title="Buttons" />
        <div className="catalogue-row" style={{ gap: 8, maxWidth: "32rem", minWidth: 0 }}>
          {filters.map((filter) => (
            <FilterChip
              key={filter.label}
              label={filter.label}
              onRemove={() => setFilters((current) => current.filter((item) => item !== filter))}
              value={filter.value}
            />
          ))}
          {filters.length === 0 ? <span style={{ color: "var(--muted-foreground)" }}>No active filters</span> : null}
        </div>
      </section>
    </Frame>
  );
}

const suggestions = [
  { icon: <BookOpen />, title: "Summarize a document", description: "Paste text or attach a file for a short summary." },
  { icon: <Code2 />, title: "Explain this code", description: "Walk through what a snippet does, line by line." },
  { icon: <Lightbulb />, title: "Brainstorm names", description: "Ten options with a one-line rationale each." },
  {
    icon: <Search />,
    title: "Research a topic with a very long title that will truncate",
    description:
      "Find recent sources, compare their claims and list the open questions that remain. This description is long enough to clamp at two lines.",
  },
];

function SuggestionDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Frame title="Suggestion cards" description="A grid on wide screens and a horizontal scroll row on narrow ones.">
      <section className="catalogue-stack" aria-label="Suggestions">
        <SuggestionGrid aria-label="Suggestions">
          {suggestions.map((item) => (
            <SuggestionCard
              description={item.description}
              icon={item.icon}
              key={item.title}
              onClick={() => setPicked(item.title)}
              title={item.title}
            />
          ))}
        </SuggestionGrid>
        <p style={{ margin: 0 }}>Picked: {picked ?? "none"}</p>
        <SectionHeader title="Disabled, three columns, no icons" />
        <SuggestionGrid aria-label="Disabled suggestions" columns={3}>
          {suggestions.slice(0, 3).map((item) => (
            <SuggestionCard disabled key={item.title} title={item.title} />
          ))}
        </SuggestionGrid>
      </section>
    </Frame>
  );
}

function ShimmerDemo() {
  return (
    <Frame title="Shimmer text" description="Loading label with a light sweep. Plain muted text under reduced motion.">
      <section className="catalogue-stack" aria-label="Shimmer examples">
        <ShimmerText>Thinking</ShimmerText>
        <ShimmerText as="span" duration={1.4} style={{ fontSize: 12 }}>
          Generating image
        </ShimmerText>
        <ShimmerText style={{ fontSize: 24, fontWeight: 600 }}>Searching 14 sources for recent coverage</ShimmerText>
      </section>
    </Frame>
  );
}

const reference = new Date(2026, 8, 26, 15);
const history = [
  { id: "1", title: "Storage migration plan", at: new Date(2026, 8, 26, 11) },
  { id: "2", title: "Welcome email draft", at: new Date(2026, 8, 25, 22) },
  { id: "3", title: "Release notes 0.4", at: new Date(2026, 8, 21) },
  { id: "4", title: "Pricing questions", at: new Date(2026, 8, 3) },
  { id: "5", title: "Offsite agenda", at: new Date(2026, 6, 14) },
  { id: "6", title: "Year in review", at: new Date(2025, 11, 20) },
];

function RecencyDemo({ items }: { items: typeof history }) {
  const groups = groupByRecency(items, (item) => item.at, reference);
  return (
    <Frame title="Recency groups" description="groupByRecency buckets items by calendar day relative to now (26 Sep 2026 here).">
      <nav aria-label="History" style={{ maxWidth: "16rem" }}>
        {groups.length === 0 ? <p style={{ color: "var(--muted-foreground)" }}>No history yet</p> : null}
        {groups.map((group) => (
          <section aria-label={group.label} key={group.key} style={{ marginBottom: 12 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>
              {group.label}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {group.items.map((item) => (
                <li key={item.id} style={{ display: "flex", minHeight: 32, alignItems: "center" }}>
                  <TruncatedText>{item.title}</TruncatedText>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </Frame>
  );
}

function FileThumbDemo() {
  const files = [
    { name: "landscape.png", mime: "image/png", src: swatch },
    { name: "missing.jpg", mime: "image/jpeg", src: "/does-not-exist.jpg" },
    { name: "report.pdf", mime: "application/pdf" },
    { name: "export.csv", mime: "text/csv" },
    { name: null, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { name: "voice-memo.m4a", mime: "audio/mp4", icon: <FileAudio /> },
    { name: "backup.tar.gz", mime: "application/gzip", icon: <Archive /> },
  ];
  return (
    <Frame title="File thumbnails" description="Image preview from a src, or a file-type tile. Broken images fall back to the tile.">
      <section className="catalogue-stack" aria-label="File thumbnails">
        {files.map((file) => (
          <div key={`${file.name}-${file.mime}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FileThumb filename={file.name} icon={file.icon} mime={file.mime} src={file.src} />
            <span>{file.name ?? "Untitled"}</span>
            <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{file.mime}</span>
          </div>
        ))}
        <div className="catalogue-row">
          <FileThumb alt="Landscape preview" size={72} src={swatch} />
          <FileThumb alt="PDF document" filename="contract.pdf" size={72} />
        </div>
      </section>
    </Frame>
  );
}

export const ConfirmDialogs: Story = { render: () => <ConfirmDemo /> };
export const TruncatedRows: Story = { render: () => <TruncatedDemo /> };
export const SettingsSections: Story = { render: () => <SettingsDemo /> };
export const FilterChips: Story = { render: () => <FilterDemo /> };
export const SuggestionCards: Story = { render: () => <SuggestionDemo /> };
export const Shimmer: Story = { render: () => <ShimmerDemo /> };
export const RecencyGroups: Story = { render: () => <RecencyDemo items={history} /> };
export const RecencyGroupsEmpty: Story = { render: () => <RecencyDemo items={[]} /> };
export const FileThumbnails: Story = { render: () => <FileThumbDemo /> };
