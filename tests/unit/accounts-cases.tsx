import type { ReactElement } from "react";
import {
  ApiKeyFields,
  ApiKeyForm,
  BalanceCard,
  ConsumptionView,
  HostedMigration,
  LinkedAccountUsage,
  MigrationReviewDetails,
  ObservationStatus,
  PrivateHistoryView,
  ProviderCard,
  ResetInventory,
  RoutingExplanation,
  RoutingPolicyForm,
  SynchronizedAccounts,
  SynchronizedConsumption,
  type HostedMigrationApi,
} from "../../packages/ai-ui/src/index";
import {
  BALANCE,
  BALANCE_UNREPORTED,
  CONSUMPTION_SNAPSHOTS,
  EMPTY_REPORT,
  GROK_PROVIDER,
  MIGRATION_REVIEW,
  NOUS_PROVIDER,
  PROVIDER_WITH_ERROR,
  REPORT,
  RESET_CREDITS,
  RESET_CREDITS_STALE,
  RESET_CREDITS_UNSUPPORTED,
  SYNCHRONIZED,
} from "../../stories/accounts-fixtures";

// One element per line of the family, with the props a product passes today and nothing else: this is the output 0.11 ships,
// frozen so that everything 0.12 adds can be proven additive.
export const hostedApi: HostedMigrationApi = {
  sessions: async () => ({ sessions: [] }),
  create: async () => ({ id: "invitation-ada-01", secret: "secret-ada-0000-1111", expiresAtMs: Date.parse("2026-03-12T10:00:00Z") }),
  status: async () => {
    throw new Error("not reached");
  },
  approve: async () => ({}),
  authorizations: async () => [],
  forget: async () => ({}),
  cancel: async () => ({}),
};

export const never: () => Promise<never> = () => new Promise<never>(() => {});

export const accountsCases: Array<{ id: string; element: ReactElement }> = [
  { id: "routing-explanation", element: <RoutingExplanation /> },
  {
    id: "routing-policy-form",
    element: <RoutingPolicyForm enabled={false} onSave={async () => {}} pending={false} provider="Grok" threshold={80} />,
  },
  {
    id: "routing-policy-form-pending",
    element: <RoutingPolicyForm enabled onSave={async () => {}} pending provider="Grok" threshold={80} />,
  },
  { id: "reset-inventory", element: <ResetInventory observation={RESET_CREDITS} /> },
  { id: "reset-inventory-stale", element: <ResetInventory observation={RESET_CREDITS_STALE} /> },
  { id: "reset-inventory-unsupported", element: <ResetInventory observation={RESET_CREDITS_UNSUPPORTED} /> },
  { id: "observation-status", element: <ObservationStatus observation={BALANCE} /> },
  { id: "observation-status-stale-error", element: <ObservationStatus observation={BALANCE_UNREPORTED} /> },
  { id: "balance-card", element: <BalanceCard observation={BALANCE} /> },
  { id: "balance-card-unreported", element: <BalanceCard observation={BALANCE_UNREPORTED} /> },
  { id: "provider-card", element: <ProviderCard provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} /> },
  { id: "provider-card-empty", element: <ProviderCard provider={NOUS_PROVIDER} /> },
  { id: "provider-card-error", element: <ProviderCard provider={PROVIDER_WITH_ERROR} /> },
  { id: "synchronized-accounts", element: <SynchronizedAccounts accounts={SYNCHRONIZED} /> },
  { id: "synchronized-accounts-linked", element: <SynchronizedAccounts accounts={SYNCHRONIZED} includeLinked /> },
  { id: "linked-account-usage", element: <LinkedAccountUsage accounts={SYNCHRONIZED} /> },
  { id: "synchronized-consumption", element: <SynchronizedConsumption load={async () => ({ snapshots: CONSUMPTION_SNAPSHOTS })} /> },
  { id: "consumption-view", element: <ConsumptionView report={REPORT} /> },
  { id: "consumption-view-empty", element: <ConsumptionView report={EMPTY_REPORT} /> },
  { id: "consumption-view-synchronized", element: <ConsumptionView report={REPORT} synchronized /> },
  { id: "private-history-view", element: <PrivateHistoryView description="Observations from your connected installations." fetchPage={never} /> },
  { id: "private-history-view-no-heading", element: <PrivateHistoryView description="" fetchPage={never} heading={false} /> },
  { id: "api-key-form", element: <ApiKeyForm onSave={async () => {}} /> },
  { id: "api-key-form-accounts", element: <ApiKeyForm accounts={[{ provider: "openai", alias: "ada-work" }]} onSave={async () => {}} /> },
  {
    id: "api-key-fields",
    element: <ApiKeyFields alias="ada-work" onAliasChange={() => {}} onProviderChange={() => {}} onSecretChange={() => {}} provider="openai" secret="sk-ada-0000" />,
  },
  { id: "api-key-fields-no-secret", element: <ApiKeyFields alias="" lockedIdentity onAliasChange={() => {}} onProviderChange={() => {}} provider="nous" /> },
  { id: "hosted-migration", element: <HostedMigration api={hostedApi} authorize={() => null} origin="https://relay.example.com" /> },
  { id: "hosted-migration-no-heading", element: <HostedMigration api={hostedApi} authorize={() => null} heading={false} origin="https://relay.example.com" /> },
  { id: "migration-review-details", element: <MigrationReviewDetails review={MIGRATION_REVIEW} /> },
];
