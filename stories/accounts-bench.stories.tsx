import type { Meta, StoryObj } from "@storybook/react-vite";
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
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";
import { es, esProvider, esReset, esStatus } from "./accounts-es";
import {
  BALANCE,
  BALANCE_UNREPORTED,
  CONSUMPTION_SNAPSHOTS,
  EMPTY_REPORT,
  GROK_PROVIDER,
  MIGRATION_REVIEW,
  MIGRATION_SESSIONS,
  NOUS_PROVIDER,
  PRIVATE_PAGE,
  PROVIDER_WITH_ERROR,
  REPORT,
  RESET_CREDITS,
  RESET_CREDITS_STALE,
  SYNCHRONIZED,
} from "./accounts-fixtures";

// The accounts and usage family in fixed states: the clock is the one the suite fixes, so every time and count reads the same
// on every run. The Spanish frame and the right-to-left frame carry the same pieces.

const hostedApi: HostedMigrationApi = {
  sessions: async () => ({ sessions: MIGRATION_SESSIONS }),
  create: async () => ({
    id: "invitation-ada-01",
    secret: "secret-ada-0000-1111",
    expiresAtMs: Date.parse("2026-03-12T10:00:00Z"),
  }),
  status: async () => MIGRATION_SESSIONS[0]!,
  approve: async () => ({}),
  authorizations: async () => [],
  forget: async () => ({}),
  cancel: async () => ({}),
};

const snapshots = async () => ({ snapshots: CONSUMPTION_SNAPSHOTS });
const firstPage = async () => PRIVATE_PAGE;
const emptyPage = async () => ({ observations: [], before: null, has_more: false });
const noAnswer = () => new Promise<never>(() => {});
const fails = async () => {
  throw new Error("The relay did not answer. Try again in a minute.");
};
const refusesTheKey = async () => {
  throw new Error("The provider refused the key. Check it and try again.");
};

/** A device whose name is longer than the column that shows it. */
const LONG_ACCOUNT = [
  {
    ...SYNCHRONIZED[0]!,
    linked_account_id: null,
    device: "workstation-of-a-person-with-a-very-long-name-01",
    source: "grok-cli-from-a-workstation-with-a-name-that-has-to-wrap",
  },
];

function Bench() {
  return (
    <Page
      description="The accounts and usage pieces in fixed states: a provider with its quota, credits and balance, the routing preference, synchronized accounts, consumption, private history, an API key and a migration."
      title="Accounts and usage"
    >
      <Block title="A provider" description="Quota, plan and a falling reading, then a provider that reports nothing and one that failed.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <Frame>
            <ProviderCard provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} />
          </Frame>
          <Frame>
            <ProviderCard provider={NOUS_PROVIDER} />
          </Frame>
          <Frame>
            <ProviderCard provider={PROVIDER_WITH_ERROR} />
          </Frame>
        </div>
      </Block>
      <Block title="Credits, balance and how old the reading is" description="Two credits expiring, a stale reading, a balance the provider reports and one it does not.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <Frame>
            <ResetInventory now={Date.parse("2026-03-12T09:00:00Z")} observation={RESET_CREDITS} />
          </Frame>
          <Frame>
            <ResetInventory now={Date.parse("2026-03-12T09:00:00Z")} observation={RESET_CREDITS_STALE} />
          </Frame>
          <Frame>
            <BalanceCard observation={BALANCE} />
            <ObservationStatus observation={BALANCE} />
          </Frame>
          <Frame>
            <BalanceCard observation={BALANCE_UNREPORTED} />
          </Frame>
        </div>
      </Block>
      <Block title="Routing" description="The explanation, the preference off, on and saving.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <Frame>
            <RoutingExplanation />
            <RoutingPolicyForm enabled={false} onSave={async () => {}} pending={false} provider="Grok" threshold={80} />
          </Frame>
          <Frame>
            <RoutingPolicyForm enabled onSave={async () => {}} pending={false} provider="Grok" threshold={80} />
          </Frame>
          <Frame>
            <RoutingPolicyForm enabled onSave={async () => {}} pending provider="Grok" threshold={80} />
          </Frame>
        </div>
      </Block>
      <Block title="Accounts from your machines" description="The grid, then the linked account with its local log, then a name too long for its column.">
        <Frame>
          <SynchronizedAccounts accounts={SYNCHRONIZED} includeLinked />
        </Frame>
        <Frame width={520}>
          <LinkedAccountUsage accounts={SYNCHRONIZED} />
        </Frame>
        <SynchronizedAccounts accounts={LONG_ACCOUNT} />
      </Block>
      <Block title="Consumption" description="Reported, empty, and the synchronized view with its device picker.">
        <Frame width={720}>
          <ConsumptionView report={REPORT} />
        </Frame>
        <Frame width={720}>
          <ConsumptionView report={EMPTY_REPORT} synchronized />
        </Frame>
        <Frame width={720}>
          <SynchronizedConsumption load={snapshots} />
        </Frame>
        {/* A pane too narrow for the table: the region scrolls, and only then is it a tab stop. */}
        <div data-testid="narrow-table" lang="en" style={{ width: "230px" }}>
          <ConsumptionView report={REPORT} synchronized />
        </div>
      </Block>
      <Block title="Private history" description="A page with the three kinds of reading, an empty one, a failure, and the loading state a server shows.">
        <Frame width={640}>
          <PrivateHistoryView description="Observations from your connected installations." fetchPage={firstPage} />
        </Frame>
        <Frame width={640}>
          <PrivateHistoryView description="" fetchPage={emptyPage} heading={false} />
        </Frame>
        <Frame width={640}>
          <PrivateHistoryView description="" fetchPage={fails} heading={false} />
        </Frame>
        <Frame width={640}>
          <PrivateHistoryView description="" fetchPage={noAnswer} heading={false} />
        </Frame>
      </Block>
      <Block title="An API key" description="The form, and the fields it is made of, locked to an identity.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <Frame>
            <ApiKeyForm onSave={async () => {}} />
          </Frame>
          <Frame>
            <ApiKeyFields alias="ada-work" lockedIdentity onAliasChange={() => {}} onProviderChange={() => {}} provider="openai" />
          </Frame>
          <Frame>
            <ApiKeyForm onSave={refusesTheKey} />
          </Frame>
        </div>
      </Block>
      <Block title="A migration" description="The review with both kinds of entry, and the sessions with an identifier longer than its column.">
        <Frame width={560}>
          <MigrationReviewDetails review={MIGRATION_REVIEW} />
        </Frame>
        <Frame width={560}>
          <HostedMigration api={hostedApi} authorize={() => null} origin="https://relay.example.com" />
        </Frame>
      </Block>
      <Block title="En español" description="The same pieces with Spanish labels and locale=&quot;es&quot;: numbers, money, dates and every word follow.">
        <Frame width={1080}>
          <div lang="es" style={{ display: "grid", gap: "var(--fui-space-5)" }}>
            <RoutingExplanation labels={es.routingExplanation} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
              <ProviderCard labels={esProvider} locale="es" provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} />
              <ResetInventory labels={esReset} locale="es" now={Date.parse("2026-03-12T09:00:00Z")} observation={RESET_CREDITS} />
              <BalanceCard labels={{ ...es.balance, status: esStatus }} locale="es" observation={BALANCE} />
            </div>
            <ConsumptionView labels={es.consumption} locale="es" report={REPORT} />
            <SynchronizedAccounts labels={{ ...es.accounts, provider: esProvider }} locale="es" accounts={SYNCHRONIZED} headingLevel={3} />
            <LinkedAccountUsage accountsLabels={{ ...es.accounts, provider: esProvider }} labels={es.sources} locale="es" accounts={SYNCHRONIZED} />
            <ApiKeyForm fieldsLabels={es.apiKeyFields} labels={es.apiKeyForm} onSave={async () => {}} />
            <MigrationReviewDetails labels={es.review} review={MIGRATION_REVIEW} />
            <PrivateHistoryView description="" fetchPage={firstPage} labels={es.history} locale="es" heading={false} />
          </div>
        </Frame>
      </Block>
      <Block title="من اليمين إلى اليسار" description="The same pieces in a right-to-left frame: the rows, the dates and the labels mirror.">
        <Frame dir="rtl" width={1080}>
          <div lang="ar" style={{ display: "grid", gap: "var(--fui-space-5)" }}>
            <ProviderCard provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} />
            <ResetInventory now={Date.parse("2026-03-12T09:00:00Z")} observation={RESET_CREDITS} />
            <BalanceCard observation={BALANCE} />
            <ApiKeyFields alias="" onAliasChange={() => {}} onProviderChange={() => {}} provider="openai" />
            <MigrationReviewDetails review={MIGRATION_REVIEW} />
          </div>
        </Frame>
      </Block>
      <Block title="A host's own headings and classes" description="The provider inside a level-three outline, with the host's class name on its root.">
        <Frame width={420}>
          <ProviderCard className="host-card" headingLevel={3} provider={GROK_PROVIDER} />
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Accounts and usage",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
