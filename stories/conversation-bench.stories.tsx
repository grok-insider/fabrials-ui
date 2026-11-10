import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ChatComposer,
  ChatMessage,
  Conversation,
  ConversationCheckpoints,
  ConversationContent,
  ConversationEmpty,
  ConversationFooter,
  ConversationScrollButton,
  CopyMessageAction,
  MessageActions,
  useConversation,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS } from "./media-fixtures";

// A conversation in fixed states, for the visual suite: no timers, no network, and a thread long enough to scroll. The
// streaming states are in `Tests/Conversation › Streaming`, where a test drives the growth.

type Turn = { id: string; from: "user" | "assistant"; body: ReactNode; wide?: boolean };

const Markdown = ({ children }: { children: ReactNode }) => <div className="fui-markdown">{children}</div>;

const TABLE = (
  <table>
    <thead>
      <tr>
        <th scope="col">Invoice</th>
        <th scope="col">Account</th>
        <th scope="col">Due</th>
        <th scope="col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Q3-0148</td>
        <td>North quay</td>
        <td>14 Nov</td>
        <td>1,240.00</td>
      </tr>
      <tr>
        <td>Q3-0149</td>
        <td>Orchard terrace</td>
        <td>21 Nov</td>
        <td>392.50</td>
      </tr>
      <tr>
        <td>Q3-0150</td>
        <td>Quarry lake</td>
        <td>28 Nov</td>
        <td>8,910.00</td>
      </tr>
    </tbody>
  </table>
);

const QUERY = `select account, sum(amount)
from invoices
group by account;`;

const ARABIC_ANSWER = (
  <Markdown>
    <p>
      نعم. تستخدم الواجهة خصائص منطقية، فينقلب العمود إلى الجهة الأخرى وحده. أما الشيفرة والأرقام وعناوين المواقع فتبقى من
      اليسار إلى اليمين، لأنها ليست جملة.
    </p>
    <ul>
      <li>الهوامش والحشو تتبع بداية السطر لا يساره.</li>
      <li>الشريط الجانبي يقف عند الحافة اليمنى في هذه الصفحة.</li>
      <li>الاقتباس يبقى في اتجاهه الأصلي داخل الفقرة.</li>
    </ul>
  </Markdown>
);

const ENGLISH: Turn[] = [
  { id: "turn-1", from: "user", body: "Which layers does the cascade use, and in what order?" },
  {
    id: "turn-2",
    from: "assistant",
    body: (
      <Markdown>
        <p>
          Three, and the order is the point: base, then components, then utilities. A product adds its own sheet as a fourth
          layer above them, so nothing the system ships is overridden by accident.
        </p>
      </Markdown>
    ),
  },
  { id: "turn-3", from: "user", body: "Where do the tokens live?" },
  {
    id: "turn-4",
    from: "assistant",
    body: (
      <Markdown>
        <p>In the base layer, as custom properties on the root:</p>
        <ul>
          <li>a theme overrides them on an element, and everything under it follows;</li>
          <li>components read them and never write a literal colour;</li>
          <li>a product that retints one token moves every piece at once.</li>
        </ul>
      </Markdown>
    ),
  },
  { id: "turn-5", from: "user", body: "Show me the invoice table and the query behind it." },
  {
    id: "turn-6",
    from: "assistant",
    body: (
      <Markdown>
        <p>November, by account, highest first. The table takes the whole column; prose does not.</p>
        {TABLE}
        <p>The query that fills it:</p>
        <pre>
          <code>{QUERY}</code>
        </pre>
      </Markdown>
    ),
    wide: true,
  },
  { id: "turn-7", from: "user", body: <span lang="ar">وهل يعمل ذلك في صفحة من اليمين إلى اليسار؟</span> },
  {
    id: "turn-8",
    from: "assistant",
    body: (
      <div dir="rtl" lang="ar">
        {ARABIC_ANSWER}
      </div>
    ),
  },
  { id: "turn-9", from: "user", body: "One more thing: what about the reading measure?" },
  {
    id: "turn-10",
    from: "assistant",
    body: (
      <Markdown>
        <p>
          An answer is as wide as its text, up to 52rem, and the whole column for a table, code or a figure. A reader asked
          for prose, not for a wall.
        </p>
        <figure data-wide>
          <img
            alt="A harbour at dusk under a pale sun"
            height={1500}
            src={PHOTOS[0]!.src}
            style={{ aspectRatio: "3 / 2", blockSize: "auto", inlineSize: "100%", maxInlineSize: "32rem", objectFit: "cover" }}
            width={2400}
          />
          <figcaption>A harbour at dusk. A figure takes the measure away.</figcaption>
        </figure>
      </Markdown>
    ),
    wide: true,
  },
  { id: "turn-11", from: "user", body: "Thanks, that clears it up." },
  {
    id: "turn-12",
    from: "assistant",
    body: (
      <Markdown>
        <p>Any time. The migration note lists what a product can delete once it adopts this.</p>
      </Markdown>
    ),
  },
];

/** Two answers and a question: short prose, which keeps its measure, and a table, which takes the column. */
const MEASURE: Turn[] = [
  { id: "m-1", from: "user", body: "Which layers, and where do the tokens live?" },
  {
    id: "m-2",
    from: "assistant",
    body: (
      <Markdown>
        <p>Three, in this order:</p>
        <ul>
          <li>base, where the tokens live;</li>
          <li>components, which read them.</li>
        </ul>
      </Markdown>
    ),
  },
  {
    id: "m-3",
    from: "assistant",
    body: (
      <Markdown>
        <p>November, by account:</p>
        {TABLE}
      </Markdown>
    ),
    wide: true,
  },
];

const ARABIC: Turn[] = [
  { id: "ar-1", from: "user", body: <span lang="ar">ما ترتيب الطبقات في مكتبة المكوّنات؟</span> },
  {
    id: "ar-2",
    from: "assistant",
    body: (
      <div dir="rtl" lang="ar">
        {ARABIC_ANSWER}
      </div>
    ),
  },
  { id: "ar-3", from: "user", body: <span lang="ar">وهل تنقلب الأيقونات أيضًا؟</span> },
  {
    id: "ar-4",
    from: "assistant",
    body: (
      <div dir="rtl" lang="ar">
        <Markdown>
          <p>تنقلب التي لها اتجاه، مثل أسهم التالي والسابق، وتبقى التي لها معنى ثابت مثل علامة التشغيل.</p>
        </Markdown>
      </div>
    ),
  },
  { id: "ar-5", from: "user", body: <span lang="ar">شكرًا، هذا واضح.</span> },
  {
    id: "ar-6",
    from: "assistant",
    body: (
      <div dir="rtl" lang="ar">
        <Markdown>
          <p>العفو. الجدول أدناه يحفظ الاتجاه الأصلي داخل جملة عربية.</p>
        </Markdown>
      </div>
    ),
  },
];

function Thread({ turns, dir, idPrefix = "" }: { turns: Turn[]; dir?: "rtl"; idPrefix?: string }) {
  return (
    <>
      {turns.map((turn, index) => (
        <ChatMessage
          actions={
            turn.from === "assistant" && index === turns.length - 1 ? (
              <MessageActions>
                <CopyMessageAction text="Any time. The migration note lists what a product can delete once it adopts this." />
              </MessageActions>
            ) : undefined
          }
          from={turn.from}
          id={`${idPrefix}${turn.id}`}
          key={turn.id}
          pinActions={index === turns.length - 1}
        >
          {dir === "rtl" ? <div dir="rtl">{turn.body}</div> : turn.body}
        </ChatMessage>
      ))}
    </>
  );
}

/** A thread in a frame of a fixed height: the conversation fills it and the composer docks at its end. */
function Board({
  turns,
  height = 420,
  width,
  measure = false,
  dir,
  unread,
  scrollTo,
  idPrefix = "",
}: {
  turns: Turn[];
  height?: number;
  width?: number;
  measure?: boolean;
  dir?: "rtl";
  unread?: number;
  scrollTo?: string;
  idPrefix?: string;
}) {
  return (
    <Frame dir={dir} width={width}>
      <div style={{ blockSize: `${height}px`, display: "flex" }}>
        <Conversation>
          <ConversationContent measure={measure}>
            <Thread dir={dir} idPrefix={idPrefix} turns={turns} />
          </ConversationContent>
          {scrollTo ? <ScrolledAway to={scrollTo} /> : null}
          {turns.length > 2 ? <ConversationCheckpoints /> : null}
          <ConversationScrollButton unread={unread} />
          <ConversationFooter>
            <ChatComposer onSubmit={() => {}} placeholder={dir === "rtl" ? "اكتب رسالة" : "Message"} />
          </ConversationFooter>
        </Conversation>
      </div>
    </Frame>
  );
}

/** Opens scrolled away from the end, through the public API, so the key that goes back is in the picture. */
function ScrolledAway({ to }: { to: string }) {
  const { scrollToMessage } = useConversation();
  useEffect(() => {
    scrollToMessage(to, { behavior: "instant" });
  }, [scrollToMessage, to]);
  return null;
}

function Bench() {
  return (
    <Page
      description="A conversation that follows the end while an answer arrives, lets go when the reader scrolls away, keeps a rail of their messages and reserves the measure for prose."
      title="Conversation"
    >
      <Block
        title="Twelve turns"
        description="Opens at the latest message. The rail on the end side lists the reader's own messages; a table and code take the whole column."
      >
        <Board turns={ENGLISH} />
      </Block>
      <Block
        title="The way back"
        description="The reader went up: the key appears at the end edge with what arrived meanwhile, and the rail says which message they are on."
      >
        <Board idPrefix="away-" scrollTo="away-turn-9" turns={ENGLISH} unread={3} />
      </Block>
      <Block title="The measure on" description="Prose keeps to 52rem, a table takes the column, and the reader's bubble stops at 80%.">
        <Board height={420} measure turns={MEASURE} width={720} />
      </Block>
      <Block title="The measure off" description="As it ships today: an answer is as wide as its column.">
        <Board height={420} turns={MEASURE} width={720} />
      </Block>
      <Block title="A thread that fits" description="Two turns in a short frame: nothing overflows, so the log is not a tab stop and there is no rail.">
        <Frame width={520}>
          <div style={{ blockSize: "220px", display: "flex" }}>
            <Conversation>
              <ConversationContent>
                <ChatMessage from="user" id="fit-1">
                  Just one question.
                </ChatMessage>
                <ChatMessage from="assistant" id="fit-2">
                  <Markdown>
                    <p>And one answer, short enough to stay in view.</p>
                  </Markdown>
                </ChatMessage>
              </ConversationContent>
              <ConversationCheckpoints />
            </Conversation>
          </div>
        </Frame>
      </Block>
      <Block title="Nothing yet" description="What a conversation shows before its first message, with the composer ready.">
        <Frame width={520}>
          <div style={{ blockSize: "260px", display: "flex" }}>
            <Conversation>
              <ConversationEmpty description="Ask about the billing schema, or paste an invoice." />
              <ConversationFooter>
                <ChatComposer onSubmit={() => {}} placeholder="Ask anything" />
              </ConversationFooter>
            </Conversation>
          </div>
        </Frame>
      </Block>
      <Block title="Right to left" description="The rail moves to the left edge, the composer runs the other way, and code inside an answer keeps its own direction.">
        <Board dir="rtl" height={380} idPrefix="ar-" turns={ARABIC} width={700} />
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Conversation",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { name: "Conversation", render: () => <Bench /> };

const STREAM_CHUNKS = [
  "The table is written by the migration, ",
  "and the answer arrives a few words at a time. ",
  "Each arrival is growth in the same message, ",
  "so the view stays at the end without being told to. ",
  "When it stops, the caret stops with it and the composer goes quiet.",
];

const STREAM_START = (
  <Markdown>
    <p>Here is the shape of it:</p>
    <ul>
      <li>the log follows the end;</li>
      <li>it lets go the moment you scroll away;</li>
      <li>and it comes back when you ask.</li>
    </ul>
    <p>
      A long answer follows, to have something to scroll past. The end of it is written a chunk at a time by the buttons
      beside this frame.
    </p>
  </Markdown>
);

function LateImage({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 150);
    return () => window.clearTimeout(timer);
  }, []);
  if (!ready) return null;
  return <img alt={alt} src={src} style={{ inlineSize: "100%", blockSize: "auto", borderRadius: "var(--fui-radius-md)" }} />;
}

/** The pieces a test drives: text appended every 50 ms, a picture that loads late, and a message sent. */
function StreamingBench() {
  const [chunks, setChunks] = useState(0);
  const [repeat, setRepeat] = useState(0);
  const [lateImage, setLateImage] = useState(false);
  const [sent, setSent] = useState(0);
  const [stick, setStick] = useState(0);
  const timer = useRef<number | null>(null);
  const streaming = chunks > 0;

  useEffect(() => {
    if (chunks === 0) return;
    if (chunks >= STREAM_CHUNKS.length) return;
    timer.current = window.setTimeout(() => setChunks((count) => count + 1), 50);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [chunks]);

  const text = STREAM_CHUNKS.slice(0, chunks).join("");

  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)" }}>
        <button
          data-testid="stream-replay"
          onClick={() => {
            setRepeat((count) => count + 1);
            setChunks(1);
          }}
          type="button"
        >
          Stream an answer
        </button>
        <button data-testid="late-image" onClick={() => setLateImage(true)} type="button">
          Load an image above
        </button>
        <button
          data-testid="send"
          onClick={() => {
            setSent((count) => count + 1);
            setStick((count) => count + 1);
          }}
          type="button"
        >
          Send a message
        </button>
      </div>
      <Frame>
        <div style={{ blockSize: "440px", display: "flex" }}>
          <Conversation stickKey={stick}>
            <ConversationContent>
              <ChatMessage from="user" id="stream-question">
                How does the lock work?
              </ChatMessage>
              <ChatMessage from="assistant" id="stream-answer-above">
                <Markdown>
                  <p>It watches its own content instead of a timer: any growth while it holds the end is followed.</p>
                  <div data-testid="late-slot">{lateImage ? <LateImage alt="Orchard terraces on the north side" src={PHOTOS[1]!.src} /> : null}</div>
                </Markdown>
              </ChatMessage>
              <ChatMessage from="user" id="stream-question-2">
                And when I scroll up?
              </ChatMessage>
              <ChatMessage from="assistant" id="stream-answer">
                <Markdown>
                  <p>{STREAM_START}</p>
                  {chunks > 0 ? (
                    <>
                      <p data-testid="stream-text">{text}</p>
                      <p>
                        A further paragraph, so that what arrives pushes the end far enough to be measured, not just a line
                        inside the same box.
                      </p>
                    </>
                  ) : null}
                </Markdown>
              </ChatMessage>
              {Array.from({ length: sent }, (_, index) => (
                <ChatMessage from="user" id={`sent-${index + 1}`} key={`sent-${index + 1}`}>
                  Sent message {index + 1}
                </ChatMessage>
              ))}
              <ChatMessage from="assistant" id="stream-tail">
                <Markdown>
                  <p>
                    The tail of the thread, so that the end is a sentence rather than a picture, and the last turn of the
                    frame is an answer.
                  </p>
                </Markdown>
              </ChatMessage>
            </ConversationContent>
            <ConversationCheckpoints />
            <ConversationScrollButton />
            <ConversationFooter>
              <ChatComposer onSubmit={() => {}} placeholder="Message" />
            </ConversationFooter>
          </Conversation>
        </div>
      </Frame>
      <p data-testid="stream-state" style={{ color: "var(--muted-foreground)", font: "inherit" }}>
        {streaming ? `streaming ${chunks} of ${STREAM_CHUNKS.length}` : "idle"} · {repeat} runs · {sent} sent · late image{" "}
        {lateImage ? "in" : "out"}
      </p>
    </div>
  );
}

export const Streaming: Story = {
  name: "Streaming",
  render: () => (
    <Page description="Content that keeps arriving, a picture that loads late, and a message sent while the reader is away." title="Conversation, streaming">
      <Block title="A test drives it" description="Buttons append a chunk every 50 ms, add a picture above the fold, and send a message that locks the end again.">
        <StreamingBench />
      </Block>
    </Page>
  ),
};
