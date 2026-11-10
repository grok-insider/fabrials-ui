"use client";

// Ways of using what 0.12 added to the chat pieces: the log, the frame of a drawing, the files of a composer, the callouts,
// the two pills and the message edited in place. Synthetic data, fixed dates, and nothing runs until a person presses.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Paperclip, Terminal } from "lucide-react";
import {
  ArtifactFrame,
  Attachments,
  ChatComposer,
  ChatMessage,
  ComposerMenu,
  ComposerSelect,
  Conversation,
  ConversationCheckpoint,
  ConversationCheckpoints,
  ConversationContent,
  ConversationEmpty,
  ConversationFooter,
  ConversationScrollButton,
  EditableMessage,
  EditMessageAction,
  MarkdownCallout,
  MessageActions,
  useAttachments,
  type ArtifactSlot,
} from "@fabrials/ai-ui";
import {
  Button,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const note = { margin: 0, color: "var(--muted-foreground)" } as const;
const rows = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;

const PROSE =
  "An answer is as wide as its text, up to the measure, and the whole column the moment it holds a table. A reader asked for prose, not for a wall.";

function Markdown({ children }: { children: ReactNode }) {
  return <div className="fui-markdown">{children}</div>;
}

const TABLE = (
  <table>
    <thead>
      <tr>
        <th scope="col">Layer</th>
        <th scope="col">What lives in it</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>base</td>
        <td>the tokens</td>
      </tr>
      <tr>
        <td>components</td>
        <td>the pieces that read them</td>
      </tr>
    </tbody>
  </table>
);

/* ---------------------------------------------------------------- conversation */

function Board({ children, height = 300 }: { children: ReactNode; height?: number }) {
  return (
    <div style={{ blockSize: `${height}px`, display: "flex", inlineSize: "100%" }}>
      <Conversation>{children}</Conversation>
    </div>
  );
}

function MeasureExample() {
  return (
    <Board>
      <ConversationContent measure>
        <ChatMessage from="user">Where should a product import the shared styles?</ChatMessage>
        <ChatMessage from="assistant">
          <Markdown>
            <p>{PROSE}</p>
          </Markdown>
        </ChatMessage>
        <ChatMessage from="assistant">
          <Markdown>
            <p>And a table takes the whole of it:</p>
            {TABLE}
          </Markdown>
        </ChatMessage>
      </ConversationContent>
      <ConversationFooter>
        <ChatComposer onSubmit={() => undefined} placeholder="Message" />
      </ConversationFooter>
    </Board>
  );
}

function EmptyExample() {
  return (
    <Board height={260}>
      <ConversationEmpty description="Ask about the billing schema, or paste an invoice." />
      <ConversationFooter>
        <ChatComposer onSubmit={() => undefined} placeholder="Ask anything" />
      </ConversationFooter>
    </Board>
  );
}

function StartExample() {
  return (
    <Board>
      <ConversationContent label="Transcript" live="polite">
        <ChatMessage from="user">Let us start from the beginning.</ChatMessage>
        <ChatMessage from="assistant">
          <Markdown>
            <p>{PROSE}</p>
          </Markdown>
        </ChatMessage>
      </ConversationContent>
      <ConversationScrollButton />
    </Board>
  );
}

function RailExample() {
  const [turns, setTurns] = useState(1);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%" }}>
      <Board>
        <ConversationContent>
          <ConversationCheckpoint label="The first question">
            <ChatMessage from="user">Which layers does the cascade use?</ChatMessage>
          </ConversationCheckpoint>
          <ChatMessage from="assistant">
            <Markdown>
              <p>{PROSE}</p>
            </Markdown>
          </ChatMessage>
          {Array.from({ length: turns }, (_, index) => (
            <ConversationCheckpoint key={index} label={`Question ${index + 2}`}>
              <ChatMessage from="user">Question {index + 2}</ChatMessage>
            </ConversationCheckpoint>
          ))}
          <ChatMessage from="assistant">
            <Markdown>
              <p>A rail with fewer than two checkpoints is not drawn, so this one arrives as the turns are added.</p>
            </Markdown>
          </ChatMessage>
        </ConversationContent>
        <ConversationCheckpoints selector={null} />
        <ConversationFooter>
          <ChatComposer onSubmit={() => undefined} placeholder="Message" />
        </ConversationFooter>
      </Board>
      <div style={rows}>
        <Button onClick={() => setTurns((count) => count + 1)} size="sm" variant="outline">
          Add a question
        </Button>
        <span style={note}>With selector still at its default, a ChatMessage from=&quot;user&quot; registers itself.</span>
      </div>
    </div>
  );
}

export const conversationExamples: ExampleSet = {
  examples: [
    {
      id: "measure",
      title: "The reading measure on",
      description:
        "Prose keeps to the measure (52rem) and a table takes the whole column. The composer docks at the end, and its height is published for the keys above it.",
      code: `import { ChatComposer, Conversation, ConversationContent, ConversationFooter } from "@fabrials/ai-ui";

export function Thread({ messages }: { messages: Message[] }) {
  return (
    <div style={{ blockSize: "32rem", display: "flex" }}>
      <Conversation>
        <ConversationContent measure>
          {messages.map((message) => (
            <ChatMessage from={message.role} key={message.id}>
              {message.body}
            </ChatMessage>
          ))}
        </ConversationContent>
        <ConversationFooter>
          <ChatComposer onSubmit={send} />
        </ConversationFooter>
      </Conversation>
    </div>
  );
}`,
      render: () => <MeasureExample />,
      align: "start",
    },
    {
      id: "empty",
      title: "An empty conversation",
      description:
        "What a thread shows before its first message: a line, a description and the composer, with nothing announced and no log to scroll.",
      code: `import { ChatComposer, Conversation, ConversationEmpty, ConversationFooter } from "@fabrials/ai-ui";

export function First() {
  return (
    <div style={{ blockSize: "20rem", display: "flex" }}>
      <Conversation>
        <ConversationEmpty description="Ask about the billing schema, or paste an invoice." />
        <ConversationFooter>
          <ChatComposer onSubmit={send} placeholder="Ask anything" />
        </ConversationFooter>
      </Conversation>
    </div>
  );
}`,
      render: () => <EmptyExample />,
      align: "start",
    },
    {
      id: "from-the-start",
      title: "A transcript read from the start",
      description:
        "anchor=\"start\" makes it an ordinary scroller for a log read from its first line, as a transcript or an export is. The way back still works, because it is the reader's, not the answer's.",
      code: `import { Conversation, ConversationContent, ConversationScrollButton } from "@fabrials/ai-ui";

export function Transcript({ turns }: { turns: Turn[] }) {
  return (
    <div style={{ blockSize: "28rem", display: "flex" }}>
      <Conversation anchor="start">
        <ConversationContent label="Transcript" live="polite">
          {turns.map((turn) => (
            <ChatMessage from={turn.role} key={turn.id}>
              {turn.body}
            </ChatMessage>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}`,
      render: () => <StartExample />,
      align: "start",
    },
    {
      id: "rail",
      title: "The rail of registered checkpoints",
      description:
        "With selector={null} only what registered itself is on the rail: ConversationCheckpoint wraps a turn, or useConversationCheckpoint gives a ref for your own element.",
      code: `import { ConversationCheckpoint, ConversationCheckpoints } from "@fabrials/ai-ui";

export function Rail({ turns }: { turns: Turn[] }) {
  return (
    <>
      <ConversationContent>
        {turns.map((turn) => (
          <ConversationCheckpoint key={turn.id} label={turn.preview}>
            <ChatMessage from={turn.role}>{turn.body}</ChatMessage>
          </ConversationCheckpoint>
        ))}
      </ConversationContent>
      <ConversationCheckpoints selector={null} />
    </>
  );
}`,
      render: () => <RailExample />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- artifact frame */

const DRAWING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="400" height="220" role="img" aria-label="Two bars">
  <g style="fill: var(--brand)">
    <rect x="60" y="120" width="60" height="80" rx="3"/>
    <rect x="180" y="60" width="60" height="140" rx="3"/>
  </g>
  <g fill="currentColor" fill-opacity="0.6" font-size="11">
    <text x="60" y="216">March</text>
    <text x="180" y="216">April</text>
  </g>
</svg>`;

function Drawing({ slot, source }: { slot: ArtifactSlot; source: string }) {
  const { onExport, onReady } = slot;
  useEffect(() => {
    onExport({ svg: () => source });
    onReady();
  }, [onExport, onReady, source]);
  return <div dangerouslySetInnerHTML={{ __html: source }} />;
}

export const artifactFrameExamples: ExampleSet = {
  examples: [
    {
      id: "loading",
      title: "Loading, with its height kept",
      description:
        "pending reserves the body and says what it is loading; the drawing that arrives does not move the answer around it.",
      code: `<ArtifactFrame kind="Chart" minHeight={220} pending source={source} title="Sign-ups">
  {() => null}
</ArtifactFrame>`,
      render: () => (
        <ArtifactFrame kind="Chart" minHeight={200} pending source={DRAWING} title="Sign-ups">
          {() => null}
        </ArtifactFrame>
      ),
      align: "start",
    },
    {
      id: "error",
      title: "An error that keeps the source",
      description:
        "A failure says the reason and still offers the source, so a reader can see what was drawn from and try again.",
      code: `<ArtifactFrame
  error="Unexpected token '<' at line 3."
  kind="Chart"
  onRetry={retry}
  source={source}
  sourceLanguage="xml"
  title="Sign-ups"
>
  {() => null}
</ArtifactFrame>`,
      render: () => (
        <ArtifactFrame
          error="Unexpected token '<' at line 3."
          kind="Chart"
          onRetry={() => undefined}
          source={DRAWING}
          sourceLanguage="xml"
          title="Sign-ups"
        >
          {() => null}
        </ArtifactFrame>
      ),
      align: "start",
    },
    {
      id: "streaming",
      title: "Still arriving",
      description:
        "While the source streams in, a failure is held back and the label says the drawing is being made, so half a file is never reported as an error.",
      code: `<ArtifactFrame kind="Chart" pending source={partial} streaming title="Sign-ups">
  {() => null}
</ArtifactFrame>`,
      render: () => (
        <ArtifactFrame kind="Chart" minHeight={200} pending source={'<svg xmlns="http://www.w3.org/2000/svg">'} streaming title="Sign-ups">
          {() => null}
        </ArtifactFrame>
      ),
      align: "start",
    },
    {
      id: "host-action",
      title: "A key of the host's own",
      description:
        "actions adds the host's keys at the end of the toolbar, after the source, the copy and the downloads the drawing offered.",
      code: `<ArtifactFrame
  actions={<Button size="sm" variant="outline">Open in the editor</Button>}
  kind="Chart"
  source={source}
  sourceLanguage="xml"
  title="Sign-ups"
>
  {(slot) => <Drawing slot={slot} source={source} />}
</ArtifactFrame>`,
      render: () => (
        <ArtifactFrame
          actions={
            <Button size="sm" variant="outline">
              Open in the editor
            </Button>
          }
          kind="Chart"
          source={DRAWING}
          sourceLanguage="xml"
          title="Sign-ups"
        >
          {(slot) => <Drawing slot={slot} source={DRAWING} />}
        </ArtifactFrame>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- the files of a composer */

type Waiting = { resolve: () => void; reject: (error: Error) => void };

function Uploads({ mode }: { mode: "upload" | "send" | "refuse" | "retry" }) {
  const waiting = useRef<Waiting[]>([]);
  const [said, setSaid] = useState("Nothing added yet.");
  const [refused, setRefused] = useState("");
  const files = useAttachments<{ id: string }>({
    accept: "image/*",
    maxSize: 1_000_000,
    onReject: (rejection) => setRefused(`${rejection.file.name}: that kind of file is not accepted.`),
    upload: (file) => new Promise((resolve, reject) => waiting.current.push({ resolve: () => resolve({ id: file.name }), reject })),
  });
  const add = (bad = false) => {
    files.add([new File(["harbour"], bad ? "notes.pdf" : "harbour.png", { type: bad ? "application/pdf" : "image/png" })]);
    setSaid(bad ? "Nothing was added." : "A file is queued. Nothing has left this page.");
  };
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%" }}>
      <ChatComposer
        attachments={files.items.length > 0 ? <Attachments items={files.items} onRemove={files.remove} size="sm" variant="grid" /> : undefined}
        onSubmit={() => setSaid("Sent.")}
        placeholder="Ask about this file"
        tools={
          <Button onClick={() => add(mode === "refuse")} size="sm" variant="outline">
            <Paperclip aria-hidden="true" size={14} /> Attach
          </Button>
        }
      />
      <div style={rows}>
        <Button
          onClick={() => {
            if (mode === "send") void files.waitForUploads().then((sent) => setSaid(`Sent ${sent.items.length} file.`));
            for (const upload of waiting.current.splice(0)) {
              if (mode === "retry") upload.reject(new Error("The connection closed."));
              else upload.resolve();
            }
            if (mode === "retry") setSaid("It failed; the key beside it tries again.");
            else if (mode !== "send") setSaid("Uploaded.");
          }}
          size="sm"
          variant="outline"
        >
          {mode === "send" ? "Send now" : mode === "retry" ? "Let it fail" : "Upload it"}
        </Button>
        <span style={note}>{said}</span>
      </div>
      {refused ? <p style={note}>{refused}</p> : null}
    </div>
  );
}

export const useAttachmentsExamples: ExampleSet = {
  examples: [
    {
      id: "adding",
      title: "A file goes up as it is added",
      description:
        "The picker, the drop and the paste all add a file the same way, and the upload starts at once; three go at a time.",
      code: `const files = useAttachments({
  upload: (file, { signal, onProgress }) => api.upload(file, { signal, onProgress }),
  accept: "image/*",
  maxSize: 1_000_000,
});

<ChatComposer
  attachments={<Attachments items={files.items} onRemove={files.remove} size="sm" />}
  onSubmit={send}
  tools={<ComposerButton icon={<Paperclip />} label="Attach" onClick={files.openPicker} />}
/>`,
      render: () => <Uploads mode="upload" />,
      align: "start",
    },
    {
      id: "send",
      title: "Sending waits for the files",
      description:
        "waitForUploads takes the files there are at that moment, and the message goes with them or with none of them: never half.",
      code: `const send = async (text: string) => {
  const { ids, items } = await files.waitForUploads();
  await api.send(text, items);
  for (const id of ids) files.remove(id);
};`,
      render: () => <Uploads mode="send" />,
      align: "start",
    },
    {
      id: "refused-failed",
      title: "A refused file, and one that failed",
      description:
        "onReject says why a file was not added (type, size or count) and onError is the host's chance to toast a failure; the item says it too, with the key that tries again.",
      code: `<ChatComposer
  attachments={
    <Attachments items={files.items} onRemove={files.remove} />
  }
  onPasteFiles={(pasted) => {
    const { rejected } = files.add(pasted);
    for (const rejection of rejected) toast(reasonOf(rejection));
  }}
/>`,
      render: () => <Uploads mode="retry" />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- the callouts */

const KINDS = [
  { kind: "note", body: "The column keeps its measure while a table takes the width." },
  { kind: "tip", body: "Start from the units, then the numbers." },
  { kind: "important", body: "A message with no text cannot be sent." },
  { kind: "warning", body: "Check the deployment first: the migration moves data." },
  { kind: "caution", body: "This stops the running work and cannot be undone." },
  { kind: "example", body: "Three lines take the measure, not the page." },
  { kind: "definition", body: "The measure is the width prose is read at." },
  { kind: "summary", body: "Three layers, one order, nothing overrides by accident." },
  { kind: "question", body: "Which of these applies to a transcript?" },
] as const;

const HOST_MARKUP = `<aside class="fui-callout" data-kind="warning" role="note" aria-label="Warning">
  <p class="fui-callout-title" dir="auto">Warning</p>
  <div class="fui-callout-body">
    <p>Check the deployment first: the migration moves data.</p>
  </div>
</aside>`;

export const markdownCalloutExamples: ExampleSet = {
  examples: [
    {
      id: "every-kind",
      title: "Every kind, and its tone",
      description:
        "Nine kinds, each a tint of one house tone: note, example and question stay neutral, so colour keeps meaning something.",
      code: `import { MarkdownCallout } from "@fabrials/ai-ui";

export function Notes() {
  return (
    <>
      <MarkdownCallout kind="tip">
        <p>Start from the units, then the numbers.</p>
      </MarkdownCallout>
      <MarkdownCallout kind="warning">
        <p>Check the deployment first: the migration moves data.</p>
      </MarkdownCallout>
    </>
  );
}`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%" }}>
          {KINDS.map((callout) => (
            <MarkdownCallout key={callout.kind} kind={callout.kind}>
              <p style={note}>{callout.body}</p>
            </MarkdownCallout>
          ))}
        </div>
      ),
      align: "start",
    },
    {
      id: "title",
      title: "A title, and what goes inside",
      description:
        "A title of your own names the callout for a screen reader too. The body keeps the answer's own typography, so a list or a code block inside looks like the rest of the answer.",
      code: `<MarkdownCallout kind="warning" title="Check the deployment first">
  <p>Three steps, in this order:</p>
  <ol>
    <li>Drain the queue.</li>
    <li>Run the migration.</li>
  </ol>
</MarkdownCallout>`,
      render: () => (
        <MarkdownCallout kind="warning" title="Check the deployment first">
          <p>Three steps, in this order:</p>
          <ol>
            <li>Drain the queue.</li>
            <li>Run the migration.</li>
          </ol>
        </MarkdownCallout>
      ),
      align: "start",
    },
    {
      id: "host-markup",
      title: "Written by a host's own renderer",
      description:
        "No React needed: the classes and data-kind are the whole contract, and aria-label is how that markup names itself when the title is not an id on the page.",
      code: `<aside class="fui-callout" data-kind="warning" role="note" aria-label="Warning">
  <p class="fui-callout-title" dir="auto">Warning</p>
  <div class="fui-callout-body">
    <p>Check the deployment first: the migration moves data.</p>
  </div>
</aside>`,
      render: () => <div dangerouslySetInnerHTML={{ __html: HOST_MARKUP }} />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- the pills */

const EFFORTS = [
  { value: "low", label: "Low", hint: "Fastest replies" },
  { value: "medium", label: "Medium", hint: "Balanced" },
  { value: "high", label: "High", hint: "Deeper reasoning, slower" },
];

function PickPill() {
  const [effort, setEffort] = useState("low");
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
      <ComposerSelect label="Reasoning effort" onValueChange={setEffort} options={EFFORTS} value={effort} />
      <p style={note} role="status">
        Effort {effort}. Its name is &ldquo;Reasoning effort: {effort}&rdquo;, and away from the usual value the pill is tinted.
      </p>
    </div>
  );
}

function MenuPill() {
  const [web, setWeb] = useState(true);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
      <ComposerMenu icon={<Terminal aria-hidden="true" size={16} />} label="More controls" menuLabel="Chat controls">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={web} onCheckedChange={setWeb}>
            Search the web
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
      </ComposerMenu>
      <p style={note} role="status">
        Web search {web ? "on" : "off"}. A setting stays in the menu; an action closes it.
      </p>
    </div>
  );
}

export const composerSelectExamples: ExampleSet = {
  examples: [
    {
      id: "value",
      title: "A pill that picks a value",
      description:
        "The pill says what is chosen; the list shows two lines a row, with the mark and a tick on the one in use. The arrows, Home, End and typeahead come from Select.",
      code: `const [effort, setEffort] = useState("low");

<ComposerSelect
  label="Reasoning effort"
  onValueChange={setEffort}
  options={[
    { value: "low", label: "Low", hint: "Fastest replies" },
    { value: "high", label: "High", hint: "Deeper reasoning, slower" },
  ]}
  value={effort}
/>`,
      render: () => <PickPill />,
      align: "center",
    },
    {
      id: "menu",
      title: "A pill that opens a menu",
      description:
        "For settings that stay and actions that happen once: a checkbox item keeps the menu open, an item closes it and runs.",
      code: `<ComposerMenu label="More controls" menuLabel="Chat controls" icon={<Terminal />}>
  <DropdownMenuGroup>
    <DropdownMenuLabel>Workspace</DropdownMenuLabel>
    <DropdownMenuCheckboxItem checked={web} onCheckedChange={setWeb}>
      Search the web
    </DropdownMenuCheckboxItem>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
</ComposerMenu>`,
      render: () => <MenuPill />,
      align: "center",
    },
  ],
};

/* ---------------------------------------------------------------- a message edited in place */

const SENT = "Ship the reading measure with the release.";

function Editor({ fail = false }: { fail?: boolean }) {
  const [text, setText] = useState(SENT);
  const [editing, setEditing] = useState(true);
  const [said, setSaid] = useState("");
  const pencil = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%" }}>
      {editing ? (
        <EditableMessage
          hint="Sending it again replaces the answers after it."
          onCancel={() => setEditing(false)}
          onSubmit={async (next) => {
            if (fail) throw new Error("The message could not be sent. Check the connection and try again.");
            setText(next);
            setEditing(false);
            setSaid(`Sent again as “${next}”.`);
          }}
          returnFocusRef={pencil}
          value={text}
        />
      ) : (
        <ChatMessage actions={<MessageActions><EditMessageAction onClick={() => setEditing(true)} ref={pencil} /></MessageActions>} from="user" pinActions>
          {text}
        </ChatMessage>
      )}
      {said ? (
        <p style={note} role="status">
          {said}
        </p>
      ) : null}
    </div>
  );
}

export const editableMessageExamples: ExampleSet = {
  examples: [
    {
      id: "in-place",
      title: "Edited where it stands",
      description:
        "The editor is the bubble: the same fill, the same corners and the same cap, so opening it does not reflow the thread. Ctrl or Command with Enter sends.",
      code: `{editing ? (
  <EditableMessage
    hint="Sending it again replaces the answers after it."
    onCancel={() => setEditing(false)}
    onSubmit={async (next) => {
      await api.edit(message.id, next);
      setEditing(false);
    }}
    returnFocusRef={pencil}
    value={message.text}
  />
) : (
  <ChatMessage from="user" actions={<MessageActions><EditMessageAction onClick={() => setEditing(true)} /></MessageActions>}>
    {message.text}
  </ChatMessage>
)}`,
      render: () => <Editor />,
      align: "start",
    },
    {
      id: "refused",
      title: "A send that fails",
      description:
        "A rejection keeps the draft, says the reason it gave in a role=alert and leaves the editor open, so nothing typed is lost.",
      code: `onSubmit={async (next) => {
  const answer = await api.edit(message.id, next);
  if (!answer.ok) throw new Error(answer.reason);
}}`,
      render: () => <Editor fail />,
      align: "start",
    },
  ],
};
