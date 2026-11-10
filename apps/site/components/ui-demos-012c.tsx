"use client";

// Previews for what 0.12 added to @fabrials/ai-ui — the conversation, the frame of a drawing, a tool call, the follow-ups,
// the files a composer uploads, the pills that pick and open a menu, reading an answer aloud, callouts, the pure markdown
// helpers and a message edited where it stands — and for the accounts and usage family, which had no page at all.
// Synthetic data only, every date fixed, and nothing runs until a person presses something.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Paperclip, Terminal } from "lucide-react";
import {
  ArtifactFrame,
  Attachments,
  ApiKeyFields,
  ApiKeyForm,
  BalanceCard,
  ChatComposer,
  ChatMessage,
  ComposerMenu,
  ComposerSelect,
  ConsumptionView,
  Conversation,
  ConversationCheckpoints,
  ConversationContent,
  ConversationFooter,
  ConversationScrollButton,
  CopyMessageAction,
  EditableMessage,
  EditMessageAction,
  HostedMigration,
  LinkedAccountUsage,
  MarkdownCallout,
  MessageActions,
  MessageTimestamp,
  MigrationReviewDetails,
  ObservationStatus,
  PrivateHistoryView,
  ProviderCard,
  ReadAloudAction,
  ResetInventory,
  RoutingExplanation,
  RoutingPolicyForm,
  SuggestionChips,
  SynchronizedAccounts,
  SynchronizedConsumption,
  ToolCall,
  useAsyncRender,
  useAttachments,
  type ArtifactSlot,
  type AttachmentItem,
  type ConsumptionSnapshot,
  type HostedMigrationApi,
  type Observation,
  type ProviderOutput,
  type SynchronizedAccount,
  type ToolCallState,
} from "@fabrials/ai-ui";
import { CALLOUT_KINDS, calloutOf, normalizeMath, textDirection } from "@fabrials/ai-ui/markdown";
import {
  Button,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  useHydrated,
  useReducedMotion,
} from "@fabrials/ui";
import type { CreditBalance, PrivateRecentPage } from "@fabrials/ai-ui";
import { Frame } from "@/components/demo-frame";

const column = {
  display: "grid",
  gap: "var(--fui-space-3)",
  inlineSize: "100%",
} as const;
const rows = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--fui-space-2)",
} as const;
const note = { margin: 0, color: "var(--muted-foreground)" } as const;
const mono = {
  margin: 0,
  fontFamily: "var(--fui-font-label)",
  fontSize: "var(--fui-text-label)",
  color: "var(--muted-foreground)",
} as const;
const plate = {
  display: "grid",
  gap: "var(--fui-space-3)",
  padding: "var(--fui-space-4)",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  background: "var(--card)",
} as const;

/* ---------------------------------------------------------------- the conversation */

type Turn = { id: string; from: "user" | "assistant"; body: string };

const THREAD: Turn[] = [
  { id: "t1", from: "user", body: "Which layers does the cascade use, and in what order?" },
  {
    id: "t2",
    from: "assistant",
    body: "Three: base, then components, then utilities. A product adds its own sheet above them, so nothing the system ships is overridden by accident.",
  },
  { id: "t3", from: "user", body: "Where do the tokens live?" },
  {
    id: "t4",
    from: "assistant",
    body: "In the base layer, as custom properties on the root. A theme overrides them on one element and everything under it follows.",
  },
  { id: "t5", from: "user", body: "And a table inside an answer?" },
  {
    id: "t6",
    from: "assistant",
    body: "It takes the whole column while prose keeps the reading measure, so a wide row is never squeezed into a column of words.",
  },
  { id: "t7", from: "user", body: "What happens to the rail on a phone?" },
  {
    id: "t8",
    from: "assistant",
    body: "It steps aside: below a 40rem container, and on a coarse pointer, the rail is not drawn, because a 3 px tick cannot be hit.",
  },
];

function Answer({ children }: { children: ReactNode }) {
  return (
    <div className="fui-markdown">
      <p>{children}</p>
    </div>
  );
}

function TurnList({ turns }: { turns: Turn[] }) {
  return (
    <>
      {turns.map((turn) =>
        turn.from === "assistant" ? (
          <ChatMessage from="assistant" key={turn.id}>
            <Answer>{turn.body}</Answer>
          </ChatMessage>
        ) : (
          <ChatMessage from="user" key={turn.id}>
            {turn.body}
          </ChatMessage>
        ),
      )}
    </>
  );
}

function ConversationDemo() {
  const [turns, setTurns] = useState<Turn[]>(THREAD);
  const [draft, setDraft] = useState("");
  const sent = useRef(0);
  const send = (text: string) => {
    const body = text.trim();
    if (!body) return;
    sent.current += 1;
    setTurns((list) => [...list, { id: `sent-${sent.current}`, from: "user", body }]);
    setDraft("");
  };
  return (
    <Frame width="wide">
      <div style={{ blockSize: "26rem", display: "flex" }}>
        <Conversation stickKey={turns.length}>
          <ConversationContent measure>
            <TurnList turns={turns} />
          </ConversationContent>
          <ConversationCheckpoints />
          <ConversationScrollButton />
          <ConversationFooter>
            <ChatComposer onValueChange={setDraft} onSubmit={send} placeholder="Message" value={draft} />
          </ConversationFooter>
        </Conversation>
      </div>
      <div style={rows}>
        <Button onClick={() => send(`Message ${sent.current + 1}: what else should I know?`)} size="sm" variant="outline">
          Send a message
        </Button>
        <span style={note}>A sent message locks the end again, even from up here. The rail lists your own turns.</span>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the frame of a drawing */

// A made-up chart, drawn with the page's own inks so it reads in both themes. Nothing is fetched and nothing is generated.
const CHART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" role="img" aria-label="Sign-ups each month">
  <g stroke="currentColor" stroke-opacity="0.18" stroke-width="1">
    <line x1="40" y1="40" x2="464" y2="40"/>
    <line x1="40" y1="90" x2="464" y2="90"/>
    <line x1="40" y1="140" x2="464" y2="140"/>
    <line x1="40" y1="190" x2="464" y2="190"/>
    <line x1="40" y1="212" x2="464" y2="212"/>
  </g>
  <g fill="var(--brand)" style="fill: var(--brand)">
    <rect x="58" y="150" width="34" height="62" rx="3"/>
    <rect x="118" y="122" width="34" height="90" rx="3"/>
    <rect x="178" y="134" width="34" height="78" rx="3"/>
    <rect x="238" y="86" width="34" height="126" rx="3"/>
    <rect x="298" y="66" width="34" height="146" rx="3"/>
    <rect x="358" y="44" width="34" height="168" rx="3"/>
  </g>
  <g fill="currentColor" fill-opacity="0.6" font-family="var(--fui-font-label)" font-size="11">
    <text x="58" y="232">Jan</text>
    <text x="118" y="232">Feb</text>
    <text x="178" y="232">Mar</text>
    <text x="238" y="232">Apr</text>
    <text x="298" y="232">May</text>
    <text x="358" y="232">Jun</text>
  </g>
</svg>`;

function Drawn({ slot, source }: { slot: ArtifactSlot; source: string }) {
  const { onExport, onReady } = slot;
  useEffect(() => {
    onExport({ svg: () => source });
    onReady();
  }, [onExport, onReady, source]);
  return <div dangerouslySetInnerHTML={{ __html: source }} />;
}

function ArtifactFrameDemo() {
  const [run, setRun] = useState(0);
  const drawing = useAsyncRender(async () => CHART, [run]);
  return (
    <Frame width="wide">
      <ArtifactFrame
        kind="Chart"
        onRetry={() => setRun((value) => value + 1)}
        source={CHART}
        sourceLanguage="xml"
        status={drawing.status}
        title="Sign-ups each month"
      >
        {(slot) => <Drawn slot={slot} source={drawing.value ?? CHART} />}
      </ArtifactFrame>
      <div style={rows}>
        <Button onClick={() => setRun((value) => value + 1)} size="sm" variant="outline">
          Draw it again
        </Button>
        <span style={note}>
          The frame&apos;s own toggle shows the source; copy, the two downloads and full screen are in its toolbar. The body
          keeps its height while the drawing is on its way.
        </span>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a tool call */

const CALLS: { state: ToolCallState; name: string; duration?: number; error?: string }[] = [
  { state: "running", name: "list_files" },
  { state: "done", name: "search_docs", duration: 1240 },
  { state: "error", name: "read_file", error: "The file is not in the workspace." },
  { state: "denied", name: "run_tests" },
];

function ToolCallDemo() {
  const [step, setStep] = useState(0);
  return (
    <Frame width="wide">
      <ToolCall
        duration={step > 1 ? 980 : undefined}
        input={{ query: "reading measure", limit: 3 }}
        name="search_docs"
        output={step > 1 ? { matches: 2, sources: ["layout.md", "conversation.md"] } : undefined}
        state={step === 0 ? "pending" : step === 1 ? "running" : "done"}
      />
      <div style={rows}>
        <Button onClick={() => setStep((value) => (value + 1) % 3)} size="sm" variant="outline">
          {step === 0 ? "Run the call" : step === 1 ? "Let it answer" : "Start again"}
        </Button>
        <span style={note}>One call, in words, with the time it took once it has answered.</span>
      </div>
      <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
        {CALLS.map((call) => (
          <ToolCall
            duration={call.duration}
            error={call.error}
            input={{ path: "notes.md" }}
            key={call.state}
            name={call.name}
            output={call.state === "done" ? "18 lines" : undefined}
            state={call.state}
          />
        ))}
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the follow-ups */

const FOLLOW_UPS = [
  { id: "quiz", label: "Quiz me", value: "quiz" },
  { id: "visual", label: "Show it visually", value: "visual" },
  { id: "longer", label: "Turn this into a five-question quiz with the answers at the end" },
  { id: "simpler", label: "Simpler", value: "simpler" },
];

function SuggestionChipsDemo() {
  const [chosen, setChosen] = useState<string[]>([]);
  return (
    <Frame width="form">
      <SuggestionChips items={FOLLOW_UPS} onSelect={(item) => setChosen((list) => [...list, item.value ?? item.label])} />
      <p style={note} role="status">
        {chosen.length ? `Chosen: ${chosen.join(", ")}.` : "Nothing chosen yet. One tab stop; the arrows move between chips."}
      </p>
      <SuggestionChips disabled items={FOLLOW_UPS.slice(0, 3)} onSelect={() => undefined} />
      <p style={note}>A disabled group blocks every chip without removing them from the page.</p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the files of a composer */

type Upload = { progress: (value: number) => void; resolve: () => void; reject: (error: Error) => void };

// The four states a file can be in, held still for the picture: they are the view the hook's items give.
const HELD: AttachmentItem[] = [
  { id: "a", name: "harbour.png", mediaType: "image/png", size: 41_000, status: "uploading" },
  { id: "b", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.36 },
  { id: "c", name: "notes.txt", mediaType: "text/plain", size: 2_100, status: "ready" },
  { id: "d", name: "scan.png", mediaType: "image/png", size: 9_400_000, status: "error", error: "Too large: the limit is 2 MB" },
];

function UseAttachmentsDemo() {
  const waiting = useRef<Upload[]>([]);
  const [held, setHeld] = useState<AttachmentItem[]>(HELD);
  const [rejected, setRejected] = useState<string[]>([]);
  const [said, setSaid] = useState("Nothing added yet. The uploader here waits for you.");
  const files = useAttachments<{ id: string }>({
    accept: "image/*,.txt",
    maxFiles: 4,
    maxSize: 2_000_000,
    onReject: (rejection) =>
      setRejected((list) => [...list, `${rejection.file.name}: ${rejection.reason === "count" ? "the composer is full." : "that kind of file is not accepted."}`]),
    upload: (file) => new Promise((resolve, reject) => waiting.current.push({ progress: () => undefined, resolve: () => resolve({ id: file.name }), reject })),
  });
  const add = () => {
    const made = [
      new File(["harbour"], "harbour.png", { type: "image/png" }),
      new File(["notes"], "release-notes.txt", { type: "text/plain" }),
      new File(["scan"], "scan.png", { type: "image/png" }),
    ];
    files.add(made);
    setSaid(`${made.length} files queued. Nothing has left this page.`);
  };
  const finish = (fail: boolean) => {
    const queue = waiting.current.splice(0);
    for (const [index, upload] of queue.entries()) {
      upload.progress(index === 0 ? 0.36 : 1);
      if (fail && index === queue.length - 1) upload.reject(new Error("The connection closed before the file was sent."));
      else upload.resolve();
    }
    setSaid(fail ? "The last file failed and says why; retry sends it again." : "Every file reached the server. Send waits for them.");
  };
  return (
    <Frame width="wide">
      <div style={column}>
        <ChatComposer
          attachments={
            files.items.length > 0 ? (
              <Attachments items={files.items} onRemove={files.remove} size="sm" variant="grid" />
            ) : undefined
          }
          onSubmit={() => setSaid("Sending waits for the files there are; a file added meanwhile goes with the next message.")}
          placeholder="Ask about these files"
          tools={
            <Button onClick={add} size="sm" variant="outline">
              <Paperclip aria-hidden="true" size={14} /> Add three files
            </Button>
          }
        />
        <div style={rows}>
          <Button onClick={() => finish(false)} size="sm" variant="outline">
            Finish the uploads
          </Button>
          <Button onClick={() => finish(true)} size="sm" variant="outline">
            Fail the last one
          </Button>
        </div>
        <p style={note} role="status">
          {said}
        </p>
        {rejected.length > 0 ? <p style={note}>{rejected.join(" ")}</p> : null}
        <div style={plate}>
          <p style={mono}>the four states, held still</p>
          <Attachments items={held} onRemove={(id) => setHeld((list) => list.filter((item) => item.id !== id))} />
          {held.some((item) => item.status === "error") ? (
            <div style={rows}>
              <Button
                onClick={() => setHeld((list) => list.map((item) => (item.status === "error" ? { ...item, error: undefined, progress: 0.12, status: "uploading" } : item)))}
                size="sm"
                variant="outline"
              >
                Retry scan.png
              </Button>
              <span style={note}>The retry key is the host&apos;s: the hook only says which file failed and why.</span>
            </div>
          ) : null}
          <p style={note}>Queued, on its way at 36 %, done, and failed with its reason and the way back.</p>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the pills of a composer */

const EFFORTS = [
  { value: "low", label: "Low", hint: "Fastest replies" },
  { value: "medium", label: "Medium", hint: "Balanced" },
  { value: "high", label: "High", hint: "Deeper reasoning, slower" },
];

const MODES = [
  { value: "assist", label: "Assist", hint: "Answers questions" },
  { value: "tutor", label: "Tutor", hint: "Teaches step by step" },
  { value: "practice", label: "Practice", hint: "Asks you instead" },
];

function ComposerSelectDemo() {
  const [effort, setEffort] = useState("low");
  const [mode, setMode] = useState("tutor");
  const [web, setWeb] = useState(true);
  return (
    <Frame width="wide">
      <ChatComposer
        onSubmit={() => undefined}
        placeholder="Message"
        tools={
          <>
            <ComposerSelect label="Reasoning effort" onValueChange={setEffort} options={EFFORTS} value={effort} />
            <ComposerSelect defaultValue="assist" label="Mode" onValueChange={setMode} options={MODES} value={mode} />
            <ComposerMenu icon={<Terminal aria-hidden="true" size={16} />} label="More controls" menuLabel="Chat controls">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={web} onCheckedChange={setWeb}>
                  Search the web
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={false}>Quote sources</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Effort</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={effort}>
                  {EFFORTS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} onSelect={() => setEffort(option.value)} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
            </ComposerMenu>
          </>
        }
      />
      <p style={note} role="status">
        Effort {effort}, mode {mode}, web search {web ? "on" : "off"}. A pill away from its usual value carries the pressed
        tint, and its name says what is chosen.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- reading an answer aloud */

/** A second of a low tone, built here: no voice, no file and no network. */
function toneDataUri(frequency = 220, seconds = 1, sampleRate = 4000): string {
  const count = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(44 + count);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) bytes[offset + at] = text.charCodeAt(at);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, count, true);
  for (let at = 0; at < count; at += 1) bytes[44 + at] = 128 + Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 20);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const ANSWER = "The harbour opens at nine. Bring the list and the two keys.";

function ReadAloudDemo() {
  return (
    <Frame width="wide">
      <ChatMessage from="user">When does the harbour open?</ChatMessage>
      <ChatMessage
        actions={
          <MessageActions>
            <CopyMessageAction text={ANSWER} />
            <ReadAloudAction id="demo-read-aloud" lang="en" loadClip={async () => toneDataUri(220, 6)} text={ANSWER} />
          </MessageActions>
        }
        from="assistant"
        pinActions
      >
        <Answer>{ANSWER}</Answer>
      </ChatMessage>
      <p style={note}>
        The clip is a made-up tone, built in this page: no voice, no file and no network. The same key stops it, and a second
        key elsewhere would stop it too, because one reader sounds at a time.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- notes, tips and warnings */

const CALLED_OUT: { kind: string; body: string }[] = [
  { kind: "note", body: "The column keeps its measure while a table inside it takes the whole width." },
  { kind: "tip", body: "Start from the units, then the numbers." },
  { kind: "important", body: "A message with no text cannot be sent, whatever else it carries." },
  { kind: "warning", body: "Check the deployment first: the migration moves data." },
  { kind: "caution", body: "This stops the running work and cannot be undone." },
  { kind: "example", body: "An answer of three lines takes the measure, not the page." },
  { kind: "definition", body: "The measure is the width prose is read at." },
  { kind: "summary", body: "Three layers, one order, and nothing overrides by accident." },
  { kind: "question", body: "Which of these applies to a transcript read from the top?" },
];

function MarkdownCalloutDemo() {
  return (
    <Frame width="wide">
      <div
        style={{
          display: "grid",
          gap: "var(--fui-space-3)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
          alignItems: "start",
        }}
      >
        {CALLED_OUT.map((callout) => (
          <MarkdownCallout key={callout.kind} kind={callout.kind as "note"}>
            <p>{callout.body}</p>
          </MarkdownCallout>
        ))}
      </div>
      <MarkdownCallout kind="tip" title="Start from the units">
        <p>A title of your own names the callout for a screen reader too, so nothing else is needed.</p>
      </MarkdownCallout>
      <p style={note}>
        Each kind is a tint of its tone with the title and the mark in that tone&apos;s ink. A host that renders its own
        markdown writes the same classes by hand; the example set shows the markup.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the markdown helpers */

const MARKDOWN_SAMPLES: { input: string; note: string }[] = [
  { input: "> [!TIP]\n> Start from the units.", note: "kind, no title, one line left" },
  { input: "> [!warning] Check the deployment first\n> Three steps.", note: "kind and a title" },
  { input: "> Just a quote.", note: "not a callout at all" },
];

function MarkdownHelpersDemo() {
  const mine = "مرحبا. هذه جملة عربية.";
  return (
    <Frame width="wide">
      <div className="fui-markdown" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
        <div>
          <h3>calloutOf</h3>
          <ul>
            {MARKDOWN_SAMPLES.map((sample) => {
              const parsed = calloutOf(sample.input);
              return (
                <li key={sample.input}>
                  <code>{JSON.stringify(sample.input)}</code> gives{" "}
                  <code>
                    {parsed
                      ? `{ kind: "${parsed.kind}", title: ${parsed.title === null ? "null" : `"${parsed.title}"`}, rest: "${parsed.rest}" }`
                      : "null"}
                  </code>{" "}
                  — {sample.note}.
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3>textDirection</h3>
          <ul>
            <li>
              <code>&quot;{mine}&quot;</code> is <code>{JSON.stringify(textDirection(mine))}</code>.
            </li>
            <li>
              <code>&quot;2026 · release notes&quot;</code> is <code>{JSON.stringify(textDirection("2026 · release notes"))}</code>.
            </li>
            <li>
              <code>&quot;`const a = 1` is code&quot;</code> is <code>{JSON.stringify(textDirection("`const a = 1` is code"))}</code>, because a
              code span is not a sentence.
            </li>
          </ul>
        </div>
        <div>
          <h3>normalizeMath</h3>
          <ul>
            <li>
              <code>{String.raw`\(a^2 + b^2\)`}</code> becomes <code>{normalizeMath(String.raw`\(a^2 + b^2\)`)}</code>.
            </li>
            <li>
              <code>{String.raw`$5 and $10`}</code> stays <code>{normalizeMath("$5 and $10")}</code>: a price is not mathematics.
            </li>
            <li>
              <code>{String.raw`\[3\]`}</code> stays <code>{normalizeMath(String.raw`\[3\]`)}</code>: an escaped bracket is a citation.
            </li>
          </ul>
        </div>
        <p style={note}>
          CALLOUT_KINDS: <code>{CALLOUT_KINDS.join(", ")}</code>. The three functions import nothing, so a Node renderer can
          call them without React.
        </p>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a message edited where it stands */

const SENT = "Ship the reading measure with the release.";

function EditableMessageDemo() {
  const [text, setText] = useState(SENT);
  const [editing, setEditing] = useState(false);
  const [said, setSaid] = useState("Sent as it was.");
  const pencil = useRef<HTMLButtonElement>(null);
  return (
    <Frame width="wide">
      <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
        {editing ? (
          <EditableMessage
            hint="Sending it again replaces the answers after it."
            onCancel={() => {
              setEditing(false);
              setSaid("Cancelled: the message is as it was sent.");
            }}
            onSubmit={(next) => {
              setText(next);
              setEditing(false);
              setSaid(`Sent again as “${next}”.`);
            }}
            returnFocusRef={pencil}
            value={text}
          />
        ) : (
          <ChatMessage
            actions={
              <MessageActions>
                <EditMessageAction onClick={() => setEditing(true)} ref={pencil} />
                <CopyMessageAction text={text} />
              </MessageActions>
            }
            from="user"
            pinActions
          >
            {text}
          </ChatMessage>
        )}
        <p style={note} role="status">
          {said}
        </p>
        <div style={line}>
          <span style={note}>A turn with its stamp, in a fixed zone so the server and the browser agree:</span>
          <MessageTimestamp date="2026-03-12T09:31:00Z" format="message" locale="en" timeZone="UTC" />
          <span style={note}>
            Alt: <MessageTimestamp date="2026-03-12T09:31:00Z" format="dateTime" locale="en" timeZone="UTC" />
          </span>
        </div>
        <p style={note}>
          Enter is a new line and Ctrl or ⌘ with Enter sends; Escape stops propagating, so an editor inside a sheet does not
          close it too. The draft that came back empty or unchanged cannot be sent, and the hint says why.
        </p>
      </div>
    </Frame>
  );
}

const line = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;

/* ---------------------------------------------------------------- the accounts and usage family */

// The clock every reading below is compared to, and the day nothing in these previews leaves.
const NOW = Date.parse("2026-03-12T09:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const GROK: ProviderOutput = {
  providerId: "grok",
  displayName: "Grok",
  plan: "Studio plan",
  lines: [
    { type: "progress", kind: "quota", label: "Weekly limit", used: 42, limit: 100, format: { kind: "percent" } },
    { type: "progress", kind: "cost", label: "Monthly spend", used: 18.5, limit: 120, format: { kind: "dollars" } },
    { type: "text", kind: "plan", label: "Plan", value: "Studio plan", subtitle: "renewed monthly" },
    { type: "badge", kind: "cache", label: "Cache", text: "warm" },
  ],
};

const QUIET: ProviderOutput = {
  providerId: "nous",
  displayName: "Nous",
  lines: [],
};

type Credits = { available: number; detailsComplete: boolean; credits: { validFromMs: number | null; expiresAtMs: number | null }[] };

const CREDITS: Observation<Credits> = {
  availability: "available",
  freshness: "fresh",
  observedAtMs: NOW - 2 * 60_000,
  source: "gateway",
  error: null,
  value: {
    available: 2,
    detailsComplete: true,
    credits: [
      { validFromMs: null, expiresAtMs: NOW + 3 * HOUR },
      { validFromMs: NOW - HOUR, expiresAtMs: NOW + 30 * HOUR },
    ],
  },
};

const CREDITS_STALE: Observation<Credits> = { ...CREDITS, freshness: "stale", observedAtMs: NOW - 3 * HOUR };

const BALANCE: Observation<CreditBalance> = {
  availability: "available",
  freshness: "fresh",
  observedAtMs: NOW - 5 * 60_000,
  source: "gateway",
  error: null,
  value: {
    remainingUsd: 12.34,
    subscriptionRemainingUsd: 7.5,
    subscriptionLimitUsd: 20,
    purchasedRemainingUsd: 4.84,
    paidAccess: true,
  },
};

const ACCOUNTS: SynchronizedAccount[] = [
  {
    linked_account_id: "linked-ada",
    device: "studio-ada-01",
    source: "grok-cli",
    observed_at_ms: NOW - 4 * 60_000,
    output: GROK,
    local_usage: {
      device: "studio-ada-01",
      source: "grok-cli",
      observed_at_ms: NOW - 4 * 60_000,
      partial: true,
      days: [
        { date: "2026-03-10", tokens: 184_320, estimated_usd: 1.42 },
        { date: "2026-03-11", tokens: 96_140, estimated_usd: 0.78 },
      ],
    },
  },
  {
    linked_account_id: null,
    device: "studio-ada-02",
    source: "codex-cli",
    observed_at_ms: NOW - 26 * HOUR,
    output: QUIET,
    local_usage: null,
  },
];

const REPORT = {
  revision: 12,
  sources: [
    { source: "studio-ada-01", client: "studio-ada-01", state: "ready" as const, last_success_ms: NOW - 4 * 60_000, revision: 12, records: 3, detail: null },
    { source: "studio-ada-02", client: "studio-ada-02", state: "partial" as const, last_success_ms: NOW - 26 * HOUR, revision: 4, records: 1, detail: "One day could not be read." },
    { source: "studio-ada-03", client: "studio-ada-03", state: "needs_connection" as const, last_success_ms: null, revision: 0, records: 0, detail: null },
  ],
  total: { key: "total", tokens: 322_560, unknown_token_records: 1, known_usd: 2.56, partial: true, records: 61 },
  daily: [
    { key: "2026-03-10", tokens: 184_320, unknown_token_records: 0, known_usd: 1.42, partial: false, records: 41 },
    { key: "2026-03-11", tokens: 138_240, unknown_token_records: 1, known_usd: 1.14, partial: true, records: 20 },
  ],
  period_totals: [
    { key: "studio-ada-01", tokens: 280_460, unknown_token_records: 0, known_usd: 2.2, partial: false, records: 47 },
    { key: "studio-ada-02", tokens: 42_100, unknown_token_records: 1, known_usd: 0.36, partial: true, records: 12 },
  ],
  clients: [
    { key: "studio-ada-01", tokens: 280_460, unknown_token_records: 0, known_usd: 2.2, partial: false, records: 47 },
    { key: "studio-ada-02", tokens: 42_100, unknown_token_records: 1, known_usd: 0.36, partial: true, records: 12 },
  ],
  models: [
    { key: "grok-4.7-fast", tokens: 240_000, unknown_token_records: 0, known_usd: 1.9, partial: false, records: 41 },
    { key: "gpt-6-sol", tokens: 82_560, unknown_token_records: 1, known_usd: 0.66, partial: true, records: 20 },
  ],
  sessions: [{ key: "session-ada", tokens: 12_480, unknown_token_records: 0, known_usd: 0.11, partial: false, records: 3 }],
  projects: [{ key: "ledger", tokens: 96_140, unknown_token_records: 0, known_usd: 0.78, partial: false, records: 18 }],
};

const GROUP_HEADINGS = {
  groupHeadings: { daily: "Day", period_totals: "Session total", clients: "Client", models: "Model", sessions: "Session", projects: "Project" },
};

const SNAPSHOTS: ConsumptionSnapshot[] = [
  {
    device: "studio-ada-01",
    source: "grok-cli",
    revision: 12,
    observed_at_ms: NOW - 4 * 60_000,
    partial: false,
    days: [
      { date: "2026-03-10", tokens: 184_320, estimated_usd: 1.42 },
      { date: "2026-03-11", tokens: 96_140, estimated_usd: 0.78 },
    ],
    period_totals: { tokens: 280_460, known_usd: 2.2, partial: false },
    models: [
      { model: "grok-4.7-fast", requests: 41, tokens: 240_000, estimated_usd: 1.9 },
      { model: "grok-4.7", requests: 6, tokens: 40_460, estimated_usd: 0.3 },
    ],
  },
  {
    device: "studio-ada-02",
    source: "codex-cli",
    revision: 4,
    observed_at_ms: NOW - 26 * HOUR,
    partial: true,
    days: [{ date: "2026-03-11", tokens: 42_100, estimated_usd: 0.36 }],
    period_totals: null,
    models: [{ model: "gpt-6-sol", requests: 12, tokens: 42_100, estimated_usd: 0.36 }],
  },
];

const PRIVATE_PAGE: PrivateRecentPage = {
  before: 3,
  has_more: true,
  observations: [
    {
      cursor: 3,
      device: "studio-ada-01",
      observation: { source: "grok-cli", event: { kind: "quota", at_ms: NOW - 4 * 60_000, output: GROK } },
    },
    {
      cursor: 2,
      device: "studio-ada-02",
      observation: {
        source: "codex-cli",
        event: {
          kind: "history",
          sample: { ts_ms: NOW - 40 * 60_000, provider: "grok", plan: "Studio plan", label: "Weekly limit", used: 42, limit: 100, resets_at: new Date(NOW + 2 * DAY).toISOString(), kind: "quota" },
        },
      },
    },
    {
      cursor: 1,
      device: "studio-ada-01",
      observation: {
        source: "grok-cli",
        event: {
          kind: "request",
          record: {
            ts_ms: NOW - 2 * HOUR,
            session_id: "session-ada",
            model: "grok-4.7-fast",
            input_tokens: 12_480,
            output_tokens: 940,
            cached_input_tokens: 8_000,
            reasoning_tokens: 120,
            total_tokens: 13_420,
            cost_usd_ticks: 0,
            route: "grok",
            kind: "chat",
          },
        },
      },
    },
  ],
};

const REVIEW = {
  sourceEnvironment: "spanreed@studio-ada-01",
  destinationEnvironment: "https://relay.example.com",
  items: [
    { sourceId: "account-ada-01", sourceGeneration: "grok-cli@0.7.2", provider: "grok", targetAlias: "ada-work", action: "copyApiKey" as const },
    { sourceId: "account-ada-02", sourceGeneration: "codex-cli@0.6.0", provider: "codex", targetAlias: "ada-codex", action: "authorizeOAuth" as const },
  ],
};

const MIGRATION_API: HostedMigrationApi = {
  sessions: async () => ({
    sessions: [
      {
        id: "migration-ada-review",
        ownerId: "owner-ada",
        direction: "hostedToLocal",
        hostedEnvironment: "https://relay.example.com",
        localEnvironment: "spanreed@studio-ada-01",
        phase: "reviewing",
        review: REVIEW,
        revision: "rev-7",
        expiresAtMs: NOW + 6 * HOUR,
      },
    ],
  }),
  create: async () => ({ id: "invitation-ada-01", secret: "secret-example-0000", expiresAtMs: NOW + HOUR }),
  status: async () => ({
    id: "migration-ada-review",
    ownerId: "owner-ada",
    direction: "hostedToLocal",
    hostedEnvironment: "https://relay.example.com",
    localEnvironment: "spanreed@studio-ada-01",
    phase: "reviewing",
    review: REVIEW,
    revision: "rev-7",
    expiresAtMs: NOW + 6 * HOUR,
  }),
  approve: async () => ({}),
  authorizations: async () => [],
  forget: async () => ({}),
  cancel: async () => ({}),
};

/** The accounts pieces write a time in the reader's zone, which a server cannot know: a plate of the same size until the page is theirs. */
function InTheBrowser({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  if (hydrated) return <>{children}</>;
  return <div aria-hidden="true" style={{ ...plate, blockSize: "9rem" }} />;
}

function ProviderCardDemo() {
  return (
    <Frame width="wide">
      <InTheBrowser>
        <ProviderCard locale="en" provider={GROK} />
      </InTheBrowser>
      <div style={{ display: "grid", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))", alignItems: "start" }}>
        <InTheBrowser>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <ResetInventory locale="en" now={NOW} observation={CREDITS} />
            <ResetInventory locale="en" now={NOW} observation={CREDITS_STALE} />
          </div>
        </InTheBrowser>
        <InTheBrowser>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <BalanceCard locale="en" observation={BALANCE} />
            <ObservationStatus locale="en" observation={CREDITS} />
          </div>
        </InTheBrowser>
      </div>
      <p style={note}>
        A provider with its quota and its plan, the credits that reset a limit (fresh, then stale), a balance, and how old the
        reading is. Every piece takes its words from <code>labels</code> and its numbers from <code>locale</code>.
      </p>
    </Frame>
  );
}

function RoutingPolicyDemo() {
  const [saved, setSaved] = useState("Nothing saved yet.");
  return (
    <Frame width="form">
      <RoutingPolicyForm
        enabled={false}
        onSave={async (on, threshold) => {
          setSaved(`Saved: autosteer ${on ? "on" : "off"}, skipping accounts at ${threshold}% of their quota.`);
        }}
        pending={false}
        provider="Grok"
        threshold={80}
      />
      <RoutingExplanation />
      <p style={note} role="status">
        {saved}
      </p>
    </Frame>
  );
}

function SynchronizedAccountsDemo() {
  return (
    <Frame width="wide">
      <InTheBrowser>
        <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
          <SynchronizedAccounts accounts={ACCOUNTS} includeLinked locale="en" now={NOW} />
          <LinkedAccountUsage accounts={ACCOUNTS} locale="en" />
          <p style={note}>
            Two machines, one of them last heard from a day ago. A linked installation is marked as a verified identity; the
            local log of a machine is kept apart from the relay&apos;s own traffic.
          </p>
        </div>
      </InTheBrowser>
    </Frame>
  );
}

function ConsumptionViewDemo() {
  const [synchronized, setSynchronized] = useState(false);
  return (
    <Frame width="wide">
      <ConsumptionView labels={GROUP_HEADINGS} locale="en" report={REPORT} />
      <div style={rows}>
        <Button onClick={() => setSynchronized((value) => !value)} size="sm" variant="outline">
          {synchronized ? "Hide the synchronized view" : "Load the synchronized view"}
        </Button>
        <span style={note}>
          The same report, read by one installation instead: its device picker, and only the groupings a single source can
          answer.
        </span>
      </div>
      {synchronized ? (
        <SynchronizedConsumption load={async () => ({ snapshots: SNAPSHOTS })} locale="en" viewLabels={GROUP_HEADINGS} />
      ) : null}
    </Frame>
  );
}

function PrivateHistoryDemo() {
  return (
    <Frame width="wide">
      <InTheBrowser>
        <PrivateHistoryView
          description="Readings your installations shared with this relay, newest first."
          fetchPage={async () => PRIVATE_PAGE}
          heading={false}
          locale="en"
        />
      </InTheBrowser>
    </Frame>
  );
}

function ApiKeyFormDemo() {
  const [said, setSaid] = useState("Nothing saved yet.");
  return (
    <Frame width="form">
      <ApiKeyForm
        accounts={[{ provider: "openai", alias: "ada-work" }]}
        onSave={async (input) => {
          if (!input.key.startsWith("key_example_")) throw new Error("The demo only accepts a key that starts with key_example_.");
          setSaid(`Saved ${input.provider}/${input.alias}. A real form would verify it with the provider.`);
        }}
      />
      <ApiKeyFields
        alias="ada-work"
        lockedIdentity
        onAliasChange={() => undefined}
        onProviderChange={() => undefined}
        onSecretChange={() => undefined}
        provider="openai"
        secret="key_example_0000"
      />
      <p style={note} role="status">
        {said}
      </p>
      <p style={note}>
        The key is a made-up string: <code>key_example_0000</code>. Anything else is refused, so the failure a host shows has
        its own place here.
      </p>
    </Frame>
  );
}

function HostedMigrationDemo() {
  return (
    <Frame width="wide">
      <HostedMigration api={MIGRATION_API} authorize={() => null} heading={false} now={NOW} origin="https://relay.example.com" />
      <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
        <p style={mono}>the review of a transfer, on its own</p>
        <MigrationReviewDetails review={REVIEW} />
      </div>
      <p style={note}>
        Pairing, the review, the approval and the receipt, with a made-up API: creating an invitation, approving a review and
        forgetting a receipt all answer locally, and nothing leaves the page.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- motion, and the clock behind it */

function MotionDemo() {
  const reduced = useReducedMotion();
  return (
    <Frame width="form">
      <div style={plate}>
        <p style={mono}>prefers-reduced-motion</p>
        <p style={{ margin: 0 }}>
          The reader asked for {reduced ? "less motion" : "the usual motion"}. Everything in the library holds still under the
          first answer, and every state still shows at once.
        </p>
        <p style={note}>
          Read it where a piece has to decide in JavaScript (a canvas, a scroll, a drawing): <code>prefersReducedMotion()</code>{" "}
          once, or <code>useReducedMotion()</code> in a component, which is what these two answer.
        </p>
      </div>
      <div style={plate}>
        <p style={mono}>subscribeTick</p>
        <p style={{ margin: 0 }}>
          One interval for every piece that counts: 50 ms at the least, one timer per period however many listeners asked for
          it, and the timers stop while the page is hidden.
        </p>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the map */

export const demos012c: Record<string, () => ReactNode> = {
  conversation: () => <ConversationDemo />,
  "artifact-frame": () => <ArtifactFrameDemo />,
  "tool-call": () => <ToolCallDemo />,
  "suggestion-chips": () => <SuggestionChipsDemo />,
  "use-attachments": () => <UseAttachmentsDemo />,
  "composer-select": () => <ComposerSelectDemo />,
  "read-aloud": () => <ReadAloudDemo />,
  "markdown-callout": () => <MarkdownCalloutDemo />,
  "markdown-helpers": () => <MarkdownHelpersDemo />,
  "editable-message": () => <EditableMessageDemo />,
  "provider-card": () => <ProviderCardDemo />,
  "routing-policy": () => <RoutingPolicyDemo />,
  "synchronized-accounts": () => <SynchronizedAccountsDemo />,
  "consumption-view": () => <ConsumptionViewDemo />,
  "private-history": () => <PrivateHistoryDemo />,
  "api-key-form": () => <ApiKeyFormDemo />,
  "hosted-migration": () => <HostedMigrationDemo />,
  "motion-and-time": () => <MotionDemo />,
};
