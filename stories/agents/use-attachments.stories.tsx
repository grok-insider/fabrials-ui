import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Paperclip } from "lucide-react";
import {
  Attachments,
  ChatComposer,
  ComposerButton,
  useAttachments,
  type AttachmentUpload,
} from "@fabrials/ai-ui";
import { Button, DropOverlay } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";
import { composerBench, fakeUpload, pngFile, textFile, type UploadedFile } from "../composer-fixtures";

const description =
  "The files of a composer and their way up. The library draws them and keeps their state; the host uploads them, says where the upload stands and what it answered. Sending waits for the files there are.";

const ACCEPT = "image/*,.txt";

/** The uploader of a demo: it finishes by itself, since a page that never finishes cannot be looked at. */
const upload: AttachmentUpload<UploadedFile> = (file, context) => {
  composerBench().auto = true;
  return fakeUpload(file, context);
};

function Report({ said }: { said: string }) {
  return (
    <p data-slot="report" style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
      {said}
    </p>
  );
}

/** A composer that takes files from the picker, the keyboard and the whole page. */
function Piece({ pageDrop }: { pageDrop: boolean }) {
  const [draft, setDraft] = useState("");
  const [said, setSaid] = useState("Nothing has been sent.");
  const attachments = useAttachments<UploadedFile>({ accept: ACCEPT, pageDrop, upload });
  const send = async (text: string, files: typeof attachments) => {
    try {
      const { ids, items } = await files.waitForUploads();
      setSaid(`Sent “${text}” with ${items.map((item) => item.name).join(", ") || "no files"}.`);
      for (const id of ids) files.remove(id);
      setDraft("");
    } catch (error) {
      setSaid(error instanceof Error ? error.message : "The message could not be sent.");
    }
  };
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "100%", maxWidth: "34rem" }}>
      <input {...attachments.inputProps} />
      <DropOverlay accept={ACCEPT} description="Pictures or text files" label="Drop files to attach" scope={pageDrop ? "page" : "self"}>
        <ChatComposer
          attachments={
            attachments.items.length > 0 ? <Attachments items={attachments.items} onRemove={attachments.remove} size="sm" variant="grid" /> : undefined
          }
          onPasteFiles={attachments.add}
          onRemoveLastAttachment={attachments.removeLast}
          onSubmit={(value) => void send(value, attachments)}
          onValueChange={setDraft}
          placeholder="Ask about these files"
          tools={<ComposerButton icon={<Paperclip />} label="Attach files" onClick={attachments.openPicker} tooltip="Attach files" />}
          value={draft}
        />
      </DropOverlay>
      <Report said={said} />
    </div>
  );
}

/** What the composer refuses, said out loud instead of being dropped without a word. */
function Refused() {
  const [lines, setLines] = useState<string[]>([]);
  const attachments = useAttachments<UploadedFile>({
    accept: "image/*",
    maxSize: 2_000_000,
    onReject: (rejection) =>
      setLines((list) => [
        ...list,
        rejection.reason === "type" ? `${rejection.file.name}: only pictures are accepted.` : `${rejection.file.name}: too large.`,
      ]),
    upload,
  });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", width: "100%", maxWidth: "34rem", justifyItems: "start" }}>
      <input {...attachments.inputProps} />
      <Button onClick={attachments.openPicker} size="sm" variant="outline">
        Choose pictures
      </Button>
      <Attachments items={attachments.items} onRemove={attachments.remove} size="sm" variant="grid" />
      <p data-slot="refused" role="status" style={{ margin: 0, color: "var(--fui-danger-ink)", fontSize: "var(--fui-text-xs)" }}>
        {lines.join(" ")}
      </p>
    </div>
  );
}

/** The files a demo starts with, so a page shows an upload without anyone having to pick one. */
function Seeded() {
  const attachments = useAttachments<UploadedFile>({ accept: ACCEPT, upload });
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    attachments.add([pngFile("harbour.png"), textFile("release-notes.txt")]);
  }, [attachments]);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "100%", maxWidth: "34rem" }}>
      <input {...attachments.inputProps} />
      <Attachments items={attachments.items} onRemove={attachments.remove} size="sm" variant="grid" />
      <Report said={`${attachments.items.length} files, ${attachments.uploading ? "still on their way" : "all done"}.`} />
    </div>
  );
}

const example = (id: string, title: string, text: string, code: string, render: () => ReactNode) => ({ id, title, description: text, code, render });

const examples: ExampleSet = {
  preview: () => <Piece pageDrop />,
  examples: [
    example(
      "waiting",
      "Sending waits for the files",
      "The message is sent once every file there is at that moment has an answer. A file added while it waits goes with the next message.",
      `const files = useAttachments({ upload: (file, { signal, onProgress }) => api.upload(file, { signal, onProgress }) });

const send = async (text: string) => {
  const { results } = await files.waitForUploads();
  await api.send(text, results);
};`,
      () => <Piece pageDrop={false} />,
    ),
    example(
      "page",
      "Files dropped anywhere on the page",
      "With `pageDrop` a drop outside the composer still lands in it, and the drop overlay says where it goes.",
      `const files = useAttachments({ upload, pageDrop: true });

<DropOverlay scope="page" label="Drop files to attach">
  <ChatComposer attachments={<Attachments items={files.items} onRemove={files.remove} />} … />
</DropOverlay>`,
      () => <Piece pageDrop />,
    ),
    example(
      "refused",
      "Saying why a file was not taken",
      "`sortFiles` refuses by type, size and count; every refusal reaches `onReject` with its reason, and the files that were accepted still go up.",
      `const files = useAttachments({
  accept: "image/*",
  maxSize: 2_000_000,
  onReject: ({ file, reason }) => say(\`\${file.name}: \${reason}\`),
  upload,
});`,
      () => <Refused />,
    ),
    example(
      "seeded",
      "Files that were already there",
      "`add` takes a list of files, so a composer restored from a draft starts uploading as soon as it appears.",
      `const files = useAttachments({ upload });
useEffect(() => files.add(draftFiles), []);`,
      () => <Seeded />,
    ),
  ],
};

const meta = {
  title: "Agents/Use attachments",
  parameters: { docs: { description: { component: description } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <Showcase description={description} eyebrow="Agents" set={examples} title="Uploads" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: () => <Piece pageDrop={false} />,
};
