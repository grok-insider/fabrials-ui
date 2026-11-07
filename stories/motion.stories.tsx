import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Meter,
  NumberTicker,
  PageHeader,
  Readout,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  WorkingLight,
} from "@fabrials/ui";
import { AgentThinking } from "@fabrials/ai-ui";

const SENDERS = ["Northwind Weekly", "Contoso Deals", "Forum digest", "Fabrikam Updates", "Bank alerts", "Litware News", "Tailspin Toys", "Adventure Works"];

function Arrivals() {
  const [count, setCount] = useState(2);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 24rem)" }}>
      <ul className="mo-list">
        {SENDERS.slice(0, count).map((name, index) => (
          <li className={index >= 2 ? "fui-rise" : undefined} key={name} style={{ "--fui-stagger": index - Math.max(2, count - 3) } as CSSProperties}>
            {name}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "var(--fui-space-2)" }}>
        <Button disabled={count >= SENDERS.length} onClick={() => setCount((value) => Math.min(SENDERS.length, value + 3))} size="sm" variant="outline">
          Three more arrive
        </Button>
        <Button onClick={() => setCount(2)} size="sm" variant="ghost">
          Reset
        </Button>
      </div>
    </div>
  );
}

function Level() {
  const [value, setValue] = useState(34);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 24rem)" }}>
      <Meter label="Disk" value={value} variant="ruler" />
      <Slider aria-label="Disk" onValueChange={(next) => setValue(Array.isArray(next) ? next[0]! : next)} value={value} />
    </div>
  );
}

function Numbers() {
  const [value, setValue] = useState(48210);
  const reading = `Synced ${value % 2 === 0 ? "14:32" : "14:37"} UTC`;
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <span style={{ fontFamily: "var(--fui-font-display)", fontSize: "2.5rem", fontWeight: 600, lineHeight: 1 }}>
        <NumberTicker startOnView={false} value={value} />
      </span>
      <Readout value={reading} />
      <Button onClick={() => setValue((current) => current + 1137)} size="sm" variant="outline">
        New data
      </Button>
    </div>
  );
}

function Work() {
  const [working, setWorking] = useState(true);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 24rem)" }}>
      <Card style={{ position: "relative" }}>
        <CardHeader>
          <CardTitle>Draft reply</CardTitle>
          <CardDescription>{working ? "Writing from the last 3 messages" : "Ready to review"}</CardDescription>
        </CardHeader>
        {working ? <WorkingLight /> : null}
      </Card>
      {working ? <AgentThinking label="Writing the reply" /> : null}
      <div>
        <Button onClick={() => setWorking((value) => !value)} size="sm" variant="outline">
          {working ? "Finish the work" : "Start again"}
        </Button>
      </div>
    </div>
  );
}

const moments = [
  {
    title: "Something arrives",
    cause: "Rows, steps and tiles that arrive after the view is shown rise 4 px out of a slight blur, 45 ms apart up to the eighth. What is there at first paint does not move.",
    demo: () => <Arrivals />,
  },
  {
    title: "A press",
    cause: "A key goes down 1 px while it is held, and its bevel turns into an inner shadow.",
    demo: () => (
      <div style={{ display: "flex", gap: "var(--fui-space-2)" }}>
        <Button>Hold me</Button>
        <Button variant="outline">Or me</Button>
      </div>
    ),
  },
  {
    title: "A choice",
    cause: "In a single-choice group the raised segment slides to the new choice.",
    demo: () => (
      <ToggleGroup aria-label="Range" defaultValue={["7d"]}>
        <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
        <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
        <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: "A tick and a thumb",
    cause: "A tick is drawn and pops in; a switch's thumb stretches while held and springs across.",
    demo: () => (
      <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
        <Label className="fui-choice">
          <Checkbox /> Include archived records
        </Label>
        <Label className="fui-choice">
          <Switch /> Quota resets
        </Label>
      </div>
    ),
  },
  {
    title: "A level changes",
    cause: "A ruler inks its ticks in order and its mark travels to the new value.",
    demo: () => <Level />,
  },
  {
    title: "A number or a reading changes",
    cause: "Digits roll like an odometer; a reading cycles its characters for 240 ms and settles left to right.",
    demo: () => <Numbers />,
  },
  {
    title: "Opening",
    cause: "A panel grows to its height and its body rises out of a slight blur; it closes the same way, faster.",
    demo: () => (
      <Accordion style={{ width: "min(100%, 24rem)" }}>
        <AccordionItem value="a">
          <AccordionTrigger>What does sharing publish?</AccordionTrigger>
          <AccordionContent>Provider, plan and usage summaries. Never credentials or prompts.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Where are keys stored?</AccordionTrigger>
          <AccordionContent>In the system keychain, never in a file.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    title: "An agent works",
    cause: "The working light turns along the edge of what it works on and a band of light crosses its label. It goes out when the work ends.",
    demo: () => <Work />,
  },
];

function VocabularyPage() {
  return (
    <main className="sb-showcase">
      <PageHeader
        description="Every movement answers what a person did, what the data did or what an agent is doing. All of it stops under reduced motion, where each state shows at once."
        eyebrow="Foundations"
        title="Motion"
      />
      <div className="sb-examples">
        {moments.map((moment) => (
          <section aria-label={moment.title} className="sb-example" key={moment.title}>
            <h2 className="sb-example-title">{moment.title}</h2>
            <p className="sb-example-description">{moment.cause}</p>
            <div className="sb-example-plate">
              <div className="sb-example-stage">{moment.demo()}</div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const meta = {
  title: "Foundations/Motion",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vocabulary: Story = { render: () => <VocabularyPage /> };
