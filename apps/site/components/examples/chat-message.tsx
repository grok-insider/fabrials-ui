"use client";

import { useEffect, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { ChatMessage, CopyMessageAction, MessageAction, MessageActions, MessageTimestamp } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { ReplayButton } from "./replay";

const ANSWER =
  "Import the tokens, the fonts and the styles once, in that order, at the root of the app. Tailwind hosts add the bridge last, so their utilities can read the same tokens. A component never imports styles on its own.";

/** Streams `text` a word or two at a time, with a pause in the middle, as a model's answer arrives. */
function useStream(text: string, run: number) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const words = text.split(" ");
    let index = 0;
    let timer = 0;
    setShown("");
    const next = () => {
      index += 1 + (index % 3 === 0 ? 1 : 0);
      setShown(words.slice(0, index).join(" "));
      if (index < words.length) timer = window.setTimeout(next, index === 14 ? 1400 : 90);
    };
    timer = window.setTimeout(next, 400);
    return () => window.clearTimeout(timer);
  }, [text, run]);
  return { shown, done: shown.length === text.length };
}

function Answer() {
  const [run, setRun] = useState(0);
  const { shown, done } = useStream(ANSWER, run);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-5)", width: "min(100%, 36rem)" }}>
      <ChatMessage from="user">How should a product import the shared styles?</ChatMessage>
      <ChatMessage from="assistant" streaming={!done}>
        <div className="fui-markdown">
          <p>{shown}</p>
        </div>
      </ChatMessage>
      <div>
        <ReplayButton label="Ask again" onClick={() => setRun((value) => value + 1)} />
      </div>
    </div>
  );
}

export const chatMessageExamples: ExampleSet = {
  preview: () => <Answer />,
  previewCode: `import { ChatMessage } from "@fabrials/ai-ui";

// \`answer\` is the text received so far; \`done\` turns true when the stream ends.
export function Turn({
  question,
  answer,
  done,
}: {
  question: string;
  answer: string;
  done: boolean;
}) {
  return (
    <>
      <ChatMessage from="user">{question}</ChatMessage>
      <ChatMessage from="assistant" streaming={!done}>
        <div className="fui-markdown">
          <p>{answer}</p>
        </div>
      </ChatMessage>
    </>
  );
}`,
  examples: [
    {
      id: "streaming",
      title: "While the answer arrives",
      description:
        "`streaming` puts a block caret of the working light at the end of the text: solid while words arrive, blinking when the stream waits, still under reduced motion. The message is `aria-busy` until it ends, so a screen reader reads the answer once, whole. Turn it off when the stream ends.",
      code: `<ChatMessage from="assistant" streaming={!done}>
  <Markdown>{answer}</Markdown>
</ChatMessage>`,
      render: () => (
        <div style={{ width: "min(100%, 30rem)" }}>
          <ChatMessage from="assistant" streaming>
            <div className="fui-markdown">
              <p>Import the tokens, the fonts and the styles once, in that order</p>
            </div>
          </ChatMessage>
        </div>
      ),
    },
    {
      id: "actions",
      title: "A turn and its actions",
      description:
        "`actions` takes `MessageActions`: copy, edit and retry keys and the time. They show on hover and focus; `pinActions` keeps them visible, for the latest answer. User turns sit in a bubble.",
      code: `<ChatMessage
  from="user"
  actions={
    <MessageActions>
      <CopyMessageAction text={question} />
      <MessageAction label="Edit"><Pencil /></MessageAction>
    </MessageActions>
  }
>
  {question}
</ChatMessage>
<ChatMessage
  from="assistant"
  pinActions
  actions={
    <MessageActions>
      <CopyMessageAction text={answer} />
      <MessageAction label="Retry"><RotateCcw /></MessageAction>
      <MessageTimestamp dateTime="2026-09-26T10:42:00Z" label="10:42" detail="Sep 26, 2026, 10:42" />
    </MessageActions>
  }
>
  <Markdown>{answer}</Markdown>
</ChatMessage>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-6)", width: "min(100%, 34rem)" }}>
          <ChatMessage
            actions={
              <MessageActions>
                <CopyMessageAction text="How should a product import the shared styles?" />
                <MessageAction label="Edit">
                  <Pencil aria-hidden="true" />
                </MessageAction>
              </MessageActions>
            }
            from="user"
          >
            How should a product import the shared styles?
          </ChatMessage>
          <ChatMessage
            actions={
              <MessageActions>
                <CopyMessageAction text={ANSWER} />
                <MessageAction label="Retry">
                  <RotateCcw aria-hidden="true" />
                </MessageAction>
                <MessageTimestamp dateTime="2026-09-26T10:42:00Z" detail="Sep 26, 2026, 10:42" label="10:42" />
              </MessageActions>
            }
            from="assistant"
            pinActions
          >
            <div className="fui-markdown">
              <p>{ANSWER}</p>
            </div>
          </ChatMessage>
        </div>
      ),
      align: "start",
    },
  ],
};
