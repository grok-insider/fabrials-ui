import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Calendar,
  DatePicker,
  FileSize,
  LabelsProvider,
  LocalTime,
  Meter,
  MultiSelect,
  NumberTicker,
  Progress,
  RelativeTime,
  RepoInfo,
  Spreadsheet,
  countText,
} from "@fabrials/ui";
import { ConsumptionView, MessageTimestamp, ObservationStatus, ProviderCard, SynchronizedAccounts } from "@fabrials/ai-ui";
import { BALANCE, GROK_PROVIDER, REPORT, RESET_CREDITS, SYNCHRONIZED } from "./accounts-fixtures";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Default locale",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// 0.12: every piece that writes a number, a date or a time does so in English unless the host asks for another language, and a
// provider asks once. The clock and the data are fixed, so the same two frames show the same words on every machine.
const NOW = Date.UTC(2026, 10, 10, 9, 30);
const SENT = new Date(Date.UTC(2026, 8, 27, 7, 31));
const TODAY = new Date(2026, 10, 10);

const BOOK = {
  sheets: [
    {
      name: "Budget",
      rows: [
        [{ value: "Item" }, { value: "Due" }, { value: "Share" }],
        [{ value: "Rent & power" }, { value: new Date(Date.UTC(2026, 0, 5)) }, { value: 0.125 }],
        [{ value: 41_250 }, { value: true }, { value: new Date(Date.UTC(2026, 0, 15, 9, 30)) }],
      ],
    },
  ],
};

const OPTIONS = [
  { value: "grok", label: "Grok" },
  { value: "nous", label: "Nous" },
  { value: "codex", label: "Codex" },
];

function EveryPiece() {
  const sheet = useRef<HTMLDivElement>(null);
  return (
    <div data-default-pieces="" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
      <div data-piece="calendar" style={{ inlineSize: "19.5rem" }}>
        <Calendar mode="single" defaultSelected={TODAY} today={TODAY} weekStartsOn={1} />
      </div>
      <div data-piece="date-picker">
        <DatePicker aria-label="Due" defaultValue={TODAY} format={{ dateStyle: "medium" }} name="due" />
      </div>
      <div data-piece="spreadsheet" ref={sheet} style={{ blockSize: "12rem" }}>
        <Spreadsheet aria-label="Budget" height={192} workbook={BOOK} />
      </div>
      <p data-piece="relative">
        <RelativeTime absoluteFormat={{ dateStyle: "medium", timeZone: "UTC" }} date={SENT} now={NOW} timeZone="UTC" />
        {" · "}
        <RelativeTime date={NOW - 180_000} now={NOW} timeZone="UTC" />
      </p>
      <p data-piece="stamp">
        <MessageTimestamp date={SENT} />
      </p>
      <p data-piece="local-time">
        <LocalTime format="dateTime" value={SENT} />
      </p>
      <p data-piece="sizes">
        <FileSize bytes={26_214_400} /> · <FileSize bytes={1536} />
      </p>
      <p data-piece="counts">
        <NumberTicker startOnView={false} value={12_480} /> · <span>{countText("four words in here", "words")}</span> ·{" "}
        <RepoInfo forks={281} owner="grok-insider" repo="fabrials-ui" stars={12_480} />
      </p>
      <div data-piece="meters" style={{ display: "grid", gap: "var(--fui-space-2)", maxInlineSize: "22rem" }}>
        <Progress label="Indexing headers" max={1940} value={1240} />
        <Meter label="Storage" max={1940} showValue value={1240} />
      </div>
      <MultiSelect id="default-locale-providers" label="Providers" onValueChange={() => undefined} options={OPTIONS} value={["grok", "nous", "codex"]} />
      <div data-piece="accounts" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
        <ObservationStatus observation={BALANCE} />
        <ProviderCard provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} />
        <SynchronizedAccounts accounts={SYNCHRONIZED} now={NOW} />
        <ConsumptionView report={REPORT} />
      </div>
    </div>
  );
}

function Bench() {
  return (
    <Page
      description="The same pieces twice: as they ship, which is English, and inside a provider that asks for Spanish and Spanish digits."
      title="Default locale"
    >
      <Block title="As they ship" description="No locale anywhere: English numbers, English month names, English “AM”.">
        <Frame width={720}>
          <div data-locale-frame="english">
            <EveryPiece />
          </div>
        </Frame>
      </Block>
      <Block title="A provider asks for Spanish" description="One provider sets the language of every piece inside it.">
        <Frame width={720}>
          <LabelsProvider locale="es">
            <div data-locale-frame="spanish" lang="es">
              <EveryPiece />
            </div>
          </LabelsProvider>
        </Frame>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };
