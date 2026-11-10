import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { accountsCases, hostedApi, never } from "./accounts-cases";
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
  apiKeyFieldsLabels,
  apiKeyFormLabels,
  balanceCardLabels,
  consumptionViewLabels,
  hostedMigrationLabels,
  linkedAccountUsageLabels,
  migrationReviewLabels,
  observationStatusLabels,
  privateHistoryLabels,
  providerCardLabels,
  resetInventoryLabels,
  routingExplanationLabels,
  routingPolicyFormLabels,
  synchronizedAccountsLabels,
  synchronizedConsumptionLabels,
} from "../../packages/ai-ui/src/index";
import { plural } from "../../packages/ui/src/plural";
import {
  BALANCE,
  EMPTY_REPORT,
  GROK_PROVIDER,
  MIGRATION_REVIEW,
  NOW,
  REPORT,
  RESET_CREDITS,
  SYNCHRONIZED,
} from "../../stories/accounts-fixtures";

// What 0.11 shipped for the accounts and usage family, frozen byte for byte. Every change of 0.12 is additive, so a default
// render that moves is a regression, not a new look: the files under __baselines__/accounts were written from the sources of
// 0.11 before any of it was touched. They were written in UTC, where `bun test` formats dates.
const directory = new URL("./__baselines__/accounts/", import.meta.url);
const CONSUMPTION_SOURCE = readFileSync(new URL("../../packages/ai-ui/src/consumption.tsx", import.meta.url), "utf8");

test("every piece of the family renders what 0.11 shipped, by default", () => {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, "UTC", "the baselines were written in UTC");
  const drifted: string[] = [];
  for (const item of accountsCases) {
    const expected = readFileSync(new URL(`${item.id}.html`, directory), "utf8").replace(/\n$/, "");
    const actual = renderToStaticMarkup(item.element);
    if (actual !== expected) drifted.push(item.id);
  }
  assert.deepEqual(drifted, []);
});

test("the baselines cover the sixteen exports, with the states their props allow", () => {
  const ids = accountsCases.map((item) => item.id);
  for (const name of [
    "routing-explanation",
    "routing-policy-form",
    "reset-inventory",
    "observation-status",
    "balance-card",
    "provider-card",
    "synchronized-accounts",
    "linked-account-usage",
    "synchronized-consumption",
    "consumption-view",
    "private-history-view",
    "api-key-form",
    "api-key-fields",
    "hosted-migration",
    "migration-review-details",
  ])
    assert.ok(ids.includes(name), `no baseline for ${name}`);
  // No orphan on disk either: a baseline nobody reads is a file that silently stops guarding anything.
  assert.deepEqual(
    readdirSync(directory).map((file) => file.replace(/\.html$/, "")).sort(),
    [...ids].sort(),
  );
});

test("a count chooses its form in the language it is told, English when it is not", () => {
  const forms = { one: "credit expires", other: "credits expire" };
  assert.equal(plural(1, forms), "credit expires");
  assert.equal(plural(0, forms), "credits expire");
  assert.equal(plural(2, forms), "credits expire");
  // French counts zero with the singular; Arabic has its own forms.
  assert.equal(plural(0, forms, "fr"), "credit expires");
  assert.equal(plural(2, forms, "fr"), "credits expire");
  assert.equal(plural(2, forms, ["ar"]), "credits expire");
});

// ---------------------------------------------------------------- the additions of 0.12

const CASE = (id: string) => accountsCases.find((item) => item.id === id)!.element;

test("a heading level a host asks for is the one it gets, and the headings inside follow it", () => {
  const html = (element: ReactElement) => renderToStaticMarkup(element);
  assert.match(html(CASE("provider-card")), /<h2>Grok<\/h2>/);
  assert.match(html(<ProviderCard headingLevel={4} provider={GROK_PROVIDER} />), /<h4>Grok<\/h4>/);
  assert.match(html(<SynchronizedAccounts headingLevel={3} accounts={SYNCHRONIZED} />), /<h3>Accounts from your machines<\/h3>/);
  assert.match(html(<SynchronizedAccounts accounts={SYNCHRONIZED} headingLevel={3} includeLinked />), /<h4>Local log history<\/h4>/);
  // Two by default, as 0.11 wrote the nested provider: a host that wants it under its own title says so.
  assert.match(html(<SynchronizedAccounts headingLevel={3} accounts={SYNCHRONIZED} includeLinked />), /<h2>Grok<\/h2>/);
  assert.match(html(<SynchronizedAccounts accounts={SYNCHRONIZED} includeLinked providerHeadingLevel={3} />), /<h3>Grok<\/h3>/);
  assert.match(html(<ConsumptionView headingLevel={3} report={EMPTY_REPORT} />), /<h3>Tokens<\/h3>/);
  assert.match(html(<PrivateHistoryView description="" fetchPage={never} headingLevel={3} />), /<h3>Private history<\/h3>/);
  assert.match(html(<ApiKeyForm onSave={async () => {}} headingLevel={4} />), /<h4>Connect with an API key<\/h4>/);
  const migration = <HostedMigration api={hostedApi} authorize={() => null} headingLevel={2} origin="https://relay.example.com" />;
  assert.match(html(migration), /<h2 class="fui-page-title">Account migration<\/h2>/);
  assert.match(html(migration), /<h3>Sessions<\/h3>/);
});

test("a class name and any other prop reach the root, merged with the piece's own", () => {
  const root = (element: ReactElement) => renderToStaticMarkup(element).slice(0, 260);
  for (const [id, own] of [
    ["routing-explanation", "fb-muted"],
    ["routing-policy-form", "fb-form"],
    ["reset-inventory", "fb-observation"],
    ["balance-card", "fb-observation"],
    ["provider-card", "fui-card fb-card-layout"],
    ["synchronized-accounts", "fb-synchronized-accounts"],
    ["linked-account-usage", "fb-linked-account-usage"],
    ["consumption-view", "fb-consumption"],
    ["synchronized-consumption", "fb-consumption"],
    ["private-history-view", "fb-history"],
    ["api-key-form", "fui-card fb-card-layout"],
    ["api-key-fields", "fb-form"],
    ["hosted-migration", "fb-form"],
    ["migration-review-details", "fb-form"],
  ] as const) {
    const html = root(clone(CASE(id), { className: "mine", "data-testid": "root" }));
    assert.match(html, new RegExp(`class="[^"]*${own}[^"]*mine`), `${id} does not merge the class name`);
    assert.match(html, /data-testid="root"/, `${id} drops the rest of the props`);
  }
  // The two that render several blocks keep their shape until a host has something to give them.
  assert.ok(renderToStaticMarkup(<ConsumptionView report={EMPTY_REPORT} />).startsWith('<div class="fb-grid">'));
  assert.ok(
    renderToStaticMarkup(<ConsumptionView className="mine" report={EMPTY_REPORT} />).startsWith(
      '<div class="fb-consumption mine"><div class="fb-grid">',
    ),
  );
});

test("a locale the host gives is the one every number and date is written in", () => {
  const html = (element: ReactElement) => renderToStaticMarkup(element);
  assert.match(html(<BalanceCard observation={BALANCE} />), /\$12\.34/);
  assert.match(html(<BalanceCard locale="es" observation={BALANCE} />), /12,34\sUS\$/);
  assert.match(html(<ObservationStatus observation={BALANCE} />), /Updated 08:55 AM/);
  assert.doesNotMatch(html(<ObservationStatus locale="es" observation={BALANCE} />), /AM/);
  assert.match(html(<ConsumptionView report={REPORT} />), />322,560</);
  assert.match(html(<ConsumptionView locale="es" report={REPORT} />), />322\.560</);
  assert.match(html(<ConsumptionView locale="es" report={REPORT} />), /2,56\sUS\$/);
  assert.match(html(<SynchronizedAccounts accounts={SYNCHRONIZED} includeLinked />), /293,260 tokens/);
  assert.match(html(<SynchronizedAccounts accounts={SYNCHRONIZED} includeLinked locale="es" />), /293\.260 tokens/);
  // Without one, nothing moves: a provider's reset date is still written in the reader's locale, as it always was.
  assert.match(html(<ProviderCard provider={GROK_PROVIDER} />), /3\/14\/2026/);
  assert.match(html(<ProviderCard locale="es" provider={GROK_PROVIDER} />), /14\/3\/2026/);
});

test("a clock the host gives replaces the one a server cannot read", () => {
  const withNow = renderToStaticMarkup(<ResetInventory now={NOW} observation={RESET_CREDITS} />);
  assert.match(withNow, /<strong>2 available<\/strong>/);
  assert.match(withNow, /3h 0m/);
  assert.match(withNow, /1 reset credit expires within 24 hours\./);
  // The server reads no clock: what it shows says so, which is what 0.11 shipped.
  const without = renderToStaticMarkup(<ResetInventory observation={RESET_CREDITS} />);
  assert.match(without, /<strong>2 last reported<\/strong>/);
  assert.match(without, />…</);
  assert.doesNotMatch(without, /expires within/);
  const two = renderToStaticMarkup(
    <ResetInventory
      now={NOW}
      observation={{
        ...RESET_CREDITS,
        value: {
          available: 2,
          detailsComplete: true,
          credits: [
            { validFromMs: null, expiresAtMs: NOW + 3_600_000 },
            { validFromMs: null, expiresAtMs: NOW + 7_200_000 },
          ],
        },
      }}
    />,
  );
  assert.match(two, /2 reset credits expire within 24 hours\./);
});

test("every word is a label: a marked set of labels leaves no English behind", () => {
  for (const [name, defaults, element] of labelRenders()) {
    const html = renderToStaticMarkup(element(marked(defaults)));
    // Only the words a person hears: the text, and the attributes a screen reader reads. Between the marks, so that a mark
    // named after its own word cannot hide a default, and never an option's `value`, which is data.
    const spoken = [
      html.replace(/<[^>]*>/g, " "),
      ...[...html.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]*)"/g)].map((match) => match[1]),
    ]
      .join(" | ")
      .replace(/«[^»]*»/g, "«»");
    const left = leaves(defaults).filter((text) => text.length > 3 && spoken.includes(text));
    assert.deepEqual(left, [], `${name} still says its default`);
    assert.match(html, /«/, `${name} renders nothing from the labels it was given`);
  }
});

test("the accounts rules are logical, the dead ones are gone, and forced colors has its own block", () => {
  const styles = readFileSync(new URL("../../packages/ai-ui/src/styles.css", import.meta.url), "utf8");
  const family = styles.slice(0, styles.indexOf("\n@layer utilities"));
  assert.doesNotMatch(family, /(^|[\s;{])(left|right|margin-(left|right)|padding-(left|right)|min-(width|height)|border-top)\s*:/);
  assert.doesNotMatch(family, /text-align:\s*(left|right)/);
  // A media query has no logical form: the breakpoints keep their own, and nothing else stays physical.
  assert.doesNotMatch(family.replace(/@media \(max-width: \d+px\)/g, "@media"), /(^|[\s;{])(max|min)-(width|height)\s*:/);
  for (const dead of [".fb-empty", ".fb-table-scroll", ".fb-source-selection"])
    assert.equal(family.includes(dead), false, `${dead} is still declared`);
  assert.match(family, /\.fb-table-wrap \{/);
  // A class a piece writes and the sheet never styles: listed, so nobody assumes it does something.
  assert.match(CONSUMPTION_SOURCE, /className="fb-table-layout"/);
  assert.equal(family.includes(".fb-table-layout"), false);
  const forced = styles.slice(styles.indexOf("the accounts and usage family in forced colors"));
  assert.match(forced, /@media \(forced-colors: active\)/);
  assert.match(forced, /\.fb-log-button:focus-visible \{\s*outline: 2px solid Highlight;/);
  assert.match(forced, /\.fb-reset-warning \{\s*border-inline-start-color: CanvasText;/);
  assert.doesNotMatch(forced, /#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(/);
});

// ---------------------------------------------------------------- helpers

function clone(element: ReactElement, props: Record<string, unknown>): ReactElement {
  return { ...(element as { props: Record<string, unknown> }), props: { ...element.props, ...props } } as unknown as ReactElement;
}

/** The defaults of a labels object, with every word replaced by a mark: what a host's translation does. */
function marked<T extends object>(defaults: T): T {
  return new Proxy(defaults, {
    get(target, property) {
      const value = (target as Record<PropertyKey, unknown>)[property];
      if (typeof property === "symbol") return value;
      if (typeof value === "function") return () => `«${String(property)}»`;
      if (value !== null && typeof value === "object") return marked(value as object);
      return `«${String(property)}»`;
    },
  }) as T;
}

/** Every default string inside a labels object, so a render can be checked against all of them at once. */
function leaves(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") found.push(value);
  else if (typeof value === "function")
    try {
      const text = (value as (...args: string[]) => unknown)("«a»", "«b»");
      if (typeof text === "string") found.push(text);
    } catch {
      // A label that needs a number says nothing with two words; the render check covers it.
    }
  else if (value !== null && typeof value === "object") for (const child of Object.values(value)) leaves(child, found);
  return found;
}

function labelRenders(): Array<[string, object, (labels: object) => ReactElement]> {
  return [
    ["RoutingExplanation", routingExplanationLabels, (labels) => <RoutingExplanation labels={labels as never} />],
    [
      "RoutingPolicyForm",
      routingPolicyFormLabels,
      (labels) => <RoutingPolicyForm enabled labels={labels as never} onSave={async () => {}} pending={false} provider="Grok" threshold={80} />,
    ],
    ["ResetInventory", resetInventoryLabels, (labels) => <ResetInventory labels={labels as never} now={NOW} observation={RESET_CREDITS} />],
    ["ObservationStatus", observationStatusLabels, (labels) => <ObservationStatus labels={labels as never} observation={BALANCE} />],
    ["BalanceCard", balanceCardLabels, (labels) => <BalanceCard labels={labels as never} observation={BALANCE} />],
    ["ProviderCard", providerCardLabels, (labels) => <ProviderCard labels={labels as never} provider={{ ...PROVIDER_WITH_ERROR_FOR_LABELS, resetInventory: RESET_CREDITS }} />],
    ["SynchronizedAccounts", synchronizedAccountsLabels, (labels) => <SynchronizedAccounts accounts={SYNCHRONIZED} labels={labels as never} />],
    ["LinkedAccountUsage", linkedAccountUsageLabels, (labels) => <LinkedAccountUsage accounts={SYNCHRONIZED} labels={labels as never} />],
    ["ConsumptionView", consumptionViewLabels, (labels) => <ConsumptionView labels={labels as never} report={REPORT} />],
    ["SynchronizedConsumption", synchronizedConsumptionLabels, (labels) => <SynchronizedConsumption labels={labels as never} load={async () => ({ snapshots: [] })} />],
    ["PrivateHistoryView", privateHistoryLabels, (labels) => <PrivateHistoryView description="" fetchPage={never} labels={labels as never} />],
    ["ApiKeyForm", apiKeyFormLabels, (labels) => <ApiKeyForm labels={labels as never} onSave={async () => {}} />],
    ["ApiKeyFields", apiKeyFieldsLabels, (labels) => <ApiKeyFields alias="" labels={labels as never} onAliasChange={() => {}} onProviderChange={() => {}} provider="openai" />],
    ["HostedMigration", hostedMigrationLabels, (labels) => <HostedMigration api={hostedApi} authorize={() => null} labels={labels as never} now={NOW} origin="https://relay.example.com" />],
    ["MigrationReviewDetails", migrationReviewLabels, (labels) => <MigrationReviewDetails labels={labels as never} review={MIGRATION_REVIEW} />],
  ];
}

const PROVIDER_WITH_ERROR_FOR_LABELS = {
  providerId: "grok",
  displayName: "Grok",
  plan: "SuperGrok",
  lines: [
    { type: "progress" as const, kind: "quota" as const, label: "Weekly limit", used: 42.4, limit: 100, format: { kind: "percent" as const }, resetsAt: "2026-03-14T17:00:00Z" },
    { type: "text" as const, kind: "error" as const, label: "Quota", value: "The provider did not answer." },
  ],
};
