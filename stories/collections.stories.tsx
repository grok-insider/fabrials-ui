import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Forward, MailOpen, Reply, Star, Trash2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  avatarInitials,
  Badge,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  Dropzone,
  formatBytes,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ListBox,
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  StatePanel,
  VirtualList,
  type FileRejection,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Collections",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Sender = { id: string; name: string; address: string; count: number; muted?: boolean };
const SENDERS: Sender[] = [
  { id: "north", name: "North workspace", address: "billing@north.example", count: 412 },
  { id: "harbour", name: "Harbour lab", address: "news@harbour.example", count: 96 },
  { id: "field", name: "Field office", address: "ops@field.example", count: 58 },
  { id: "night", name: "Night shift", address: "alerts@night.example", count: 31, muted: true },
  { id: "orchard", name: "Orchard studio", address: "hello@orchard.example", count: 12 },
  { id: "quarry", name: "Quarry records", address: "receipts@quarry.example", count: 7 },
];

function SenderRow({ sender }: { sender: Sender }) {
  return (
    <>
      <ItemMedia>
        <Avatar size="sm">
          <AvatarFallback>{avatarInitials(sender.name)}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{sender.name}</ItemTitle>
        <ItemDescription>{sender.address}</ItemDescription>
      </ItemContent>
      <Badge variant="outline">{sender.count}</Badge>
    </>
  );
}

const LOG = Array.from({ length: 10000 }, (_, index) => ({
  id: `line-${index + 1}`,
  text: `#${String(index + 1).padStart(5, "0")}  sync ${["mailbox", "contacts", "calendar", "files"][index % 4]} · ${(index * 37) % 900} ms`,
}));

const POSTS = Array.from({ length: 400 }, (_, index) => ({
  id: `post-${index}`,
  author: ["North workspace", "Harbour lab", "Field office"][index % 3]!,
  text: "Quarterly usage is up. ".repeat(1 + (index % 4)) + (index % 5 === 0 ? "The renewal moved to the first of next month, and the invoice now goes out in euros." : ""),
}));

function ListsPage() {
  const [picked, setPicked] = useState<string[]>(["harbour"]);
  const [opened, setOpened] = useState("Nothing opened yet.");
  const [many, setMany] = useState<string[]>(["north", "field"]);
  return (
    <Page
      title="Lists"
      description="A list people choose from with the keyboard: one tab stop, arrows, Home, End, Page keys and type-ahead; Enter opens. Rows are Item rows, and a long list draws only what is on screen."
    >
      <Block title="One choice, following the arrows" description="Like a mailbox: the selection follows the keyboard. Type “ha” to jump; Enter opens.">
        <Frame width={480}>
          <ListBox
            aria-label="Senders"
            items={SENDERS}
            getKey={(sender) => sender.id}
            getTextValue={(sender) => sender.name}
            selected={picked}
            onSelectedChange={setPicked}
            onAction={(_, sender) => setOpened(`Opened ${sender.name}.`)}
            renderItem={(sender) => <SenderRow sender={sender} />}
          />
          <p className="fui-description" role="status" style={{ marginTop: "var(--fui-space-2)" }}>
            {opened}
          </p>
        </Frame>
      </Block>
      <Block title="Several choices" description="Shift extends, Ctrl or ⌘ toggles, Space toggles the active row, Ctrl+A takes all. Muted senders cannot be chosen.">
        <Frame width={480}>
          <ListBox
            aria-label="Senders to clean up"
            selectionMode="multiple"
            items={SENDERS}
            getKey={(sender) => sender.id}
            getTextValue={(sender) => sender.name}
            isDisabled={(sender) => !!sender.muted}
            selected={many}
            onSelectedChange={setMany}
            renderItem={(sender) => <SenderRow sender={sender} />}
          />
          <p className="fui-description" role="status" style={{ marginTop: "var(--fui-space-2)" }}>
            {many.length} chosen
          </p>
        </Frame>
      </Block>
      <Block title="Ten thousand rows" description="Only the rows on screen exist; End goes to the last one.">
        <Frame width={480}>
          <ListBox
            aria-label="Sync log"
            items={LOG}
            getKey={(line) => line.id}
            getTextValue={(line) => line.text}
            virtual={{ estimateSize: 44 }}
            height={288}
            renderItem={(line) => <span className="fui-listbox-mono">{line.text}</span>}
          />
        </Frame>
      </Block>
      <Block title="A virtual feed" description="Rows of any height, measured as they appear; a plain list, so links and buttons inside keep working.">
        <Frame width={480}>
          <VirtualList
            aria-label="Feed"
            items={POSTS}
            getKey={(post) => post.id}
            estimateSize={72}
            height={320}
            renderItem={(post) => (
              <article className="catalogue-feed-row">
                <strong>{post.author}</strong>
                <p>{post.text}</p>
              </article>
            )}
          />
        </Frame>
      </Block>
      <Block title="Empty">
        <Frame width={480}>
          <ListBox
            aria-label="Blocked senders"
            items={[] as Sender[]}
            getKey={(sender) => sender.id}
            renderItem={(sender) => <SenderRow sender={sender} />}
            empty={<StatePanel size="sm" state="empty" title="No blocked senders" description="Senders you block appear here." />}
          />
        </Frame>
      </Block>
    </Page>
  );
}

function PanelsPage() {
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState<string[]>(["north"]);
  const [files, setFiles] = useState<File[]>([]);
  const [refused, setRefused] = useState<FileRejection[]>([]);
  const sender = useMemo(() => SENDERS.find((item) => item.id === current[0]) ?? SENDERS[0]!, [current]);
  return (
    <Page
      wide
      title="Panels and menus"
      description="A docked detail pane beside a list, a context menu on its rows and a dropzone. The pane resizes from its edge and becomes a sheet on a phone."
    >
      <Block title="List and detail" description="Drag the pane's edge, or focus it and use the arrows. Escape inside the pane closes it. Right-click a row, or press Shift+F10, for its menu.">
        <div className="catalogue-split">
          <div className="catalogue-split-main">
            <ContextMenu>
              <ContextMenuTrigger>
                <ListBox
                  aria-label="Inbox senders"
                  items={SENDERS}
                  getKey={(item) => item.id}
                  getTextValue={(item) => item.name}
                  selected={current}
                  onSelectedChange={setCurrent}
                  onAction={() => setOpen(true)}
                  renderItem={(item) => <SenderRow sender={item} />}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setOpen(true)}>
                  <MailOpen aria-hidden /> Open
                </ContextMenuItem>
                <ContextMenuItem>
                  <Reply aria-hidden /> Reply <ContextMenuShortcut>R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  <Forward aria-hidden /> Forward <ContextMenuShortcut>F</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  <Star aria-hidden /> Star
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <Archive aria-hidden /> Archive <ContextMenuShortcut>E</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem variant="destructive">
                  <Trash2 aria-hidden /> Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            {!open ? (
              <Button variant="outline" size="sm" style={{ marginTop: "var(--fui-space-3)" }} onClick={() => setOpen(true)}>
                Open details
              </Button>
            ) : null}
          </div>
          <SidePanel open={open} onOpenChange={setOpen} defaultWidth={340} minWidth={280} maxWidth={520} sheetBelow={640}>
            <SidePanelHeader>
              <SidePanelTitle>{sender.name}</SidePanelTitle>
              <SidePanelClose />
            </SidePanelHeader>
            <SidePanelBody>
              <SidePanelDescription>{sender.address}</SidePanelDescription>
              <DescriptionList>
                <DescriptionItem>
                  <DescriptionTerm>Messages</DescriptionTerm>
                  <DescriptionDetails>{sender.count}</DescriptionDetails>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>Last received</DescriptionTerm>
                  <DescriptionDetails>5 Nov 2026</DescriptionDetails>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>Unsubscribe</DescriptionTerm>
                  <DescriptionDetails>One click, by mail</DescriptionDetails>
                </DescriptionItem>
              </DescriptionList>
            </SidePanelBody>
            <SidePanelFooter>
              <Button variant="outline" size="sm">
                Mute
              </Button>
              <Button size="sm">Unsubscribe</Button>
            </SidePanelFooter>
          </SidePanel>
        </div>
      </Block>
      <Block title="Dropzone" description="A large target for a drag; the keyboard reaches the real file input through the button. Refused files are said, not kept.">
        <div className="catalogue-grid">
          <Dropzone
            label="Drop receipts here"
            description="PDF or images, up to 2 MB each."
            accept=".pdf,image/*"
            maxSize={2 * 1024 * 1024}
            onFilesChange={(next) => setFiles((now) => [...now, ...next])}
            onFilesRejected={setRefused}
            error={refused.length ? `${refused.map((item) => item.file.name).join(", ")}: ${refused[0]!.reason === "size" ? "larger than 2 MB" : "not a PDF or an image"}.` : undefined}
          >
            {files.length ? (
              <ul className="catalogue-file-list" aria-label="Chosen files">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    {file.name} <span className="fui-description">{formatBytes("en-GB", file.size)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Dropzone>
          <Dropzone label="Uploads are paused" description="The workspace is read-only." disabled />
        </div>
      </Block>
    </Page>
  );
}

export const Lists: Story = { render: () => <ListsPage /> };
export const Panels: Story = { render: () => <PanelsPage /> };
