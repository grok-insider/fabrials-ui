import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brain, Paperclip, Search, Terminal } from "lucide-react";
import {
  Attachments,
  ChatComposer,
  ChatMessage,
  ComposerButton,
  ComposerMenu,
  ComposerSelect,
  ComposerToggle,
  MessageActions,
  ReadAloudAction,
  reduceAttachments,
  toAttachmentItems,
  useAttachments,
  type AttachmentEntry,
  type AttachmentState,
} from "@fabrials/ai-ui";
import {
  Button,
  DropOverlay,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";
import { composerBench, fakeUpload, pngFile, pngUrl, textFile, type UploadedFile } from "./composer-fixtures";
import { toneDataUri } from "./sound-fixtures";

const ACCEPT = "image/*,.txt";

const EFFORTS = [
  { value: "low", label: "Low", hint: "Fastest replies", icon: <Brain /> },
  { value: "medium", label: "Medium", hint: "Balanced", icon: <Brain /> },
  { value: "high", label: "High", hint: "Deeper reasoning, slower", icon: <Brain /> },
];

const MODES = [
  { value: "assist", label: "Assist", hint: "Answers questions", icon: <Search /> },
  { value: "tutor", label: "Tutor", hint: "Teaches step by step", icon: <Brain /> },
  { value: "practice", label: "Practice", hint: "Asks you instead", icon: <Terminal /> },
];

const sheet = { display: "grid", gap: "var(--fui-space-5)", padding: "var(--fui-space-3)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;

function rejectedWords(name: string, reason: "type" | "size" | "count") {
  if (reason === "type") return `${name}: that kind of file is not accepted.`;
  if (reason === "size") return `${name}: too large.`;
  return `${name}: the composer is full.`;
}

// The states of an upload, folded through the reducer the hook uses, so what is photographed is what the hook produces.
function fixedEntries(): AttachmentEntry<UploadedFile>[] {
  const files = [pngFile("harbour.png"), textFile("release-notes.txt"), pngFile("scan.png", "scan"), pngFile("plan.png", "scan")];
  const added: AttachmentEntry<UploadedFile>[] = files.map((file, at) => ({
    id: `fixed-${at}`,
    file,
    name: file.name,
    mediaType: file.type || "application/octet-stream",
    size: file.size,
    url: at === 0 ? pngUrl("harbour") : at === 2 || at === 3 ? pngUrl("scan") : undefined,
    status: "pending",
  }));
  let state: AttachmentState<UploadedFile> = reduceAttachments({ entries: [] }, { type: "add", entries: added });
  state = reduceAttachments(state, { type: "start", id: "fixed-1" });
  state = reduceAttachments(state, { type: "progress", id: "fixed-1", progress: 0.36 });
  state = reduceAttachments(state, { type: "start", id: "fixed-2" });
  state = reduceAttachments(state, { type: "fail", id: "fixed-2", error: "Too large: the limit is 20 MB" });
  state = reduceAttachments(state, { type: "start", id: "fixed-3" });
  state = reduceAttachments(state, { type: "done", id: "fixed-3", result: { id: "up-1", name: "plan.png", url: pngUrl("scan"), mediaType: "image/png" } });
  return state.entries;
}

const FIXED = fixedEntries();
const FIXED_ITEMS = toAttachmentItems(FIXED);

/** The composer the behaviour test drives: a real picker, a real drop and a real paste over a fake uploader it holds. */
function LiveComposer() {
  const [said, setSaid] = useState("Nothing has been sent.");
  const [rejected, setRejected] = useState<string[]>([]);
  const [failedLine, setFailedLine] = useState("");
  const [draft, setDraft] = useState("");
  const attachments = useAttachments<UploadedFile>({
    accept: ACCEPT,
    maxFiles: 8,
    onError: (error, file) => setFailedLine(`${file.name}: ${error instanceof Error ? error.message : "the upload failed"}`),
    onReject: (rejection) => setRejected((list) => [...list, rejectedWords(rejection.file.name, rejection.reason)]),
    pageDrop: true,
    upload: fakeUpload,
  });
  const failed = attachments.entries.filter((entry) => entry.status === "failed");

  const send = async (text: string) => {
    setSaid("Waiting for the uploads…");
    try {
      const { ids, items } = await attachments.waitForUploads();
      setSaid(`Sent “${text}” with ${items.length} file${items.length === 1 ? "" : "s"}: ${items.map((item) => item.name).join(", ") || "none"}.`);
      for (const id of ids) attachments.remove(id);
      setDraft("");
    } catch (error) {
      setSaid(error instanceof Error ? error.message : "The message could not be sent.");
    }
  };

  return (
    <div style={sheet}>
      <input {...attachments.inputProps} />
      <DropOverlay accept={ACCEPT} description="Pictures or text files" label="Drop files to attach" scope="page">
        <ChatComposer
          attachments={attachments.items.length > 0 ? <Attachments items={attachments.items} onRemove={attachments.remove} size="sm" variant="grid" /> : undefined}
          onPasteFiles={attachments.add}
          onRemoveLastAttachment={attachments.removeLast}
          onSubmit={(value) => void send(value)}
          onValueChange={setDraft}
          placeholder="Ask about these files"
          tools={
            <>
              <ComposerButton icon={<Paperclip />} label="Attach files" onClick={attachments.openPicker} tooltip="Attach files" />
              <ComposerToggle label="Web search" onPressedChange={() => {}} pressed={false}>
                Search
              </ComposerToggle>
            </>
          }
          value={draft}
        />
      </DropOverlay>
      {failed.length > 0 ? (
        <div style={row}>
          {failed.map((entry) => (
            <Button
              key={entry.id}
              onClick={() => {
                setFailedLine("");
                attachments.retry(entry.id);
              }}
              size="sm"
              variant="outline"
            >
              {`Retry ${entry.name}`}
            </Button>
          ))}
        </div>
      ) : null}
      <p data-slot="waited" style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
        {said}
      </p>
      <p data-slot="rejected" style={{ margin: 0, color: "var(--fui-danger-ink)", fontSize: "var(--fui-text-xs)" }}>
        {rejected.join(" ")}
      </p>
      <p data-slot="failed" role="alert" style={{ margin: 0, color: "var(--fui-danger-ink)", fontSize: "var(--fui-text-xs)" }}>
        {failedLine}
      </p>
    </div>
  );
}

// The voices a demo reads with: one long tone, so a key stays pressed while the test looks at it. Nothing is a person.
const readClip = async () => toneDataUri(440, 8);

/** A pill that picks, wired to state, so the test can watch its name and its tint change. */
function LiveSelect() {
  const [effort, setEffort] = useState("low");
  const [mode, setMode] = useState("tutor");
  return (
    <div style={row}>
      <ComposerSelect id="effort-pill" label="Reasoning effort" onValueChange={setEffort} options={EFFORTS} value={effort} />
      <ComposerSelect defaultValue="assist" id="mode-pill" label="Mode" onValueChange={setMode} options={MODES} value={mode} />
    </div>
  );
}

function Bench() {
  // The bench holds every upload in its hand, so a picture is the same on every run and nothing finishes on its own.
  composerBench().auto = false;
  return (
    <Page
      description="Uploads in a composer — queued, on their way, done and failed — the panel that says files can be dropped, a pill that picks a value, a pill that opens a menu, and a key that reads an answer aloud. Fixed states: nothing here uploads, plays or listens."
      title="Composer 0.12"
    >
      <Block
        description="Files go up three at a time as they are added; the ring counts, a failure says why and offers its retry, and sending waits for the files there are."
        title="A composer that uploads"
      >
        <Frame width={560}>
          <LiveComposer />
        </Frame>
      </Block>
      <Block description="Queued with no number yet, on its way at 36%, done, and failed with the sentence and the key that tries again." title="Each state of an upload">
        <Frame width={560}>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <Attachments items={FIXED_ITEMS} onRemove={() => {}} size="sm" variant="grid" />
            <Attachments
              items={[
                { id: "a", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.36 },
                { id: "b", name: "notes.pdf", mediaType: "application/pdf", size: 96_000, status: "ready" },
                { id: "c", name: "scan.tiff", mediaType: "image/tiff", status: "error", error: "Too large: the limit is 20 MB" },
              ]}
              onRemove={() => {}}
            />
            <div style={row}>
              <Button size="sm" variant="outline">
                Retry scan.tiff
              </Button>
            </div>
          </div>
        </Frame>
      </Block>
      <Block description="Over its own area, never the window: while files are dragged, and again when they are not accepted. At rest it is there, invisible and unread." title="Dropping files">
        <div style={{ display: "grid", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))" }}>
          <Frame width={280}>
            <DropOverlay active description="Pictures or text files" label="Drop files to attach">
              <div style={{ minHeight: "6rem", display: "grid", placeItems: "center", color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
                the conversation
              </div>
            </DropOverlay>
          </Frame>
          <Frame width={280}>
            <DropOverlay label="Drop files to attach">
              <div style={{ minHeight: "6rem", display: "grid", placeItems: "center", color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
                the conversation
              </div>
            </DropOverlay>
          </Frame>
          <Frame width={280}>
            <DropOverlay accept="image/*" active refused>
              <div style={{ minHeight: "6rem", display: "grid", placeItems: "center", color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
                the conversation
              </div>
            </DropOverlay>
          </Frame>
        </div>
      </Block>
      <Block description="A pill that picks: at its usual value, away from it, folded to its mark in a narrow composer, and disabled. Its name says what is chosen; the list it opens is a story of its own, as every open popup here is." title="Picking a value">
        <div style={{ display: "grid", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))", alignItems: "start" }}>
          <Frame width={280}>
            <div style={sheet}>
              <LiveSelect />
              <div style={row}>
                <ComposerSelect defaultValue="low" label="Effort" onValueChange={() => {}} options={EFFORTS} value="high" />
              </div>
            </div>
          </Frame>
          <Frame width={228}>
            <div style={sheet}>
              <ChatComposer
                onSubmit={() => {}}
                placeholder="A narrow composer"
                tools={<ComposerSelect label="Reasoning effort" onValueChange={() => {}} options={EFFORTS} value="low" />}
              />
            </div>
          </Frame>
          <Frame width={280}>
            <div style={sheet}>
              <ComposerSelect defaultValue="low" disabled label="Effort (disabled)" onValueChange={() => {}} options={EFFORTS} value="high" />
            </div>
          </Frame>
        </div>
      </Block>
      <Block description="The same pill, opening a menu of settings that stay and actions that happen once." title="More controls">
        <Frame width={420}>
          <div style={sheet}>
            <div style={row}>
              <ComposerMenu icon={<Terminal />} label="More controls" menuLabel="Chat controls">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked>Search the web</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={false}>Quote sources</DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Effort</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value="high">
                    <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
              </ComposerMenu>
              <ComposerMenu icon={<Terminal />} label="Settings" text="Settings">
                <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
              </ComposerMenu>
            </div>
          </div>
        </Frame>
      </Block>
      <Block description="A key in the row of an answer: at rest, while it reads, and while its first piece is still loading. A second key elsewhere stops the first." title="Reading an answer aloud">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-5)" }}>
            <ChatMessage
              actions={
                <MessageActions>
                  <ReadAloudAction id="first" loadClip={readClip} text="The harbour opens at nine. Bring the list." />
                </MessageActions>
              }
              from="assistant"
              pinActions
            >
              <p style={{ margin: 0 }}>The harbour opens at nine. Bring the list.</p>
            </ChatMessage>
            <ChatMessage
              actions={
                <MessageActions>
                  <ReadAloudAction id="second" loadClip={readClip} text="The orchard is on the north side." />
                </MessageActions>
              }
              from="assistant"
              pinActions
            >
              <p style={{ margin: 0 }}>The orchard is on the north side.</p>
            </ChatMessage>
            <ChatMessage
              actions={
                <MessageActions>
                  <ReadAloudAction
                    id="reading"
                    speech={{ speaking: true, loading: false, currentId: "reading", speak: async () => {}, stop: () => {} }}
                    text="The tide turns at two."
                  />
                </MessageActions>
              }
              from="assistant"
              pinActions
            >
              <p style={{ margin: 0 }}>The tide turns at two.</p>
            </ChatMessage>
            <ChatMessage
              actions={
                <MessageActions>
                  <ReadAloudAction
                    id="loading"
                    speech={{ speaking: true, loading: true, currentId: "loading", speak: async () => {}, stop: () => {} }}
                    text="A fourth answer, whose first piece is still loading."
                  />
                </MessageActions>
              }
              from="assistant"
              pinActions
            >
              <p style={{ margin: 0 }}>A fourth answer, whose first piece is still loading.</p>
            </ChatMessage>
          </div>
        </Frame>
      </Block>
      <Block description="The same composer, files and pills in a page that reads right to left." title="Right to left">
        <Frame dir="rtl" width={520}>
          <div style={sheet}>
            <ChatComposer
              attachments={<Attachments items={FIXED_ITEMS} onRemove={() => {}} size="sm" variant="grid" />}
              onSubmit={() => {}}
              placeholder="اسأل عن هذه الملفات"
              tools={
                <>
                  <ComposerButton icon={<Paperclip />} label="إرفاق ملفات" />
                  <ComposerSelect label="مستوى التفكير" onValueChange={() => {}} options={EFFORTS} value="high" />
                </>
              }
              value="قارن هذه بالربع الماضي"
            />
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Composer 0.12",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };

/** The list open: a select is modal, so a page that opens one is inert around it, and it gets a page of its own. */
export const Open: Story = {
  render: () => (
    <Page description="The list under the pill: two lines a row, the mark of what it chooses, and a tick on the one in use." title="Composer 0.12, open">
      <div style={{ display: "flex", alignItems: "flex-start", minHeight: "24rem" }}>
        <ComposerSelect defaultOpen id="open-effort" label="Reasoning effort" onValueChange={() => {}} options={EFFORTS} value="high" />
      </div>
    </Page>
  ),
};
