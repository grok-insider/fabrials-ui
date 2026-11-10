import { useState } from "react";
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
  MessageTimestamp,
  type ConversationProps,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "../story-frame";

// The conversation as a page: what the log does, the pieces around it, and a playground where a message sent makes it follow
// the end again.

const description =
  "The log a chat fills: it opens at the latest message, stays there while an answer streams, lets go the moment the reader scrolls, and keeps a rail of their own messages. A reading measure keeps prose narrow while code, tables and figures take the column.";

const QA: Array<[string, string]> = [
  [
    "Where does the rail come from?",
    "From your own `ChatMessage from=\"user\"`: the rail finds them by `data-role`, or from anything wrapped in `ConversationCheckpoint`.",
  ],
  ["What is read out loud?", "Nothing by itself. A streaming answer read token by token is noise; announce the finished answer from the host."],
  ["Does the keyboard reach the log?", "Only while it overflows: then it is a tab stop, with its ring drawn inside, and PageUp, End and the arrows scroll it."],
];

const turns: Array<{ from: "user" | "assistant"; body: string | true }> = [
  { from: "user", body: "Which layers does the cascade use, and in what order?" },
  {
    from: "assistant",
    body: "Three, and the order is the point: base, then components, then utilities. A product adds its own sheet as a fourth layer above them, so nothing the system ships is overridden by accident.",
  },
  { from: "user", body: "Where do the tokens live?" },
  { from: "assistant", body: true },
  { from: "user", body: "Show me the invoice table." },
  { from: "assistant", body: true },
  { from: "user", body: "And the query behind it?" },
  { from: "assistant", body: "November, by account, highest first:" },
];

function Answer({ index }: { index: number }) {
  if (index === 3) {
    return (
      <div className="fui-markdown">
        <ul>
          <li>in the base layer, as custom properties on the root;</li>
          <li>a theme overrides them on an element, and everything under it follows;</li>
          <li>components read them and never write a literal colour.</li>
        </ul>
      </div>
    );
  }
  if (index === 5) {
    return (
      <div className="fui-markdown">
        <table>
          <thead>
            <tr>
              <th scope="col">Invoice</th>
              <th scope="col">Account</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Q3-0148</td>
              <td>North quay</td>
              <td>1,240.00</td>
            </tr>
            <tr>
              <td>Q3-0150</td>
              <td>Quarry lake</td>
              <td>8,910.00</td>
            </tr>
          </tbody>
        </table>
        <pre>
          <code>{"select account, sum(amount) as billed\nfrom invoices\ngroup by account;"}</code>
        </pre>
      </div>
    );
  }
  return <div className="fui-markdown">{null}</div>;
}

function PageBody() {
  return (
    <Page description={description} title="Conversation">
      <Block title="A thread" description="Twelve turns, a table and code that take the column, and a rail of the reader's own messages.">
        <Frame width={720}>
          <div style={{ blockSize: "380px", display: "flex" }}>
            <Conversation>
              <ConversationContent>
                {turns.map((turn, index) => (
                  <ChatMessage from={turn.from} key={index}>
                    {turn.body === true ? <Answer index={index} /> : <div className="fui-markdown">{turn.body}</div>}
                  </ChatMessage>
                ))}
              </ConversationContent>
              <ConversationCheckpoints />
              <ConversationScrollButton />
            </Conversation>
          </div>
        </Frame>
      </Block>
      <Block title="How it is put together" description="Three answers to the questions a host asks first.">
        <Frame width={720}>
          <dl style={{ display: "grid", gap: "var(--fui-space-3)", margin: 0 }}>
            {QA.map(([question, answer]) => (
              <div key={question} style={{ display: "grid", gap: "var(--fui-space-1)" }}>
                <dt style={{ color: "var(--foreground)" }}>{question}</dt>
                <dd style={{ margin: 0, color: "var(--muted-foreground)" }}>{answer}</dd>
              </div>
            ))}
          </dl>
        </Frame>
      </Block>
      <Block title="Nothing yet" description="Before its first message: a line about what to do, and the composer ready.">
        <Frame width={520}>
          <div style={{ blockSize: "240px", display: "flex" }}>
            <Conversation>
              <ConversationEmpty description="Ask about the billing schema, or paste an invoice." />
              <ConversationFooter>
                <ChatComposer onSubmit={() => {}} placeholder="Ask anything" />
              </ConversationFooter>
            </Conversation>
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

function PlaygroundBody(args: ConversationProps) {
  const [measure, setMeasure] = useState(true);
  const [sent, setSent] = useState<string[]>(["How does the lock work?", "Which layer do the tokens live in?"]);
  const [draft, setDraft] = useState("");
  return (
    <Frame>
      <label style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", padding: "var(--fui-space-2)" }}>
        <input checked={measure} onChange={(event) => setMeasure(event.target.checked)} type="checkbox" />
        The reading measure
      </label>
      <div style={{ blockSize: "420px", display: "flex" }}>
        <Conversation stickKey={sent.length} {...args}>
          <ConversationContent measure={measure}>
            {sent.map((text, index) => (
              <ChatMessage from="user" key={`${index}-${text}`}>
                {text}
              </ChatMessage>
            ))}
            <ChatMessage from="assistant">
              <div className="fui-markdown">
                <p>
                  It watches its own content instead of a timer: growth while it holds the end is followed at once, and a hand
                  that scrolls up lets go.
                </p>
              </div>
            </ChatMessage>
            <ChatMessage
              actions={<MessageTimestamp dateTime="2026-11-10T10:00:00Z" label="10:00" />}
              from="assistant"
              pinActions
            >
              <div className="fui-markdown">
                <p>The tokens are custom properties in the base layer.</p>
              </div>
            </ChatMessage>
            <ChatMessage from="user">
              <p>And a message that is a little longer, so that the thread has something to scroll past when it is read from
                the end.</p>
            </ChatMessage>
            <ChatMessage from="assistant">
              <div className="fui-markdown">
                <p>
                  It watches its own content instead of a timer, so growth while it holds the end is followed at once. A hand
                  that scrolls up lets go, and the key at the end edge says what arrived meanwhile.
                </p>
                <p>
                  The rail on the side lists your own messages: press one and its message comes to the top of the log, with a
                  line of air above it.
                </p>
              </div>
            </ChatMessage>
          </ConversationContent>
          <ConversationCheckpoints />
          <ConversationScrollButton />
          <ConversationFooter>
            <ChatComposer
              label="Message"
              onSubmit={(value) => {
                setSent((all) => [...all, value]);
                setDraft("");
              }}
              onValueChange={setDraft}
              placeholder="Send a message"
              value={draft}
            />
          </ConversationFooter>
        </Conversation>
      </div>
    </Frame>
  );
}

const meta = {
  title: "Agents/Conversation",
  component: Conversation,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { anchor: "end", threshold: 48 },
  argTypes: {
    anchor: { control: "inline-radio", options: ["end", "start"] },
    threshold: { control: { type: "range", min: 0, max: 200, step: 8 } },
    stickKey: { control: false },
    actionsRef: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Conversation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <PageBody />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <PlaygroundBody {...args} />,
};
