import { plural } from "@fabrials/ui";
import type { ImportState, MigrationDirection } from "./contracts";

// Every word the accounts and usage family says, one object per component, the defaults in English. A host spreads one
// object to translate a screen; a label that interpolates or counts is a function so a language can put the parts in its
// own order. This module has no directive: a Server Component may read a default. Counts go through `plural` of `@fabrials/ui`.

export type AccountsHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type RoutingExplanationLabels = { text: string };
export const routingExplanationLabels: RoutingExplanationLabels = {
  text: "Autosteer selects an eligible account within the same provider. Pinned account routes keep their selected account. It does not switch models or providers.",
};

export type RoutingPolicyFormLabels = {
  /** The checkbox: the provider's name goes inside the sentence. */
  enable: (provider: string) => string;
  enabledHint: string;
  disabledHint: string;
  threshold: string;
  saving: string;
  save: string;
};
export const routingPolicyFormLabels: RoutingPolicyFormLabels = {
  enable: (provider) => `Enable ${provider} autosteer`,
  enabledHint:
    "The highest-ranked eligible account receives the next unpinned request.",
  disabledHint: "Unpinned requests use the active account.",
  threshold: "Skip accounts at quota usage (%)",
  saving: "Saving…",
  save: "Save routing preferences",
};

/** The two words `resetExpiryLabel` adds to a count of minutes or days. */
export type ResetExpiryLabels = {
  unavailable: string;
  pending: string;
  expired: string;
};

export type ResetInventoryLabels = {
  title: string;
  count: (available: number, lastReported: boolean) => string;
  unavailable: string;
  expiries: string;
  expiring: (count: number) => string;
  expired: string;
  stale: string;
  details: string;
  credit: (index: number) => string;
  expiryUnavailable: string;
  incomplete: string;
  expiry: ResetExpiryLabels;
  status: Partial<ObservationStatusLabels>;
};
export const resetInventoryLabels: ResetInventoryLabels = {
  title: "Limit reset credits",
  count: (available, lastReported) =>
    `${available} ${lastReported ? "last reported" : "available"}`,
  unavailable: "Unavailable",
  expiries: "Next reported reset credit expiries",
  expiring: (count) =>
    `${count} reset ${plural(count, { one: "credit expires within 24 hours.", other: "credits expire within 24 hours." })}`,
  expired:
    "A reported expiry has passed. Refresh inventory to check remaining credits.",
  stale: "Refresh inventory to check current availability.",
  details: "View expiry dates",
  credit: (index) => `Reset ${index}`,
  expiryUnavailable: "Expiry unavailable",
  incomplete: "Some expiry dates are unavailable.",
  expiry: {
    unavailable: "Expiry unavailable",
    pending: "…",
    expired: "Expired · refresh inventory",
  },
  status: {},
};

export type ObservationStatusLabels = {
  /** Before the time of a reading the provider has not confirmed since: "Last known reading · " keeps its space. */
  stale: string;
  updated: (time: string) => string;
};
export const observationStatusLabels: ObservationStatusLabels = {
  stale: "Last known reading · ",
  updated: (time) => `Updated ${time}`,
};

export type BalanceCardLabels = {
  title: string;
  available: string;
  notReported: string;
  subscription: string;
  purchased: string;
  status: Partial<ObservationStatusLabels>;
};
export const balanceCardLabels: BalanceCardLabels = {
  title: "Credit balance",
  available: "Available balance",
  notReported: "Not reported",
  subscription: "Subscription",
  purchased: "Purchased credits",
  status: {},
};

export type ProviderCardLabels = {
  connectedProvider: string;
  noQuota: string;
  /** The word before a date: "Resets 14 Mar, 10:00". */
  resets: string;
  /** A percentage, in the reader's digits when the host passed a `locale`. */
  percent: (value: number) => string;
  reset: Partial<ResetInventoryLabels>;
};
export const providerCardLabels: ProviderCardLabels = {
  connectedProvider: "Connected provider",
  noQuota: "No quota reported by this provider.",
  resets: "Resets",
  percent: (value) => `${Math.round(value)}%`,
  reset: {},
};

export type SynchronizedAccountsLabels = {
  region: string;
  title: string;
  description: string;
  verified: string;
  synchronized: string;
  installation: (device: string) => string;
  stale: string;
  localHistory: string;
  localHistoryDescription: string;
  estimate: (tokens: string, usd: string) => string;
  partial: string;
  dailyUsage: string;
  date: string;
  tokens: string;
  estimatedCost: string;
  provider: Partial<ProviderCardLabels>;
};
export const synchronizedAccountsLabels: SynchronizedAccountsLabels = {
  region: "Synchronized accounts",
  title: "Accounts from your machines",
  description:
    "Your synchronized usage. Authorize a provider on ai-relay to use it through the hosted proxy.",
  verified: "Verified identity match",
  synchronized: "Usage synchronized",
  installation: (device) => `Installation ${device}`,
  stale: "Last known reading · ",
  localHistory: "Local log history",
  localHistoryDescription:
    "These logs can contain several accounts and overlap relay requests. Totals are kept separate from relay traffic.",
  estimate: (tokens, usd) => `${tokens} tokens · ~$${usd} API list-price estimate`,
  partial: " (partial)",
  dailyUsage: "Daily usage",
  date: "Date",
  tokens: "Tokens",
  estimatedCost: "Estimated cost",
  provider: {},
};

export type LinkedAccountUsageLabels = {
  sources: (count: number) => string;
};
export const linkedAccountUsageLabels: LinkedAccountUsageLabels = {
  sources: (count) =>
    `Usage from ${count} local ${plural(count, { one: "source", other: "sources" })}`,
};

export type ConsumptionGroup =
  | "daily"
  | "period_totals"
  | "clients"
  | "models"
  | "sessions"
  | "projects";

export type ConsumptionViewLabels = {
  tokens: string;
  recordedBy: (incomplete: boolean) => string;
  knownCost: string;
  knownCostNote: (partial: boolean) => string;
  sourcesWithData: string;
  sourcesNote: string;
  breakdown: string;
  groupBy: string;
  groupOptions: Record<ConsumptionGroup, string>;
  /** The first column's heading per group. Its default is the group's own key, as 0.11 wrote it. */
  groupHeadings: Record<ConsumptionGroup, string>;
  requests: string;
  tokensColumn: string;
  knownCostColumn: string;
  partial: string;
  empty: string;
  sessionTotalsNote: string;
  sourceStatus: string;
  states: Record<ImportState, string>;
};
export const consumptionViewLabels: ConsumptionViewLabels = {
  tokens: "Tokens",
  recordedBy: (incomplete) =>
    `Recorded by your clients${incomplete ? " · token counts incomplete" : ""}`,
  knownCost: "Known cost",
  knownCostNote: (partial) =>
    partial
      ? "Partial · some data or prices are unavailable"
      : "Reported costs and list-price estimates",
  sourcesWithData: "Sources with data",
  sourcesNote: "Local consumption, separate from proxy traffic and quotas",
  breakdown: "Consumption breakdown",
  groupBy: "Group by",
  groupOptions: {
    daily: "Day",
    period_totals: "Session / account totals",
    clients: "Client",
    models: "Model",
    sessions: "Session",
    projects: "Project",
  },
  groupHeadings: {
    daily: "daily",
    period_totals: "period_totals",
    clients: "clients",
    models: "models",
    sessions: "sessions",
    projects: "projects",
  },
  requests: "Requests",
  tokensColumn: "Tokens",
  knownCostColumn: "Known cost",
  partial: " · partial",
  empty: "No recorded usage in this period.",
  sessionTotalsNote:
    "Some sources report session or account totals. See “Session / account totals”; these are not split into estimated daily activity.",
  sourceStatus: "Source status",
  states: {
    ready: "ready",
    no_activity: "no activity",
    no_data: "no data",
    needs_connection: "needs connection",
    unsupported_format: "unsupported format",
    partial: "partial",
    error: "error",
  },
};

export type ConsumptionViewLabelOverrides = Omit<
  Partial<ConsumptionViewLabels>,
  "groupOptions" | "groupHeadings" | "states"
> & {
  groupOptions?: Partial<Record<ConsumptionGroup, string>>;
  groupHeadings?: Partial<Record<ConsumptionGroup, string>>;
  states?: Partial<Record<ImportState, string>>;
};

export type SynchronizedConsumptionLabels = {
  title: string;
  description: string;
  refresh: string;
  loading: string;
  empty: string;
  device: string;
};
export const synchronizedConsumptionLabels: SynchronizedConsumptionLabels = {
  title: "Local consumption",
  description:
    "Private usage shared by your Spanreed installations. Devices are shown separately to avoid counting copied logs twice.",
  refresh: "Refresh consumption",
  loading: "Loading consumption…",
  empty:
    "No consumption synchronized yet. In Spanreed, enable private synchronization and select the clients you want to share.",
  device: "Device",
};

export type PrivateHistoryLabels = {
  title: string;
  region: string;
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  loadOlder: string;
  loadingOlder: string;
  /** The word before the installation's identifier: "machine 4f2a….", after the kind of reading. */
  machine: string;
  kinds: { quota: string; history: string; request: string };
  quotaPercent: (label: string, percent: string) => string;
  quotaOf: (used: string, limit: string) => string;
  quotaNotReported: string;
  quotaLine: (label: string, value: string) => string;
  historyLine: (label: string, amount: string, resets: string | null) => string;
  requestLine: (model: string, input: string, output: string) => string;
  unknownModel: string;
  zero: string;
};
export const privateHistoryLabels: PrivateHistoryLabels = {
  title: "Private history",
  region: "Private history",
  loading: "Loading private history…",
  emptyTitle: "No synchronized observations yet",
  emptyDescription:
    "Observations appear after a Spanreed installation shares quota or requests with this relay.",
  loadOlder: "Load older observations",
  loadingOlder: "Loading older observations…",
  machine: "machine",
  kinds: { quota: "Quota reading", history: "Limit sample", request: "Request" },
  quotaPercent: (label, percent) => `${label}: ${percent}%`,
  quotaOf: (used, limit) => `${used} of ${limit}`,
  quotaNotReported: "Quota not reported",
  quotaLine: (label, value) => `${label}: ${value}`,
  historyLine: (label, amount, resets) =>
    `${label}: ${amount}.${resets ? ` Resets ${resets}.` : ""}`,
  requestLine: (model, input, output) => `${model} · ${input} in · ${output} out`,
  unknownModel: "Unknown model",
  zero: "0",
};

export type ApiKeyFormLabels = {
  title: string;
  description: string;
  saving: string;
  save: string;
  saved: (provider: string, alias: string) => string;
};
export const apiKeyFormLabels: ApiKeyFormLabels = {
  title: "Connect with an API key",
  description:
    "Use an existing provider key. Requests use that provider’s API billing.",
  saving: "Saving…",
  save: "Save API key",
  saved: (provider, alias) =>
    `Saved ${provider}/${alias}. The key has not been verified with the provider.`,
};

export type ApiKeyFieldsLabels = {
  provider: string;
  account: string;
  secret: string;
};
export const apiKeyFieldsLabels: ApiKeyFieldsLabels = {
  provider: "Provider",
  account: "Account name",
  secret: "API key",
};

export type HostedMigrationLabels = {
  title: string;
  description: string;
  createRegion: string;
  direction: string;
  directions: Record<MigrationDirection, string>;
  sessionDirections: Record<MigrationDirection, string>;
  create: string;
  instructions: (expires: string) => string;
  hostedOrigin: string;
  sessionId: string;
  invitationSecret: string;
  invitationExpired: string;
  copySecret: string;
  secretNote: string;
  checkPairing: string;
  hideInvitation: string;
  sessionsRegion: string;
  sessions: string;
  refresh: string;
  receiptsNote: string;
  noSessions: string;
  selectedRegion: string;
  review: string;
  /** The words of the review the details block shows inside the selected session. */
  reviewLabels: Partial<MigrationReviewLabels>;
  sessionLabel: string;
  localInstallation: string;
  waitingForPairing: string;
  statusLabel: string;
  pairedNote: string;
  confirm: string;
  approve: string;
  approvedNote: string;
  completedNote: string;
  connected: (id: string) => string;
  expiredSession: string;
  forget: string;
  forgetQuestion: string;
  forgetYes: string;
  forgetNo: string;
  refreshSelected: string;
  cancel: string;
  updating: string;
  reviewUnavailable: string;
  phases: Record<string, string>;
};
export const hostedMigrationLabels: HostedMigrationLabels = {
  title: "Account migration",
  description:
    "Pair Spanreed with this relay. Review the destination and the selected accounts before you approve a transfer.",
  createRegion: "Create migration invitation",
  direction: "Direction",
  directions: {
    hostedToLocal: "ai-relay → Spanreed",
    localToHosted: "Spanreed → ai-relay",
  },
  sessionDirections: {
    hostedToLocal: "ai-relay to Spanreed",
    localToHosted: "Spanreed to ai-relay",
  },
  create: "Create invitation",
  instructions: (expires) =>
    `Enter these details in Spanreed, on Account migration. The invitation expires ${expires}. The secret stays on this page until you leave it.`,
  hostedOrigin: "Hosted origin",
  sessionId: "Session ID",
  invitationSecret: "Invitation secret",
  invitationExpired: "Invitation expired. Create another invitation.",
  copySecret: "Copy invitation secret",
  secretNote:
    "The secret is shown only in this page session. Copy it into Spanreed before closing this page.",
  checkPairing: "Check pairing",
  hideInvitation: "Hide invitation",
  sessionsRegion: "Migration sessions",
  sessions: "Sessions",
  refresh: "Refresh sessions",
  receiptsNote:
    "Completed receipts stay available for 30 days after the transfer window closes.",
  noSessions: "No migration sessions yet. Create an invitation to start one.",
  selectedRegion: "Selected migration",
  review: "Review transfer",
  reviewLabels: {},
  sessionLabel: "Session:",
  localInstallation: "Local installation:",
  waitingForPairing: "Waiting for pairing",
  statusLabel: "Status:",
  pairedNote:
    "Select accounts and create a review in Spanreed, then refresh this session.",
  confirm:
    "I recognize this installation and approve the exact accounts and destination above.",
  approve: "Approve review",
  approvedNote: "Approved. Confirm and execute the transfer in Spanreed.",
  completedNote:
    "API-key transfer completed. OAuth entries require independent authorization in the destination.",
  connected: (id) => `Connected ${id} with a new hosted authorization.`,
  expiredSession: "This session expired.",
  forget: "Forget receipt",
  forgetQuestion:
    "Remove this migration receipt from ai-relay? Imported accounts remain connected. The reviewed aliases will no longer be available here for pending OAuth logins.",
  forgetYes: "Forget this receipt",
  forgetNo: "Keep receipt",
  refreshSelected: "Refresh selected session",
  cancel: "Cancel migration",
  updating: "Updating migration…",
  reviewUnavailable: "Review unavailable. Refresh this session.",
  phases: {
    pairing: "Waiting to pair",
    paired: "Paired",
    reviewing: "Ready to review",
    approved: "Approved",
    completed: "Completed",
    cancelled: "Cancelled",
  },
};

export type MigrationReviewLabels = {
  region: string;
  from: string;
  to: string;
  copyApiKey: string;
  authorizeOAuth: string;
  note: string;
};
export const migrationReviewLabels: MigrationReviewLabels = {
  region: "Migration review",
  from: "From",
  to: "To",
  copyApiKey: "Copy API key. The imported account starts inactive.",
  authorizeOAuth:
    "Authorize a new OAuth connection in the destination. Existing tokens are never copied.",
  note: "Source accounts remain available. Imported accounts do not change your active account or routing.",
};

/** The words of a failure: a thrown error's own message, not "Error: " in front of it. */
export function accountsReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Class names without the empty ones, in the order they were given. */
export function accountsClasses(
  ...values: Array<string | false | null | undefined>
) {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");
}
