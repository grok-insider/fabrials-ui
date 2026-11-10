import type {
  CreditBalance,
  LocalUsageSnapshotV2,
  MigrationInvitation,
  MigrationReview,
  MigrationSessionView,
  Observation,
  PrivateRecentPage,
  ProviderOutput,
  ResetInventory,
  SynchronizedAccount,
} from "../packages/ai-ui/src/contracts";

// Synthetic data for the accounts and usage family: a made-up workstation, a made-up relay and numbers nobody earned. Every
// date is fixed so a test, a story and a screenshot read the same on every run.

export const NOW = Date.parse("2026-03-12T09:00:00Z");
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const GROK_PROVIDER: ProviderOutput = {
  providerId: "grok",
  displayName: "Grok",
  plan: "SuperGrok",
  lines: [
    {
      type: "progress",
      kind: "quota",
      label: "Weekly limit",
      used: 42.4,
      limit: 100,
      format: { kind: "percent" },
      resetsAt: new Date(NOW + 2 * DAY).toISOString(),
    },
    { type: "text", kind: "plan", label: "Plan", value: "SuperGrok", subtitle: "renewed monthly" },
    { type: "badge", kind: "cache", label: "Cache", text: "warm" },
    { type: "barChart", kind: "trend", label: "Last seven days", points: [{ label: "Mon", value: 4 }], note: "requests" },
  ],
};

export const NOUS_PROVIDER: ProviderOutput = {
  providerId: "nous",
  displayName: "Nous",
  lines: [],
};

export const PROVIDER_WITH_ERROR: ProviderOutput = {
  providerId: "codex",
  displayName: "Codex",
  plan: "Team",
  lines: [
    { type: "text", kind: "error", label: "Quota", value: "The provider did not answer. Try again in a minute." },
    { type: "progress", kind: "cost", label: "Monthly spend", used: 18.5, limit: 120, format: { kind: "dollars" } },
  ],
};

export const RESET_CREDITS: Observation<ResetInventory> = {
  availability: "available",
  freshness: "fresh",
  observedAtMs: NOW - 2 * MINUTE,
  source: "gateway",
  error: null,
  value: {
    available: 2,
    detailsComplete: false,
    credits: [
      { validFromMs: null, expiresAtMs: NOW + 3 * HOUR },
      { validFromMs: NOW - HOUR, expiresAtMs: NOW + 30 * HOUR },
      { validFromMs: null, expiresAtMs: null },
    ],
  },
};

export const RESET_CREDITS_STALE: Observation<ResetInventory> = {
  ...RESET_CREDITS,
  freshness: "stale",
  observedAtMs: NOW - 3 * HOUR,
};

export const RESET_CREDITS_UNSUPPORTED: Observation<ResetInventory> = {
  ...RESET_CREDITS,
  availability: "unsupported",
  value: null,
};

export const BALANCE: Observation<CreditBalance> = {
  availability: "available",
  freshness: "fresh",
  observedAtMs: NOW - 5 * MINUTE,
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

export const BALANCE_UNREPORTED: Observation<CreditBalance> = {
  ...BALANCE,
  value: {
    remainingUsd: null,
    subscriptionRemainingUsd: null,
    subscriptionLimitUsd: null,
    purchasedRemainingUsd: null,
    paidAccess: null,
  },
  error: "The provider reports no balance for this account.",
};

export const SYNCHRONIZED: Array<SynchronizedAccount> = [
  {
    linked_account_id: "linked-ada",
    device: "workstation-ada-01",
    source: "grok-cli",
    observed_at_ms: NOW - 4 * MINUTE,
    output: GROK_PROVIDER,
    local_usage: {
      device: "workstation-ada-01",
      source: "grok-cli",
      observed_at_ms: NOW - 4 * MINUTE,
      partial: true,
      days: [
        { date: "2026-03-10", tokens: 184_320, estimated_usd: 1.42 },
        { date: "2026-03-11", tokens: 96_140, estimated_usd: 0.78 },
        { date: "2026-03-12", tokens: 12_800, estimated_usd: 0.11 },
      ],
    },
  },
  {
    linked_account_id: null,
    device: "laptop-ada-02",
    source: "codex-cli",
    observed_at_ms: NOW - 26 * HOUR,
    output: NOUS_PROVIDER,
    local_usage: null,
  },
];

export const CONSUMPTION_SNAPSHOTS: Array<LocalUsageSnapshotV2> = [
  {
    device: "workstation-ada-01",
    source: "grok-cli",
    revision: 12,
    observed_at_ms: NOW - 4 * MINUTE,
    partial: false,
    days: [
      { date: "2026-03-10", tokens: 184_320, estimated_usd: 1.42 },
      { date: "2026-03-11", tokens: 96_140, estimated_usd: 0.78 },
    ],
    period_totals: { tokens: 280_460, known_usd: 2.2, partial: false },
    models: [
      { model: "grok-4.7-fast", requests: 41, tokens: 240_000, estimated_usd: 1.9 },
      { model: "grok-4.7", requests: 6, tokens: 40_460, estimated_usd: 0.3 },
    ],
  },
  {
    device: "laptop-ada-02",
    source: "codex-cli",
    revision: 4,
    observed_at_ms: NOW - 26 * HOUR,
    partial: true,
    days: [{ date: "2026-03-11", tokens: 42_100, estimated_usd: 0.36 }],
    period_totals: null,
    models: [{ model: "gpt-6-sol", requests: 12, tokens: 42_100, estimated_usd: 0.36 }],
  },
];

export const PRIVATE_PAGE: PrivateRecentPage = {
  before: 3,
  has_more: true,
  observations: [
    {
      cursor: 3,
      device: "workstation-ada-01",
      observation: {
        source: "grok-cli",
        event: { kind: "quota", at_ms: NOW - 4 * MINUTE, output: GROK_PROVIDER },
      },
    },
    {
      cursor: 2,
      device: "laptop-ada-02",
      observation: {
        source: "codex-cli",
        event: {
          kind: "history",
          sample: {
            ts_ms: NOW - 40 * MINUTE,
            provider: "grok",
            plan: "SuperGrok",
            label: "Weekly limit",
            used: 42,
            limit: 100,
            resets_at: new Date(NOW + 2 * DAY).toISOString(),
            window_start_ms: NOW - 5 * DAY,
            limit_window_secs: 604_800,
            kind: "quota",
          },
        },
      },
    },
    {
      cursor: 1,
      device: "workstation-ada-01",
      observation: {
        source: "grok-cli",
        event: {
          kind: "request",
          record: {
            ts_ms: NOW - 2 * HOUR,
            session_id: "session-ada",
            model: "grok-4.7-fast",
            input_tokens: 12_480,
            output_tokens: 940,
            cached_input_tokens: 8_000,
            reasoning_tokens: 120,
            total_tokens: 13_420,
            cost_usd_ticks: 0,
            route: "grok",
            kind: "chat",
          },
        },
      },
    },
  ],
};

export const MIGRATION_REVIEW: MigrationReview = {
  sourceEnvironment: "spanreed@workstation-ada-01",
  destinationEnvironment: "https://relay.example.com",
  items: [
    {
      sourceId: "account-ada-01",
      sourceGeneration: "grok-cli@0.7.2",
      provider: "grok",
      targetAlias: "ada-work",
      action: "copyApiKey",
    },
    {
      sourceId: "account-ada-02",
      sourceGeneration: "codex-cli@0.6.0",
      provider: "codex",
      targetAlias: "ada-codex",
      action: "authorizeOAuth",
    },
  ],
};

export const MIGRATION_SESSIONS: Array<MigrationSessionView> = [
  {
    id: "migration-ada-review",
    ownerId: "owner-ada",
    direction: "hostedToLocal",
    hostedEnvironment: "https://relay.example.com",
    localEnvironment: "spanreed@workstation-ada-01",
    phase: "reviewing",
    review: MIGRATION_REVIEW,
    revision: "rev-7",
    expiresAtMs: NOW + 6 * HOUR,
  },
  {
    id: "migration-ada-consumer-with-a-long-identifier",
    ownerId: "owner-ada",
    direction: "localToHosted",
    hostedEnvironment: "https://relay.example.com",
    localEnvironment: null,
    phase: "pairing",
    review: null,
    revision: null,
    expiresAtMs: NOW + 30 * MINUTE,
  },
];

export const MIGRATION_INVITATION: MigrationInvitation = {
  id: "invitation-ada-01",
  secret: "secret-ada-0000-1111",
  expiresAtMs: NOW + HOUR,
};

export const REPORT = (() => {
  const total = {
    key: "total",
    tokens: 322_560,
    unknown_token_records: 1,
    known_usd: 2.56,
    partial: true,
    records: 61,
  };
  return {
    revision: 12,
    sources: [
      { source: "workstation-ada-01", client: "workstation-ada-01", state: "ready" as const, last_success_ms: NOW - 4 * MINUTE, revision: 12, records: 3, detail: null },
      { source: "laptop-ada-02", client: "laptop-ada-02", state: "partial" as const, last_success_ms: NOW - 26 * HOUR, revision: 4, records: 1, detail: "One day could not be read." },
      { source: "server-ada-03", client: "server-ada-03", state: "needs_connection" as const, last_success_ms: null, revision: 0, records: 0, detail: null },
    ],
    total,
    daily: [
      { key: "2026-03-10", tokens: 184_320, unknown_token_records: 0, known_usd: 1.42, partial: false, records: 41 },
      { key: "2026-03-11", tokens: 138_240, unknown_token_records: 1, known_usd: 1.14, partial: true, records: 20 },
    ],
    period_totals: [
      { key: "workstation-ada-01", tokens: 280_460, unknown_token_records: 0, known_usd: 2.2, partial: false, records: 47 },
      { key: "laptop-ada-02", tokens: 42_100, unknown_token_records: 1, known_usd: 0.36, partial: true, records: 12 },
    ],
    clients: [
      { key: "workstation-ada-01", tokens: 280_460, unknown_token_records: 0, known_usd: 2.2, partial: false, records: 47 },
      { key: "laptop-ada-02", tokens: 42_100, unknown_token_records: 1, known_usd: 0.36, partial: true, records: 12 },
    ],
    models: [
      { key: "grok-4.7-fast", tokens: 240_000, unknown_token_records: 0, known_usd: 1.9, partial: false, records: 41 },
      { key: "gpt-6-sol", tokens: 82_560, unknown_token_records: 1, known_usd: 0.66, partial: true, records: 20 },
    ],
    sessions: [{ key: "session-ada", tokens: 12_480, unknown_token_records: 0, known_usd: 0.11, partial: false, records: 3 }],
    projects: [{ key: "palanaeum", tokens: 96_140, unknown_token_records: 0, known_usd: 0.78, partial: false, records: 18 }],
    records: [],
    records_truncated: false,
  };
})();

export const EMPTY_REPORT = {
  revision: 0,
  sources: [],
  total: { key: "total", tokens: 0, unknown_token_records: 0, known_usd: 0, partial: false, records: 0 },
  daily: [],
  period_totals: [],
  clients: [],
  models: [],
  sessions: [],
  projects: [],
  records: [],
  records_truncated: false,
};
