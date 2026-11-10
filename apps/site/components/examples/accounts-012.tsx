"use client";

// Ways of using the accounts and usage family: what a provider reports, the credits that reset a limit, how old a reading
// is, the balance, and the consumption of the reader's own clients. Made-up providers, fixed dates, and text in Spanish to
// show that every word and every number takes the page's language.
import { useState, type ReactNode } from "react";
import {
  BalanceCard,
  ConsumptionView,
  ObservationStatus,
  ProviderCard,
  ResetInventory,
  type ConsumptionReport,
  type CreditBalance,
  type Observation,
  type ProviderOutput,
} from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";

const note = { margin: 0, color: "var(--muted-foreground)" } as const;

// Nothing below leaves the page, and every moment is fixed so a screenshot, a test and a server render agree.
export const NOW = Date.parse("2026-03-12T09:00:00Z");
const HOUR = 3_600_000;

const GROK: ProviderOutput = {
  providerId: "grok",
  displayName: "Grok",
  plan: "Studio plan",
  lines: [
    { type: "progress", kind: "quota", label: "Weekly limit", used: 42, limit: 100, format: { kind: "percent" } },
    { type: "progress", kind: "cost", label: "Monthly spend", used: 18.5, limit: 120, format: { kind: "dollars" } },
    { type: "text", kind: "plan", label: "Plan", value: "Studio plan", subtitle: "renewed monthly" },
  ],
};

const QUIET: ProviderOutput = { providerId: "nous", displayName: "Nous", lines: [] };

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

const REPORT: ConsumptionReport = {
  revision: 12,
  sources: [
    { source: "studio-ada-01", client: "studio-ada-01", state: "ready", last_success_ms: NOW - 4 * 60_000, revision: 12, records: 3, detail: null },
    { source: "studio-ada-02", client: "studio-ada-02", state: "partial", last_success_ms: NOW - 26 * HOUR, revision: 4, records: 1, detail: "One day could not be read." },
  ],
  total: { key: "total", tokens: 322_560, unknown_token_records: 1, known_usd: 2.56, partial: true, records: 61 },
  daily: [
    { key: "2026-03-10", tokens: 184_320, unknown_token_records: 0, known_usd: 1.42, partial: false, records: 41 },
    { key: "2026-03-11", tokens: 138_240, unknown_token_records: 1, known_usd: 1.14, partial: true, records: 20 },
  ],
  period_totals: [{ key: "studio-ada-01", tokens: 280_460, unknown_token_records: 0, known_usd: 2.2, partial: false, records: 47 }],
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

const NOTHING: ConsumptionReport = {
  revision: 0,
  sources: [],
  total: { key: "total", tokens: 0, unknown_token_records: 0, known_usd: 0, partial: false, records: 0 },
  daily: [],
  period_totals: [],
  clients: [],
  models: [],
  sessions: [],
  projects: [],
};

// The words of one screen in Spanish, spread over the English defaults: a product translates the object, not every string.
const esReset = {
  title: "Créditos de reinicio",
  count: (available: number, lastReported: boolean) => `${available} ${lastReported ? "de la última lectura" : "disponibles"}`,
  unavailable: "No disponible",
  expiries: "Próximos reinicios notificados",
  expiring: (count: number) => `${count} crédito de reinicio caduca en 24 horas.`,
  expired: "Un reinicio notificado ya pasó. Actualiza el inventario para ver los créditos que quedan.",
  stale: "Actualiza el inventario para ver la disponibilidad actual.",
  details: "Ver fechas de caducidad",
  credit: (index: number) => `Reinicio ${index}`,
  expiryUnavailable: "Caducidad no disponible",
  incomplete: "Algunas fechas de caducidad no están disponibles.",
  expiry: { unavailable: "Caducidad no disponible", pending: "…", expired: "Caducado · actualiza el inventario" },
  status: { stale: "Última lectura conocida · ", updated: (time: string) => `Actualizado ${time}` },
};

const esProvider = {
  connectedProvider: "Proveedor conectado",
  noQuota: "Este proveedor no informa de cuota.",
  resets: "Se reinicia",
  percent: (value: number) => `${Math.round(value)} %`,
  count: (value: string, suffix: string) => (suffix ? `${value} ${suffix}` : value),
  reset: esReset,
};

function Plate({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%" }}>{children}</div>;
}

export const providerCardExamples: ExampleSet = {
  examples: [
    {
      id: "a-provider",
      title: "What a provider reports",
      description:
        "A quota, a spend and a plan line, each in the shape the provider gave it. A provider that reports nothing says so instead of showing an empty bar.",
      code: `import { ProviderCard } from "@fabrials/ai-ui";

<ProviderCard locale="en" provider={provider} />;`,
      render: () => (
        <Plate>
          <ProviderCard locale="en" provider={GROK} timeZone="UTC" />
          <ProviderCard locale="en" provider={QUIET} timeZone="UTC" />
        </Plate>
      ),
      align: "start",
    },
    {
      id: "credits",
      title: "With the credits that reset a limit",
      description:
        "The inventory counts what is left, lists the expiries it was told about and says when one expires within a day. now fixes the moment it counts from.",
      code: `import { ProviderCard } from "@fabrials/ai-ui";

<ProviderCard
  locale="en"
  provider={{ ...provider, resetInventory: credits }}
/>;`,
      render: () => (
        <Plate>
          <ProviderCard locale="en" provider={{ ...GROK, resetInventory: CREDITS }} timeZone="UTC" />
        </Plate>
      ),
      align: "start",
    },
    {
      id: "stale",
      title: "A reading that has gone stale",
      description:
        "A stale reading is said to be stale, with the balance beside it and the hour the provider last answered, rather than passed off as fresh.",
      code: `import { BalanceCard, ObservationStatus, ResetInventory } from "@fabrials/ai-ui";

<ResetInventory locale="en" now={now} observation={staleCredits} />;
<BalanceCard locale="en" observation={balance} />;
<ObservationStatus locale="en" observation={balance} />;`,
      render: () => (
        <Plate>
          <ResetInventory locale="en" now={NOW} observation={CREDITS_STALE} timeZone="UTC" />
          <BalanceCard locale="en" observation={BALANCE} timeZone="UTC" />
          <ObservationStatus locale="en" observation={BALANCE} timeZone="UTC" />
        </Plate>
      ),
      align: "start",
    },
    {
      id: "spanish",
      title: "In Spanish, through labels and locale",
      description:
        "labels carries every visible word and locale every number: the percentage, the money and the dates all follow, and a language can put the parts of a sentence in its own order.",
      code: `<ProviderCard
  labels={{
    connectedProvider: "Proveedor conectado",
    percent: (value) => \`\${Math.round(value)} %\`,
    // …
  }}
  locale="es"
  provider={provider}
/>;`,
      render: () => (
        <div lang="es" style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%" }}>
          <Plate>
            <ProviderCard labels={esProvider} locale="es" provider={{ ...GROK, resetInventory: CREDITS }} timeZone="UTC" />
          </Plate>
          <p style={note}>Los mismos datos, en español: «Créditos de reinicio», «42 %» y las fechas de la tabla.</p>
        </div>
      ),
      align: "start",
    },
  ],
};

function Groupings() {
  const [synchronized, setSynchronized] = useState(false);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%" }}>
      <ConsumptionView labels={GROUP_HEADINGS} locale="en" report={REPORT} synchronized={synchronized} />
      <p style={note}>
        <button onClick={() => setSynchronized((value) => !value)} style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }} type="button">
          {synchronized ? "Read by many installations" : "Read by one installation"}
        </button>{" "}
        — the grouping list loses the sessions and the projects a single source cannot answer.
      </p>
    </div>
  );
}

export const consumptionViewExamples: ExampleSet = {
  examples: [
    {
      id: "day",
      title: "Grouped by day",
      description:
        "The default grouping: what was spent each day, with the session totals counted apart and said so, because a source that reports a session cannot be split into days.",
      code: `import { ConsumptionView } from "@fabrials/ai-ui";

<ConsumptionView locale="en" report={report} />;`,
      render: () => (
        <Plate>
          <ConsumptionView labels={GROUP_HEADINGS} locale="en" report={REPORT} />
        </Plate>
      ),
      align: "start",
    },
    {
      id: "client",
      title: "Grouped by client, model or session",
      description:
        "The same report by another key: the grouping is chosen in the select at the corner of the breakdown, and the column heading changes with it.",
      code: `// The same report; the reader picks the grouping in the breakdown's own select.
<ConsumptionView
  labels={{ breakdown: "Where it went", groupBy: "Group by" }}
  locale="en"
  report={report}
/>;`,
      render: () => <Groupings />,
      align: "start",
    },
    {
      id: "empty",
      title: "Nothing recorded yet",
      description:
        "A report with no rows says there is no recorded usage in the period instead of drawing an empty table, and the totals stay at zero.",
      code: `<ConsumptionView locale="en" report={{ ...report, daily: [], total: zero }} />;`,
      render: () => (
        <Plate>
          <ConsumptionView labels={GROUP_HEADINGS} locale="en" report={NOTHING} />
        </Plate>
      ),
      align: "start",
    },
  ],
};
