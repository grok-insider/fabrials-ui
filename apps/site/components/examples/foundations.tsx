"use client";

import { LocalTime } from "@fabrials/ui";
import type { ExampleSet } from "./types";

const SENT = "2026-09-27T07:31:00Z";
const NOW = new Date("2026-09-27T12:00:00Z");

const list = { display: "grid", gridTemplateColumns: "auto auto", gap: "var(--fui-space-1) var(--fui-space-5)", margin: 0 } as const;
const term = { color: "var(--muted-foreground)" } as const;

export const localTimeExamples: ExampleSet = {
  preview: () => (
    <dl style={list}>
      {(["time", "message", "dateTime", "date", "shortDate"] as const).map((format) => (
        <div key={format} style={{ display: "contents" }}>
          <dt style={term}>{format}</dt>
          <dd style={{ margin: 0 }}>
            <LocalTime format={format} locale="en" now={NOW} value={SENT} />
          </dd>
        </div>
      ))}
    </dl>
  ),
  previewCode: `import { LocalTime } from "@fabrials/ui";

export function MessageStamp({ sentAt }: { sentAt: string }) {
  return (
    <p>
      Ana replied <LocalTime value={sentAt} format="message" />
    </p>
  );
}`,
  examples: [
    {
      id: "formats",
      title: "Formats",
      description:
        "`time`, `message` (the time today, the date with it on another day, the year in another year), `dateTime`, `date` and `shortDate`.",
      code: `<LocalTime value={sentAt} format="time" />
<LocalTime value={sentAt} format="message" />
<LocalTime value={sentAt} format="dateTime" />
<LocalTime value={sentAt} format="date" />
<LocalTime value={sentAt} format="shortDate" />`,
      render: () => (
        <dl style={list}>
          {(["time", "message", "dateTime", "date", "shortDate"] as const).map((format) => (
            <div key={format} style={{ display: "contents" }}>
              <dt style={term}>{format}</dt>
              <dd style={{ margin: 0 }}>
                <LocalTime format={format} locale="en" now={NOW} value={SENT} />
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "fixed-zone",
      title: "A fixed zone",
      description:
        "With `timeZone` the text is the same on the server and in the browser, so it is rendered at once. Say the place, since it is not the reader's.",
      code: `<LocalTime value={startsAt} format="dateTime" timeZone="Europe/Madrid" locale="en-GB" /> in Madrid`,
      render: () => (
        <p style={{ margin: 0 }}>
          Doors open <LocalTime format="dateTime" locale="en-GB" timeZone="Europe/Madrid" value={SENT} /> in Madrid
        </p>
      ),
    },
    {
      id: "options",
      title: "Your own options",
      description: "`format` also takes `Intl.DateTimeFormat` options, and `locale` the language of the page.",
      code: `<LocalTime value={sentAt} format={{ weekday: "long", hour: "2-digit", minute: "2-digit" }} locale="es" />`,
      render: () => <LocalTime format={{ weekday: "long", hour: "2-digit", minute: "2-digit" }} locale="es" value={SENT} />,
    },
  ],
};
