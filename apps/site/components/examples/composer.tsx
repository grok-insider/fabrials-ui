"use client";

import { useState } from "react";
import { Globe, Paperclip } from "lucide-react";
import { Attachments, ChatComposer, ComposerButton, ComposerToggle, type AttachmentItem, type ChatComposerStatus } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { PHOTO } from "./fixtures";
import { ReplayButton, useScript, type Frame } from "./replay";

const photo = (progress: number, status: AttachmentItem["status"] = "uploading"): AttachmentItem => ({
  id: "photo",
  name: "harbour.png",
  mediaType: "image/png",
  size: 248_000,
  url: PHOTO,
  status,
  progress,
});
const sheet = (progress: number, status: AttachmentItem["status"] = "uploading"): AttachmentItem => ({
  id: "sheet",
  name: "invoices-q3.xlsx",
  mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size: 1_240_000,
  status,
  progress,
});
const notes = (progress: number, status: AttachmentItem["status"] = "uploading"): AttachmentItem => ({
  id: "notes",
  name: "migration-notes.pdf",
  mediaType: "application/pdf",
  size: 96_000,
  status,
  progress,
});

type Turn = { files: AttachmentItem[]; status: ChatComposerStatus; value: string };

const FRAMES: Frame<Turn>[] = [
  { at: 0, state: { files: [], status: "ready", value: "Compare these with last quarter" } },
  { at: 400, state: { files: [photo(0.08)], status: "ready", value: "Compare these with last quarter" } },
  { at: 800, state: { files: [photo(0.42), sheet(0.06)], status: "ready", value: "Compare these with last quarter" } },
  { at: 1200, state: { files: [photo(0.81), sheet(0.33), notes(0.1)], status: "ready", value: "Compare these with last quarter" } },
  { at: 1650, state: { files: [photo(1, "ready"), sheet(0.68), notes(0.52)], status: "ready", value: "Compare these with last quarter" } },
  { at: 2150, state: { files: [photo(1, "ready"), sheet(1, "ready"), notes(0.9)], status: "ready", value: "Compare these with last quarter" } },
  { at: 2500, state: { files: [photo(1, "ready"), sheet(1, "ready"), notes(1, "ready")], status: "ready", value: "Compare these with last quarter" } },
  { at: 3400, state: { files: [], status: "streaming", value: "" } },
  { at: 7600, state: { files: [], status: "ready", value: "" } },
];

function LiveComposer() {
  const { state, replay, done } = useScript(FRAMES);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 36rem)" }}>
      <ChatComposer
        attachments={state.files.length ? <Attachments items={state.files} onRemove={() => {}} size="sm" variant="grid" /> : null}
        onStop={() => {}}
        onSubmit={() => {}}
        placeholder="Ask about your invoices"
        status={state.status}
        tools={<ComposerButton icon={<Paperclip />} label="Attach files" />}
        value={state.value}
      />
      {done ? (
        <div>
          <ReplayButton onClick={replay} />
        </div>
      ) : null}
    </div>
  );
}

function ToolsComposer() {
  const [web, setWeb] = useState(true);
  const [value, setValue] = useState("");
  return (
    <ChatComposer
      footer="Answers can be wrong. Check the numbers before you send them on."
      onSubmit={() => setValue("")}
      onValueChange={setValue}
      tools={
        <>
          <ComposerButton icon={<Paperclip />} label="Attach files" tooltip="Attach files" />
          <ComposerToggle icon={<Globe />} label="Search the web" onPressedChange={setWeb} pressed={web}>
            Web
          </ComposerToggle>
        </>
      }
      value={value}
    />
  );
}

export const composerExamples: ExampleSet = {
  preview: () => <LiveComposer />,
  previewCode: `import { useState } from "react";
import { Paperclip } from "lucide-react";
import {
  Attachments,
  ChatComposer,
  ComposerButton,
  type AttachmentItem,
  type ChatComposerStatus,
} from "@fabrials/ai-ui";

// \`files\` report their upload progress (0 to 1);
// \`status\` follows the agent's answer.
export function AskAboutInvoices({
  files,
  status,
  onAttach,
  onRemove,
  onSend,
  onStop,
}: {
  files: AttachmentItem[];
  status: ChatComposerStatus;
  onAttach: () => void;
  onRemove: (id: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <ChatComposer
      attachments={
        files.length ? (
          <Attachments
            items={files}
            onRemove={onRemove}
            size="sm"
            variant="grid"
          />
        ) : null
      }
      onStop={onStop}
      onSubmit={(message) => {
        onSend(message);
        setValue("");
      }}
      onValueChange={setValue}
      placeholder="Ask about your invoices"
      status={status}
      tools={
        <ComposerButton
          icon={<Paperclip />}
          label="Attach files"
          onClick={onAttach}
        />
      }
      value={value}
    />
  );
}`,
  examples: [
    {
      id: "working",
      title: "The working light",
      description:
        "While `status` is `submitting` or `streaming`, the working light turns along the composer's edge and the send key becomes Stop when you pass `onStop`. `working={false}` keeps the edge still; `queueWhileBusy` keeps Send for a follow-up.",
      code: `<ChatComposer
  status={isStreaming ? "streaming" : "ready"}
  onStop={stop}
  onSubmit={send}
/>`,
      render: () => (
        <div style={{ width: "min(100%, 34rem)" }}>
          <ChatComposer onStop={() => {}} onSubmit={() => {}} placeholder="Ask a follow-up" status="streaming" />
        </div>
      ),
      align: "start",
    },
    {
      id: "uploads",
      title: "Files that count up",
      description:
        "Give each attachment a `progress` from 0 to 1 while its `status` is `uploading`: the tile draws a ring that closes as the file goes up and counts the percentage, which is a progressbar to assistive technology. At 100 % the count fades out. `size=\"sm\"` makes the 56 px tiles a composer wants.",
      code: `<ChatComposer
  attachments={
    <Attachments
      variant="grid"
      size="sm"
      items={files.map((file) => ({ ...file, status: "uploading", progress: file.sent / file.size }))}
      onRemove={remove}
    />
  }
  onSubmit={send}
/>`,
      render: () => (
        <div style={{ width: "min(100%, 34rem)" }}>
          <ChatComposer
            attachments={<Attachments items={[photo(1, "ready"), sheet(0.64), notes(0.18)]} onRemove={() => {}} size="sm" variant="grid" />}
            onSubmit={() => {}}
            value="Compare these with last quarter"
          />
        </div>
      ),
      align: "start",
    },
    {
      id: "tools",
      title: "Tools and a footer",
      description:
        "`tools` sit at the start of the bar: `ComposerButton` for an action, `ComposerToggle` for a mode that stays on (it is a pressed button). `footer` is a quiet line under the composer.",
      code: `<ChatComposer
  tools={
    <>
      <ComposerButton icon={<Paperclip />} label="Attach files" tooltip="Attach files" />
      <ComposerToggle icon={<Globe />} label="Search the web" pressed={web} onPressedChange={setWeb}>
        Web
      </ComposerToggle>
    </>
  }
  footer="Answers can be wrong. Check the numbers before you send them on."
  onSubmit={send}
/>`,
      render: () => (
        <div style={{ width: "min(100%, 34rem)" }}>
          <ToolsComposer />
        </div>
      ),
      align: "start",
    },
  ],
};

export const attachmentsExamples: ExampleSet = {
  preview: () => (
    <Attachments
      items={[photo(1, "ready"), sheet(0.64), notes(1, "ready"), { ...notes(0, "error"), id: "broken", name: "scan-0042.tiff", mediaType: "image/tiff", error: "Too large: the limit is 20 MB" }]}
      onRemove={() => {}}
      variant="grid"
    />
  ),
  previewCode: `import { Attachments, type AttachmentItem } from "@fabrials/ai-ui";

const files: AttachmentItem[] = [
  {
    id: "photo",
    name: "harbour.png",
    mediaType: "image/png",
    size: 248_000,
    url: "/files/harbour.png",
    status: "ready",
  },
  {
    id: "sheet",
    name: "invoices-q3.xlsx",
    mediaType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 1_240_000,
    status: "uploading",
    progress: 0.64,
  },
  {
    id: "notes",
    name: "migration-notes.pdf",
    mediaType: "application/pdf",
    size: 96_000,
    status: "ready",
  },
  {
    id: "scan",
    name: "scan-0042.tiff",
    mediaType: "image/tiff",
    status: "error",
    error: "Too large: the limit is 20 MB",
  },
];

export function Files({ onRemove }: { onRemove: (id: string) => void }) {
  return <Attachments items={files} onRemove={onRemove} variant="grid" />;
}`,
  examples: [
    {
      id: "grid",
      title: "Tiles",
      description:
        "`variant=\"grid\"` shows each file as a tile: the picture itself, or the kind of file. A tile that is uploading with a `progress` draws its ring and counts; without one it shows the busy mark. On a fine pointer the remove key appears on hover and on keyboard focus; on a touch screen it stays in view, so an upload can be cancelled.",
      code: `<Attachments variant="grid" items={files} onRemove={remove} />`,
      render: () => <Attachments items={[photo(1, "ready"), sheet(0.36), notes(1, "ready")]} onRemove={() => {}} variant="grid" />,
    },
    {
      id: "inline",
      title: "Chips",
      description: "`variant=\"inline\"` (the default) is a row of chips with the name and the size, for a message or a narrow composer. An upload says its percentage in the chip.",
      code: `<Attachments items={files} onRemove={remove} />`,
      render: () => <Attachments items={[photo(1, "ready"), sheet(0.36)]} onRemove={() => {}} />,
    },
    {
      id: "list",
      title: "A list",
      description: "`variant=\"list\"` gives each file a row with room for its details, such as a review before sending. An error says what went wrong in the row and is announced.",
      code: `<Attachments variant="list" items={files} onRemove={remove} />`,
      render: () => (
        <div style={{ width: "min(100%, 26rem)" }}>
          <Attachments
            items={[notes(1, "ready"), { ...sheet(0, "error"), error: "The sheet is protected. Remove the password and try again." }]}
            onRemove={() => {}}
            variant="list"
          />
        </div>
      ),
    },
  ],
};
