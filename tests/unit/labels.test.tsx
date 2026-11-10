import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calendar,
  CodePanel,
  CodeTabs,
  CopyButton,
  DatePicker,
  DateRangePicker,
  ErrorBoundaryFallback,
  FilterChip,
  LabelsProvider,
  Meter,
  MultiSelect,
  NumberTicker,
  PackageInstall,
  RelativeTime,
  RepoInfo,
  SeriesChart,
  Snippet,
  Spreadsheet,
  Table,
  ThemeSwitcher,
  firstDayOfWeek,
  formatCount,
  groupByRecency,
  localeTag,
  plural,
  recencyGroupFor,
  useLabels,
  useLocale,
  useProvidedLocale,
  type FabrialsLabels,
  type PluralForms,
} from "../../packages/ui/src/index";
import {
  AgentThinking,
  AttachmentChip,
  Attachments,
  CitationChip,
  CodeBlock,
  ContextMeter,
  GenerationFrame,
  ReasoningDisclosure,
  SearchStepList,
  SearchStepsDisclosure,
  SourceCard,
  SourceTally,
  Sources,
  TaskList,
  attachmentDetail,
  searchDoneLabel,
  searchLabel,
  searchStepLabel,
  sourcesLabel,
  type AttachmentItem,
  type SearchStep,
} from "../../packages/ai-ui/src/index";
import { formatPercent } from "../../packages/ai-ui/src/format";

const decode = (html: string) => html.replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");

/** Everything a person reads or hears in a piece of markup: its text and the attributes that carry words. */
function words(html: string): string {
  const out: string[] = [];
  for (const match of html.matchAll(/>([^<]+)</g)) out.push(match[1]!);
  for (const match of html.matchAll(/\s(?:aria-label|aria-valuetext|aria-roledescription|title|alt|placeholder)="([^"]*)"/g)) out.push(match[1]!);
  return decode(out.join("\n"));
}

const render = (node: ReactNode) => renderToStaticMarkup(node);

/**
 * A component's words three ways. With nothing given, every English default is there. With `labels`, every translation is
 * there and no English default is left. A `LabelsProvider` given the same words under the component's scope draws the same
 * markup as the prop.
 */
function translates<L extends object>(options: {
  scope: keyof FabrialsLabels;
  labels: L;
  english: string[];
  translated: string[];
  draw: (labels?: L) => ReactElement;
  /** Words that are the host's own in this drawing (a file's name that happens to contain a default). */
  locale?: string;
}) {
  const plain = words(render(options.draw()));
  for (const word of options.english) assert.ok(plain.includes(word), `default "${word}" missing in: ${plain}`);
  const own = render(options.draw(options.labels));
  const spoken = words(own);
  for (const word of options.translated) assert.ok(spoken.includes(word), `translation "${word}" missing in: ${spoken}`);
  for (const word of options.english) assert.ok(!spoken.includes(word), `default "${word}" survives the labels prop in: ${spoken}`);
  const provided = render(
    <LabelsProvider labels={{ [options.scope]: options.labels } as FabrialsLabels} locale={options.locale}>
      {options.draw()}
    </LabelsProvider>,
  );
  const heard = words(provided);
  for (const word of options.translated) assert.ok(heard.includes(word), `translation "${word}" missing under the provider in: ${heard}`);
  for (const word of options.english) assert.ok(!heard.includes(word), `default "${word}" survives the provider in: ${heard}`);
}

/* ------------------------------------------------------------------ plural */

const AR: PluralForms = { zero: "لا مصادر", one: "مصدر واحد", two: "مصدران", few: "{count} مصادر", many: "{count} مصدرًا", other: "{count} مصدر" };

test("plural picks the form the locale's rules pick and writes the count in the locale's digits", () => {
  const en = { one: "{count} source", other: "{count} sources" };
  assert.equal(plural(0, en), "0 sources");
  assert.equal(plural(1, en), "1 source");
  assert.equal(plural(2, en), "2 sources");
  assert.equal(plural(1204, en), "1,204 sources");
  assert.equal(plural(1, en, "en"), "1 source");

  const es = { one: "{count} fuente", other: "{count} fuentes" };
  assert.equal(plural(1, es, "es"), "1 fuente");
  assert.equal(plural(0, es, "es"), "0 fuentes");
  assert.equal(plural(12480, es, "es"), "12.480 fuentes");

  // French counts 0 and 1 as one, and 1.5 too.
  const fr = { one: "{count} source", other: "{count} sources" };
  assert.equal(plural(0, fr, "fr"), "0 source");
  assert.equal(plural(1, fr, "fr"), "1 source");
  assert.equal(plural(1.5, fr, "fr"), "1,5 source");
  assert.equal(plural(2, fr, "fr"), "2 sources");
});

test("plural in Arabic uses all six categories", () => {
  const latin = "ar-u-nu-latn";
  assert.equal(plural(0, AR, latin), "لا مصادر");
  assert.equal(plural(1, AR, latin), "مصدر واحد");
  assert.equal(plural(2, AR, latin), "مصدران");
  assert.equal(plural(3, AR, latin), "3 مصادر");
  assert.equal(plural(10, AR, latin), "10 مصادر");
  assert.equal(plural(11, AR, latin), "11 مصدرًا");
  assert.equal(plural(99, AR, latin), "99 مصدرًا");
  assert.equal(plural(100, AR, latin), "100 مصدر");
  assert.equal(plural(102, AR, latin), "102 مصدر");
  assert.equal(plural(103, AR, latin), "103 مصادر");
  // The count takes the locale's own digits.
  assert.equal(plural(3, AR, "ar-EG"), "٣ مصادر");
});

test("a missing category falls back to other, and every {count} is replaced", () => {
  assert.equal(plural(0, { other: "{count} مصدر" }, "ar-u-nu-latn"), "0 مصدر");
  assert.equal(plural(1, { other: "{count} items" }), "1 items");
  assert.equal(plural(2, { one: "one", other: "{count} of {count}" }), "2 of 2");
  assert.equal(plural(2, { zero: "none", two: "a pair", other: "{count}" }, "en"), "2", "English never selects two");
  assert.equal(plural(0, { zero: "none", other: "{count}" }, "en"), "0", "English never selects zero");
  assert.equal(plural(5, { other: "plenty" }), "plenty");
});

test("formatCount groups by locale, and localeTag gives one tag", () => {
  assert.equal(formatCount(1204), "1,204");
  assert.equal(formatCount(12480, "es"), "12.480");
  assert.equal(formatCount(1204, "ar-EG"), "١٬٢٠٤");
  assert.equal(formatCount(1204, ["de", "en"]), "1.204");
  assert.equal(localeTag(), "en");
  assert.equal(localeTag("es-MX"), "es-MX");
  assert.equal(localeTag(new Intl.Locale("fr-CA")), "fr-CA");
  assert.equal(localeTag(["ja", "en"]), "ja");
  assert.equal(localeTag([]), "en");
});

/* --------------------------------------------------------------- useLabels */

type ProbeLabels = { a: string; b: string; c: string };
const PROBE: ProbeLabels = { a: "default a", b: "default b", c: "default c" };
const seen: ProbeLabels[] = [];

function Probe({ labels }: { labels?: Partial<ProbeLabels> }) {
  // The probe borrows a real scope: the registry is typed, and a scope is only a key.
  const text = useLabels("table" as keyof FabrialsLabels, PROBE, labels);
  seen.push(text);
  return <i>{`${text.a}|${text.b}|${text.c}`}</i>;
}

const scope = (labels: Partial<ProbeLabels>) => ({ table: labels }) as unknown as FabrialsLabels;

test("useLabels: the default, then the provider, then the component's own", () => {
  assert.equal(render(<Probe />), "<i>default a|default b|default c</i>");
  assert.equal(
    render(
      <LabelsProvider labels={scope({ a: "provider a", b: "provider b" })}>
        <Probe labels={{ a: "own a" }} />
      </LabelsProvider>,
    ),
    "<i>own a|provider b|default c</i>",
  );
  // A key given as undefined is not given: it never hides the layer below.
  assert.equal(
    render(
      <LabelsProvider labels={scope({ a: "provider a", b: undefined })}>
        <Probe labels={{ a: undefined, c: "own c" }} />
      </LabelsProvider>,
    ),
    "<i>provider a|default b|own c</i>",
  );
  // Another scope's words do not leak in.
  assert.equal(
    render(
      <LabelsProvider labels={{ chart: { only: "Solo" } }}>
        <Probe />
      </LabelsProvider>,
    ),
    "<i>default a|default b|default c</i>",
  );
});

test("useLabels returns the defaults themselves when nothing is given", () => {
  seen.length = 0;
  render(<Probe />);
  assert.equal(seen[0], PROBE);
});

test("nested providers merge by scope and by key; the inner one wins", () => {
  assert.equal(
    render(
      <LabelsProvider labels={scope({ a: "outer a", b: "outer b" })}>
        <LabelsProvider labels={scope({ b: "inner b" })}>
          <Probe />
        </LabelsProvider>
      </LabelsProvider>,
    ),
    "<i>outer a|inner b|default c</i>",
  );
  // An inner provider that says nothing about a scope leaves it alone.
  assert.equal(
    render(
      <LabelsProvider labels={scope({ a: "outer a" })}>
        <LabelsProvider labels={{ chart: { only: "Solo" } }} locale="es">
          <Probe />
        </LabelsProvider>
      </LabelsProvider>,
    ),
    "<i>outer a|default b|default c</i>",
  );
});

function LocaleProbe({ locale }: { locale?: Intl.LocalesArgument }) {
  return <i>{`${String(useLocale(locale))}|${String(useProvidedLocale(locale))}`}</i>;
}

test("useLocale: the component's own, then the provider's, then en", () => {
  assert.equal(render(<LocaleProbe />), "<i>en|undefined</i>");
  assert.equal(render(<LocaleProbe locale="fr" />), "<i>fr|fr</i>");
  assert.equal(
    render(
      <LabelsProvider locale="es">
        <LocaleProbe />
        <LocaleProbe locale="ar" />
        <LabelsProvider labels={{}}>
          <LocaleProbe />
        </LabelsProvider>
        <LabelsProvider locale="ja">
          <LocaleProbe />
        </LabelsProvider>
      </LabelsProvider>,
    ),
    "<i>es|es</i><i>ar|ar</i><i>es|es</i><i>ja|ja</i>",
  );
});

/* ------------------------------------------------------------- @fabrials/ui */

const SERIES = [
  { key: "input", label: "Input" },
  { key: "output", label: "Output" },
];
const DATA = [
  { day: "Mon", input: 1200, output: 400 },
  { day: "Tue", input: 1800.5, output: 650 },
];

test("SeriesChart: the table, the legend and its keys take their words from labels", () => {
  translates({
    scope: "chart",
    labels: {
      label: "Etiqueta",
      hide: (series: string) => `Ocultar ${series}`,
      show: (series: string) => `Mostrar ${series}`,
      showOnly: (series: string) => `Mostrar solo ${series}`,
      only: "Solo",
    },
    english: ["Label", "Hide Input", "Hide Output", "Show only Input", "Only"],
    translated: ["Etiqueta", "Ocultar Input", "Ocultar Output", "Mostrar solo Input", "Solo"],
    draw: (labels) => <SeriesChart caption="Tokens" data={DATA} labels={labels} series={SERIES} xKey="day" />,
  });
});

test("SeriesChart writes plain digits without a locale and the locale's with one; yFormat always wins", () => {
  const plain = render(<SeriesChart caption="Tokens" data={DATA} series={SERIES} xKey="day" />);
  assert.match(plain, /<td>1200<\/td><td>400<\/td>/);
  assert.match(plain, /<td>1800\.5<\/td>/);
  const spanish = render(<SeriesChart caption="Tokens" data={DATA} locale="es" series={SERIES} xKey="day" />);
  assert.match(spanish, /<td>1200<\/td>/, "Spanish does not group four digits");
  assert.match(spanish, /<td>1800,5<\/td>/);
  const provided = render(
    <LabelsProvider locale="de">
      <SeriesChart caption="Tokens" data={DATA} series={SERIES} xKey="day" />
    </LabelsProvider>,
  );
  assert.match(provided, /<td>1\.200<\/td>/);
  const own = render(
    <LabelsProvider locale="de">
      <SeriesChart caption="Tokens" data={DATA} series={SERIES} xKey="day" yFormat={(value) => `${value} tk`} />
    </LabelsProvider>,
  );
  assert.match(own, /<td>1200 tk<\/td>/);
});

test("CodePanel, CodeTabs and PackageInstall: the copy key and the tab lists are named by labels", () => {
  translates({
    scope: "codePanel",
    labels: { copy: "Copiar código", code: "Código" },
    english: ["Copy code", "Code"],
    translated: ["Copiar código", "Código"],
    draw: (labels) => <CodePanel code="let a = 1;" labels={labels} />,
  });
  translates({
    scope: "codePanel",
    labels: { copy: "Copiar código", examples: "Ejemplos de código" },
    english: ["Copy code"],
    translated: ["Copiar código"],
    draw: (labels) => <CodeTabs items={[{ value: "a", label: "a.ts", code: "let a = 1;", language: "ts" }]} labels={labels} />,
  });
  const tabs = (node: ReactElement) => render(node).match(/role="tablist"[^>]*aria-label="([^"]*)"|aria-label="([^"]*)"[^>]*role="tablist"/);
  const named = (node: ReactElement) => {
    const match = tabs(node);
    return match?.[1] ?? match?.[2];
  };
  const items = [{ value: "a", label: "a.ts", code: "let a = 1;", language: "ts" }];
  assert.equal(named(<CodeTabs items={items} />), "Code examples");
  assert.equal(named(<CodeTabs items={items} labels={{ examples: "Ejemplos" }} />), "Ejemplos");
  assert.equal(named(<CodeTabs items={items} label="Mine" labels={{ examples: "Ejemplos" }} />), "Mine", "the label prop wins");
  assert.equal(named(<PackageInstall command="@fabrials/ui" kind="install" />), "Package manager");
  assert.equal(named(<PackageInstall command="@fabrials/ui" kind="install" labels={{ packageManager: "Gestor de paquetes" }} />), "Gestor de paquetes");
  assert.match(render(<PackageInstall command="@fabrials/ui" kind="install" labels={{ copy: "Copiar" }} />), /aria-label="Copiar"/);
  assert.equal(
    named(
      <LabelsProvider labels={{ codePanel: { packageManager: "Gestor de paquetes" } }}>
        <PackageInstall command="@fabrials/ui" kind="install" />
      </LabelsProvider>,
    ),
    "Gestor de paquetes",
  );
});

test("a code panel's copy result is a state, not a sentence: idle draws an empty, hidden status", () => {
  const html = render(<CodePanel code="x" />);
  assert.match(html, /<span role="status" class="fui-sr-only"><\/span>/);
  assert.doesNotMatch(html, /data-state/);
});

test("CopyButton and Snippet: names from the props, then the provider, then English", () => {
  assert.match(render(<CopyButton value="x" />), /aria-label="Copy" title="Copy"/);
  assert.match(render(<CopyButton label="Copy token" value="x" />), /aria-label="Copy token"/);
  const provided = render(
    <LabelsProvider labels={{ copyButton: { copy: "Copiar", copied: "Copiado" }, snippet: { copy: "Copiar comando" } }}>
      <CopyButton value="x" />
      <CopyButton label="Copiar clave" value="x" />
      <Snippet>bun add @fabrials/ui</Snippet>
      <Snippet copyLabel="Copiar esto">bun add @fabrials/ui</Snippet>
    </LabelsProvider>,
  );
  assert.deepEqual([...provided.matchAll(/<button[^>]*aria-label="([^"]*)"/g)].map((match) => match[1]), ["Copiar", "Copiar clave", "Copiar comando", "Copiar esto"]);
  assert.match(render(<Snippet>bun add @fabrials/ui</Snippet>), /aria-label="Copy command"/);
});

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

test("MultiSelect: the placeholder and the spoken count come from labels; the eye still reads +N", () => {
  const none = render(<MultiSelect id="m" label="Status" onValueChange={() => {}} options={OPTIONS} value={[]} />);
  assert.match(none, /<span class="fui-multi-select-first">Any<\/span>/);
  const three = render(<MultiSelect id="m" label="Status" onValueChange={() => {}} options={OPTIONS} value={["a", "b", "c"]} />);
  assert.match(three, /<span aria-hidden="true" class="fui-multi-select-more">\+2<\/span><span class="fui-sr-only"> and 2 more<\/span>/);
  translates({
    scope: "multiSelect",
    labels: { more: (count: number) => `y ${count} más`, placeholder: "Cualquiera" },
    english: ["and 2 more"],
    translated: ["y 2 más"],
    draw: (labels) => <MultiSelect id="m" label="Estado" labels={labels} onValueChange={() => {}} options={OPTIONS} value={["a", "b", "c"]} />,
  });
  translates({
    scope: "multiSelect",
    labels: { placeholder: "Cualquiera" },
    english: ["Any"],
    translated: ["Cualquiera"],
    draw: (labels) => <MultiSelect id="m" label="Estado" labels={labels} onValueChange={() => {}} options={OPTIONS} value={[]} />,
  });
  assert.match(
    render(<MultiSelect id="m" label="Estado" labels={{ placeholder: "Cualquiera" }} onValueChange={() => {}} options={OPTIONS} placeholder="Todos" value={[]} />),
    />Todos</,
    "the placeholder prop wins",
  );
  const arabic = render(
    <MultiSelect id="m" label="الحالة" labels={{ more: (count, locale) => plural(count, { two: "واثنان آخران", other: "و{count} أخرى" }, locale) }} locale="ar-EG" onValueChange={() => {}} options={OPTIONS} value={["a", "b", "c"]} />,
  );
  assert.match(arabic, /\+٢<\/span><span class="fui-sr-only"> واثنان آخران<\/span>/);
});

test("RepoInfo: counts are spoken through plural rules and written compactly in the locale", () => {
  const html = render(<RepoInfo forks={1} owner="grok-insider" repo="fabrials-ui" stars={1204} />);
  assert.match(html, /aria-label="1,204 stars"/);
  assert.match(html, /aria-label="1 fork"/);
  assert.match(html, /<\/svg> 1\.2K<\/span>/);
  assert.match(render(<RepoInfo owner="a" repo="b" stars={1} />), /aria-label="1 star"/);
  const labels = {
    stars: (count: number, locale: Intl.LocalesArgument) => plural(count, { one: "{count} estrella", other: "{count} estrellas" }, locale),
    forks: (count: number, locale: Intl.LocalesArgument) => plural(count, { one: "{count} bifurcación", other: "{count} bifurcaciones" }, locale),
  };
  translates({
    scope: "repoInfo",
    labels,
    english: ["stars", "fork"],
    translated: ["estrellas", "1 bifurcación"],
    draw: (own) => <RepoInfo forks={1} labels={own} owner="grok-insider" repo="fabrials-ui" stars={12480} />,
  });
  const spanish = render(
    <LabelsProvider labels={{ repoInfo: labels }} locale="es">
      <RepoInfo forks={2} owner="grok-insider" repo="fabrials-ui" stars={12480} />
    </LabelsProvider>,
  );
  assert.match(spanish, /aria-label="12\.480 estrellas"/);
  assert.match(spanish, /aria-label="2 bifurcaciones"/);
  assert.match(spanish, /12,5(\s| )mil/);
  const arabic = (stars: number) =>
    render(
      <RepoInfo
        labels={{ stars: (count, locale) => plural(count, { zero: "لا نجوم", one: "نجمة واحدة", two: "نجمتان", few: "{count} نجوم", many: "{count} نجمة", other: "{count} نجمة" }, locale) }}
        locale="ar-u-nu-latn"
        owner="a"
        repo="b"
        stars={stars}
      />,
    ).match(/aria-label="([^"]*)"/)?.[1];
  assert.deepEqual([0, 1, 2, 3, 11, 100].map(arabic), ["لا نجوم", "نجمة واحدة", "نجمتان", "3 نجوم", "11 نجمة", "100 نجمة"]);
});

test("FilterChip: the clear key's name lowercases the label only in the English default", () => {
  assert.match(render(<FilterChip href="?" label="Status" value="Open" />), /aria-label="Clear status filter \(Open\)"/);
  assert.match(render(<FilterChip label="Status" onRemove={() => {}} value="Open" />), /aria-label="Clear status filter \(Open\)"/);
  const clear = (label: string, value: string) => `Quitar el filtro ${label}: ${value}`;
  for (const chip of [
    (labels?: { clear: typeof clear }) => <FilterChip href="?" label="Estado" labels={labels} value="Abierto" />,
    (labels?: { clear: typeof clear }) => <FilterChip label="Estado" labels={labels} onRemove={() => {}} value="Abierto" />,
  ]) {
    translates({ scope: "filterChip", labels: { clear }, english: ["Clear"], translated: ["Quitar el filtro Estado: Abierto"], draw: chip });
  }
  assert.match(
    render(
      <LabelsProvider labels={{ filterChip: { clear } }}>
        <FilterChip clearLabel="Fuera" href="?" label="Estado" value="Abierto" />
      </LabelsProvider>,
    ),
    /aria-label="Fuera"/,
    "clearLabel wins",
  );
});

test("Table: the scroll region's name comes from regionLabel, then labels, then English", () => {
  const region = (node: ReactElement) => render(node).match(/role="region" aria-label="([^"]*)"/)?.[1];
  assert.equal(region(<Table />), "Scrollable table");
  assert.equal(region(<Table aria-label="Invoices" />), "Invoices table");
  assert.equal(region(<Table aria-label="Invoices" regionLabel="Invoices, scrollable" />), "Invoices, scrollable");
  const labels = { table: { region: (name?: string) => (name ? `Tabla ${name}` : "Tabla desplazable") } };
  assert.equal(
    region(
      <LabelsProvider labels={labels}>
        <Table />
      </LabelsProvider>,
    ),
    "Tabla desplazable",
  );
  assert.equal(
    region(
      <LabelsProvider labels={labels}>
        <Table aria-label="Facturas" />
      </LabelsProvider>,
    ),
    "Tabla Facturas",
  );
});

const TODAY = new Date(2026, 10, 10);

test("Calendar draws English without a locale, whatever the device's, and the provider's with one", () => {
  const plain = render(<Calendar selected={TODAY} today={TODAY} />);
  assert.equal(plain, render(<Calendar locale="en" selected={TODAY} today={TODAY} />));
  assert.match(plain, />November 2026</);
  assert.match(plain, /aria-label="Previous month"/);
  assert.match(plain, /aria-label="Next month"/);
  assert.match(plain, /aria-label="Tuesday, November 10, 2026"/);
  const japanese = render(
    <LabelsProvider labels={{ calendar: { previousMonth: "前の月", nextMonth: "次の月" } }} locale="ja">
      <Calendar selected={TODAY} today={TODAY} />
    </LabelsProvider>,
  );
  assert.match(japanese, />2026年11月</);
  assert.match(japanese, /aria-label="前の月"/);
  assert.match(japanese, /aria-label="次の月"/);
  assert.doesNotMatch(words(japanese), /November|Previous|Next|Tuesday/);
  assert.match(
    render(
      <LabelsProvider labels={{ calendar: { previousMonth: "前の月" } }} locale="ja">
        <Calendar locale="es" previousMonthLabel="Mes anterior" selected={TODAY} today={TODAY} />
      </LabelsProvider>,
    ),
    /aria-label="Mes anterior".*>noviembre de 2026</s,
    "the calendar's own props win",
  );
});

test("the week starts where the locale starts it, for any locale argument", () => {
  // Monday where the runtime has no week data: the assertion is that the argument is read, not what it says.
  const known = typeof (new Intl.Locale("en-US") as Intl.Locale & { getWeekInfo?: unknown }).getWeekInfo === "function" || "weekInfo" in Intl.Locale.prototype;
  if (known) {
    assert.equal(firstDayOfWeek("en-US"), 0);
    assert.equal(firstDayOfWeek(new Intl.Locale("en-US")), 0);
    assert.equal(firstDayOfWeek(["en-GB", "en-US"]), 1);
    assert.equal(firstDayOfWeek("ar-EG"), 6);
  } else {
    assert.equal(firstDayOfWeek("en-US"), 1);
  }
});

test("DatePicker and DateRangePicker: placeholder, clear key and the written date follow labels and locale", () => {
  assert.match(render(<DatePicker aria-label="Due" />), />Pick a date</);
  assert.match(render(<DateRangePicker aria-label="Trip" />), />Pick dates</);
  assert.match(render(<DatePicker aria-label="Due" clearable value={TODAY} />), />Nov 10, 2026<.*aria-label="Clear date"/s);
  assert.match(render(<DateRangePicker aria-label="Trip" clearable value={{ from: TODAY, to: new Date(2026, 10, 12) }} />), /aria-label="Clear dates"/);
  const labels = { datePicker: { placeholder: "Elige una fecha", clear: "Borrar la fecha", rangePlaceholder: "Elige las fechas", clearRange: "Borrar las fechas" } };
  const spanish = render(
    <LabelsProvider labels={labels} locale="es">
      <DatePicker aria-label="Vence" />
      <DateRangePicker aria-label="Viaje" />
      <DatePicker aria-label="Vence" clearable value={TODAY} />
      <DateRangePicker aria-label="Viaje" clearable value={{ from: TODAY, to: new Date(2026, 10, 12) }} />
      <DatePicker aria-label="Vence" placeholder="Cuando quieras" />
    </LabelsProvider>,
  );
  const heard = words(spanish);
  for (const word of ["Elige una fecha", "Elige las fechas", "10 nov 2026", "Borrar la fecha", "Borrar las fechas", "Cuando quieras"]) assert.ok(heard.includes(word), `${word} missing in ${heard}`);
  assert.doesNotMatch(heard, /Pick|Clear|Nov 10/);
});

test("NumberTicker: plain digits unless a locale is chosen; false keeps them plain inside a provider", () => {
  const read = (node: ReactElement) => render(node).match(/<span class="fui-sr-only">([^<]*)</)?.[1];
  assert.equal(read(<NumberTicker value={12480} />), "12480");
  assert.equal(read(<NumberTicker locale="en" value={12480} />), "12,480");
  assert.equal(read(<NumberTicker locale="de" value={12480} />), "12.480");
  assert.equal(read(<NumberTicker locale={false} value={12480} />), "12480");
  assert.equal(read(<NumberTicker locale value={12480} />), (12480).toLocaleString(), "true is still the device's locale");
  assert.equal(
    read(
      <LabelsProvider locale="de">
        <NumberTicker value={12480} />
      </LabelsProvider>,
    ),
    "12.480",
  );
  assert.equal(
    read(
      <LabelsProvider locale="de">
        <NumberTicker locale={false} value={12480} />
      </LabelsProvider>,
    ),
    "12480",
  );
  assert.equal(read(<NumberTicker format={(value) => `${value} kg`} locale="de" value={12480} />), "12480 kg");
});

test("Meter, RelativeTime and Spreadsheet read the provider's locale when given none", () => {
  const NOW = Date.UTC(2026, 10, 10, 10);
  const ago = <RelativeTime date={NOW - 3 * 60_000} now={NOW} timeZone="UTC" />;
  assert.match(render(ago), />3 minutes ago</);
  assert.match(render(<LabelsProvider locale="es">{ago}</LabelsProvider>), />hace 3 minutos</);
  assert.match(
    render(
      <LabelsProvider locale="es">
        <RelativeTime date={NOW - 3 * 60_000} locale="fr" now={NOW} timeZone="UTC" />
      </LabelsProvider>,
    ),
    />il y a 3 minutes</,
  );
  assert.match(render(<Meter aria-label="Quota" value={42} />), /42%/);
  assert.match(
    render(
      <LabelsProvider locale="fr">
        <Meter aria-label="Quota" value={42} />
      </LabelsProvider>,
    ),
    /42\s%/,
  );
  const book = { sheets: [{ name: "Totals", rows: [[1234.5, new Date(Date.UTC(2026, 10, 10))]] }] };
  assert.match(render(<Spreadsheet aria-label="Book" workbook={book} />), />1234\.5<.*>Nov 10, 2026</s);
  const german = render(
    <LabelsProvider labels={{ spreadsheet: { empty: "Dieses Blatt ist leer." } }} locale="de">
      <Spreadsheet aria-label="Book" workbook={book} />
      <Spreadsheet aria-label="Leer" workbook={{ sheets: [{ name: "Leer", rows: [] }] }} />
    </LabelsProvider>,
  );
  assert.match(german, />1234,5<.*>10\.11\.2026</s);
  assert.match(german, /Dieses Blatt ist leer\./);
  assert.doesNotMatch(german, /This sheet is empty/);
});

test("ThemeSwitcher and ErrorBoundaryFallback take the provider's words under their own", () => {
  translates({
    scope: "themeSwitcher",
    labels: { system: "Sistema", light: "Claro", dark: "Oscuro" },
    english: ["System", "Light", "Dark"],
    translated: ["Sistema", "Claro", "Oscuro"],
    draw: (labels) => <ThemeSwitcher labels={labels} onValueChange={() => {}} value="system" />,
  });
  translates({
    scope: "errorBoundary",
    labels: { title: "No se pudo mostrar esta parte", description: "El resto de la página sigue funcionando.", retry: "Reintentar" },
    english: ["This part could not be shown", "Something went wrong", "Try again"],
    translated: ["No se pudo mostrar esta parte", "El resto de la página sigue funcionando.", "Reintentar"],
    draw: (labels) => <ErrorBoundaryFallback labels={labels} reset={() => {}} />,
  });
});

test("recency groups name a month in the locale asked for, en-US by default", () => {
  const now = new Date(2026, 10, 10);
  const march = new Date(2026, 2, 3);
  assert.equal(recencyGroupFor(march, now).label, "March");
  assert.equal(recencyGroupFor(march, now, { locale: "es" }).label, "marzo");
  assert.equal(recencyGroupFor(march, now, { locale: new Intl.Locale("fr") }).label, "mars");
  assert.equal(recencyGroupFor(new Date(2025, 2, 3), now, { locale: ["de", "en"] }).label, "März 2025");
  assert.deepEqual(
    groupByRecency([{ at: march }, { at: now }], (item) => item.at, now, { locale: "es", labels: { today: "Hoy" } }).map((group) => group.label),
    ["Hoy", "marzo"],
  );
});

/* ---------------------------------------------------------- @fabrials/ai-ui */

const STEPS: SearchStep[] = [
  { type: "search", query: "cascade layers", sources: ["https://docs.example.org/a", "https://docs.example.org/b"] },
  { type: "open_page", url: "https://www.example.com/guide" },
];

const SEARCH_ES = {
  searching: "Buscando en la web…",
  reading: "Leyendo los resultados…",
  searched: "Búsqueda en la web",
  searches: (count: number, locale: Intl.LocalesArgument) => plural(count, { one: "{count} búsqueda", other: "{count} búsquedas" }, locale),
  sources: (count: number, locale: Intl.LocalesArgument) => plural(count, { one: "{count} fuente", other: "{count} fuentes" }, locale),
  searchedWeb: "Buscó en la web",
  readPage: "Leyó la página",
  opened: (host: string) => `Abrió ${host}`,
  showQueries: "Mostrar las búsquedas",
  hideQueries: "Ocultar las búsquedas",
  reviewing: "Revisando fuentes",
};

test("the search helpers keep their English and take labels and a locale", () => {
  assert.equal(searchDoneLabel(0), "Searched the web");
  assert.equal(searchDoneLabel(1, 1), "Searched the web · 1 search · 1 source");
  assert.equal(searchDoneLabel(5, 2), "Searched the web · 2 searches · 5 sources");
  assert.equal(searchLabel("searching", 0), "Searching the web…");
  assert.equal(searchLabel("reading", 0), "Reading results…");
  assert.equal(searchLabel("done", 3, 1), "Searched the web · 1 search · 3 sources");
  assert.equal(searchStepLabel(STEPS[1]!), "Opened example.com");
  assert.equal(sourcesLabel(1), "1 source");
  assert.equal(sourcesLabel(3), "3 sources");

  assert.equal(searchDoneLabel(5, 1, SEARCH_ES, "es"), "Búsqueda en la web · 1 búsqueda · 5 fuentes");
  assert.equal(searchLabel("searching", 0, 0, SEARCH_ES), "Buscando en la web…");
  assert.equal(searchLabel("reading", 0, 0, { reading: "Leyendo…" }), "Leyendo…");
  assert.equal(searchLabel("done", 12480, 2, SEARCH_ES, "es"), "Búsqueda en la web · 2 búsquedas · 12.480 fuentes");
  assert.equal(searchStepLabel(STEPS[1]!, SEARCH_ES), "Abrió example.com");
  assert.equal(sourcesLabel(2, { count: SEARCH_ES.sources }, "es"), "2 fuentes");
  const arabic = { count: (count: number, locale: Intl.LocalesArgument) => plural(count, AR, locale) };
  assert.deepEqual(
    [0, 1, 2, 3, 11, 100].map((count) => sourcesLabel(count, arabic, "ar-u-nu-latn")),
    ["لا مصادر", "مصدر واحد", "مصدران", "3 مصادر", "11 مصدرًا", "100 مصدر"],
  );
});

test("SearchStepsDisclosure and SearchStepList: the row, its key and each step's kind are translated", () => {
  translates({
    scope: "search",
    labels: SEARCH_ES,
    locale: "es",
    english: ["Searched the web", "1 search", "2 sources", "Hide search queries", "Searched web", "Read page", "Opened example.com"],
    translated: ["Búsqueda en la web · 1 búsqueda · 2 fuentes", "Ocultar las búsquedas", "Buscó en la web", "Leyó la página", "Abrió example.com"],
    draw: (labels) => <SearchStepsDisclosure defaultOpen labels={labels} phase="done" sourceCount={2} steps={STEPS} />,
  });
  translates({
    scope: "search",
    labels: SEARCH_ES,
    english: ["Searching the web…", "Show search queries"],
    translated: ["Buscando en la web…", "Mostrar las búsquedas"],
    draw: (labels) => <SearchStepsDisclosure labels={labels} phase="searching" steps={STEPS.slice(0, 1)} timer={false} />,
  });
  translates({
    scope: "search",
    labels: SEARCH_ES,
    english: ["Searched web", "Read page", "Opened"],
    translated: ["Buscó en la web", "Leyó la página", "Abrió example.com"],
    draw: (labels) => <SearchStepList labels={labels} steps={STEPS} />,
  });
  assert.match(render(<SearchStepsDisclosure label="Mine" labels={SEARCH_ES} phase="done" steps={STEPS} />), /Mine/, "the label prop wins");
});

test("SourceTally: its words come from the label prop, then the provider, then English; the count takes the locale", () => {
  const tally = <SourceTally sources={["https://docs.example.org/a", "https://docs.example.org/b"]} />;
  assert.match(render(tally), />Reviewing sources</);
  assert.match(render(<SourceTally label="Read" sources={["https://docs.example.org/a"]} />), />Read</);
  const arabic = render(
    <LabelsProvider labels={{ search: { reviewing: "مراجعة المصادر" } }} locale="ar-EG">
      {tally}
    </LabelsProvider>,
  );
  assert.match(arabic, />مراجعة المصادر</);
  assert.doesNotMatch(arabic, /Reviewing/);
  assert.match(arabic, /٢/);
});

test("ReasoningDisclosure reads the provider under its own labels", () => {
  const es = { thinking: "Pensando…", brief: "Pensó unos segundos", thoughtFor: (seconds: number) => `Pensó ${seconds} s` };
  translates({ scope: "reasoning", labels: es, english: ["Thought for 4s"], translated: ["Pensó 4 s"], draw: (labels) => <ReasoningDisclosure durationSeconds={4} labels={labels} /> });
  translates({ scope: "reasoning", labels: es, english: ["Thinking…"], translated: ["Pensando…"], draw: (labels) => <ReasoningDisclosure labels={labels} streaming timer={false} /> });
  translates({ scope: "reasoning", labels: es, english: ["Thought for a few seconds"], translated: ["Pensó unos segundos"], draw: (labels) => <ReasoningDisclosure labels={labels} /> });
});

const SOURCES = [
  { url: "https://docs.example.org/guides/layers", title: "Cascade layers" },
  { url: "https://www.example.com/blog/tokens" },
];
const SOURCES_ES = {
  source: (number: number) => `Fuente ${number}`,
  citation: (number: number, title: string) => `Fuente ${number}: ${title}`,
  count: (count: number, locale: Intl.LocalesArgument) => plural(count, { one: "{count} fuente", other: "{count} fuentes" }, locale),
};

test("Sources, SourceCard and CitationChip: the count and each number are named by labels", () => {
  translates({
    scope: "sources",
    labels: SOURCES_ES,
    english: ["2 sources", "Source 1", "Source 2"],
    translated: ["2 fuentes", "Fuente 1", "Fuente 2"],
    draw: (labels) => <Sources defaultOpen labels={labels} sources={SOURCES} />,
  });
  translates({
    scope: "sources",
    labels: SOURCES_ES,
    english: ["Source 3"],
    translated: ["Fuente 3"],
    draw: (labels) => <SourceCard labels={labels} number={3} url={SOURCES[0]!.url} />,
  });
  translates({
    scope: "sources",
    labels: SOURCES_ES,
    english: ["Source 1: Cascade layers"],
    translated: ["Fuente 1: Cascade layers"],
    draw: (labels) => <CitationChip href={SOURCES[0]!.url} labels={labels} number={1} source={SOURCES[0]} />,
  });
  assert.match(render(<Sources sources={SOURCES.slice(0, 1)} />), /<span>1 source<\/span>/);
  assert.match(render(<Sources label={(count) => `${count} refs`} labels={SOURCES_ES} sources={SOURCES} />), /<span>2 refs<\/span>/, "the label prop wins");
  const arabic = (count: number) =>
    render(
      <LabelsProvider labels={{ sources: { count: (n, locale) => plural(n, AR, locale) } }} locale="ar-u-nu-latn">
        <Sources sources={Array.from({ length: count }, (_, index) => ({ url: `https://example.org/${index}` }))} />
      </LabelsProvider>,
    ).match(/<span>([^<]*)<\/span><svg/)?.[1];
  assert.deepEqual([1, 2, 3, 11, 100].map(arabic), ["مصدر واحد", "مصدران", "3 مصادر", "11 مصدرًا", "100 مصدر"]);
});

const FILES: AttachmentItem[] = [
  { id: "a", name: "report.pdf", mediaType: "application/pdf", size: 1_572_864, status: "ready" },
  { id: "b", name: "sheet.xlsx", mediaType: "application/vnd.ms-excel", status: "uploading", progress: 0.36 },
  { id: "c", name: "clip.mov", mediaType: "video/quicktime", status: "uploading" },
  { id: "d", name: "scan.tiff", mediaType: "image/tiff", status: "error" },
];
const ATTACHMENTS_ES = {
  label: "Adjuntos",
  uploading: "Subiendo…",
  uploadingName: (name: string) => `Subiendo ${name}`,
  uploadingPercent: (percent: string) => `Subiendo, ${percent}`,
  failed: "No se pudo subir",
  remove: (name: string) => `Quitar ${name}`,
};

test("Attachments: uploads, failures, the remove key and the list's name are translated in every variant", () => {
  for (const variant of ["inline", "list"] as const) {
    translates({
      scope: "attachments",
      labels: ATTACHMENTS_ES,
      english: ["Attachments", "Uploading 36%", "Uploading…", "Uploading clip.mov", "Upload failed", "Remove report.pdf"],
      translated: ["Adjuntos", "Subiendo, 36%", "Subiendo…", "Subiendo clip.mov", "No se pudo subir", "Quitar report.pdf"],
      draw: (labels) => <Attachments items={FILES} labels={labels} onRemove={() => {}} variant={variant} />,
    });
  }
  translates({
    scope: "attachments",
    labels: ATTACHMENTS_ES,
    english: ["Attachments", "Uploading sheet.xlsx", "Uploading clip.mov", "Upload failed", "Remove scan.tiff"],
    translated: ["Adjuntos", "Subiendo sheet.xlsx", "Subiendo clip.mov", "scan.tiff: No se pudo subir", "Quitar scan.tiff"],
    draw: (labels) => <Attachments items={FILES} labels={labels} onRemove={() => {}} variant="grid" />,
  });
  assert.match(render(<Attachments items={FILES} label="Mine" labels={ATTACHMENTS_ES} />), /aria-label="Mine"/, "the label prop wins");
  assert.match(
    render(<AttachmentChip item={FILES[0]!} labels={ATTACHMENTS_ES} onRemove={() => {}} removeLabel={(item) => `Drop ${item.name}`} />),
    /aria-label="Drop report\.pdf"/,
    "removeLabel wins",
  );
});

test("an attachment's size and percentage: as always without a locale, the locale's with one", () => {
  assert.equal(attachmentDetail(FILES[0]!), "PDF · 1.5 MB");
  assert.equal(attachmentDetail(FILES[0]!, "es"), "PDF · 1,5 MB");
  assert.match(render(<AttachmentChip item={FILES[0]!} />), />PDF · 1\.5 MB</);
  assert.match(render(<AttachmentChip item={FILES[1]!} />), />Uploading 36%</);
  assert.match(render(<AttachmentChip item={FILES[1]!} variant="grid" />), /role="progressbar">36%</);
  const french = render(
    <LabelsProvider locale="fr">
      <AttachmentChip item={FILES[0]!} />
      <AttachmentChip item={FILES[1]!} variant="grid" />
    </LabelsProvider>,
  );
  assert.match(french, />PDF · 1,5\sMo</);
  assert.match(french, /role="progressbar">36\s%</);
  assert.equal(formatPercent(36), "36%");
  // Arabic's ratio sign carries an invisible mark after it.
  assert.equal(formatPercent(100, "ar-EG").replaceAll("\u061c", ""), "١٠٠٪");
});

test("AgentThinking names each kind of work from labels when it has no label", () => {
  translates({
    scope: "agent",
    labels: { searching: "Buscando", thinking: "Pensando" },
    english: ["Searching"],
    translated: ["Buscando"],
    draw: (labels) => <AgentThinking activity="searching" labels={labels} timer={false} />,
  });
  assert.match(render(<AgentThinking labels={{ thinking: "Pensando" }} timer={false} />), />Pensando</);
  assert.match(render(<AgentThinking label="Mine" labels={{ thinking: "Pensando" }} timer={false} />), />Mine</);
});

const TASKS = [
  { id: "a", title: "Leer el esquema", status: "done" as const },
  { id: "b", title: "Copiar facturas", status: "skipped" as const },
];

test("TaskList: the closing summary goes through plural rules and the provider reaches it", () => {
  assert.match(render(<TaskList tasks={TASKS} title="Plan" />), /2 of 2.*All 2 tasks settled/s);
  assert.match(render(<TaskList tasks={TASKS.slice(0, 1)} title="Plan" />), /1 of 1.*All 1 task settled/s);
  translates({
    scope: "taskList",
    labels: {
      done: "Hecho",
      skipped: "Omitido",
      progress: (done: number, total: number) => `${done} de ${total}`,
      complete: (total: number, locale?: Intl.LocalesArgument) => plural(total, { one: "La tarea ha terminado", other: "Las {count} tareas han terminado" }, locale),
    },
    english: ["Done: ", "Skipped: ", "2 of 2", "All 2 tasks settled"],
    translated: ["Hecho: ", "Omitido: ", "2 de 2", "Las 2 tareas han terminado"],
    draw: (labels) => <TaskList labels={labels} tasks={TASKS} title="Plan" />,
  });
});

const PARTS = [
  { label: "Sistema", value: 12_400 },
  { label: "Archivos", value: 29_700 },
];

test("ContextMeter: the reading, the spoken value, the legend's free row and the name are translated", () => {
  const html = render(<ContextMeter limit={200_000} parts={PARTS} />);
  assert.match(html, /aria-label="Context window"/);
  assert.match(html, /aria-valuetext="42,100 of 200,000 tokens, 21%"/);
  assert.match(html, />42\.1k of 200k<span class="fui-context-meter-percent">21%<\/span>/);
  assert.match(html, /<span class="fui-context-meter-name">Free<\/span>/);
  translates({
    scope: "contextMeter",
    labels: { label: "Ventana de contexto", unit: "tókenes", free: "Libre", of: (used: string, limit: string) => `${used} de ${limit}` },
    english: ["Context window", "Free", " of ", "tokens"],
    translated: ["Ventana de contexto", "Libre", "42.1k de 200k", "42,100 de 200,000 tókenes, 21%"],
    draw: (labels) => <ContextMeter labels={labels} limit={200_000} parts={PARTS} />,
  });
  const spanish = render(
    <LabelsProvider labels={{ contextMeter: { of: (used, limit) => `${used} de ${limit}`, unit: "tókenes" } }} locale="es">
      <ContextMeter limit={200_000} parts={PARTS} />
      <ContextMeter label="Memoria" limit={200_000} parts={PARTS} unit="unidades" />
    </LabelsProvider>,
  );
  assert.match(spanish, /aria-valuetext="42\.100 de 200\.000 tókenes, 21\s%"/);
  assert.match(spanish, /aria-label="Memoria"[^>]*aria-valuetext="42\.100 de 200\.000 unidades/, "label and unit props win");
});

test("GenerationFrame: each status sentence comes from labels; label and doneLabel still win", () => {
  const es = {
    queued: "En cola",
    image: "Creando la imagen",
    document: "Escribiendo el documento",
    imageFailed: "No se pudo crear la imagen",
    documentFailed: "No se pudo escribir el documento",
    imageReady: "Imagen lista",
    documentReady: "Documento listo",
  };
  const cases: Array<[ReactElement, string, string]> = [
    [<GenerationFrame alt="" key="1" status="queued" />, "Waiting to start", es.queued],
    [<GenerationFrame alt="" key="2" status="generating" />, "Making the image", es.image],
    [<GenerationFrame alt="" key="3" kind="document" status="generating" />, "Writing the document", es.document],
    [<GenerationFrame alt="" key="4" status="failed" />, "The image could not be made", es.imageFailed],
    [<GenerationFrame alt="" key="5" kind="document" status="failed" />, "The document could not be written", es.documentFailed],
    [<GenerationFrame alt="" key="6" status="done" />, "Image ready", es.imageReady],
    [<GenerationFrame alt="" key="7" kind="document" status="done" />, "Document ready", es.documentReady],
  ];
  for (const [frame, english, spanish] of cases) {
    assert.ok(words(render(frame)).includes(english), english);
    const provided = words(render(<LabelsProvider labels={{ generation: es }}>{frame}</LabelsProvider>));
    assert.ok(provided.includes(spanish), spanish);
    assert.ok(!provided.includes(english), `${english} survives`);
  }
  assert.match(render(<GenerationFrame alt="" labels={es} progress={0.35} status="generating" />), />Creando la imagen<.*>35%</s);
  assert.match(render(<GenerationFrame alt="" label="Mine" labels={es} status="generating" />), />Mine</);
  assert.match(render(<GenerationFrame alt="" doneLabel="Lista" labels={es} status="done" />), />Lista</);
  assert.match(
    render(
      <LabelsProvider locale="fr">
        <GenerationFrame alt="" progress={0.35} status="generating" />
      </LabelsProvider>,
    ),
    />35\s%</,
  );
});

test("CodeBlock: the keys and the body's name come from labels under its own props", () => {
  translates({
    scope: "codeBlock",
    labels: { copy: "Copiar código", copied: "Copiado", download: "Descargar archivo", region: (name: string) => `Código de ${name}` },
    english: ["Copy code", "Download file", "app.ts code"],
    translated: ["Copiar código", "Descargar archivo", "Código de app.ts"],
    draw: (labels) => <CodeBlock code="let a = 1;" download filename="app.ts" labels={labels} language="ts" />,
  });
  assert.match(
    render(
      <LabelsProvider labels={{ codeBlock: { copy: "Copiar código" } }}>
        <CodeBlock code="x" copyLabel="Copiar esto" />
      </LabelsProvider>,
    ),
    /aria-label="Copiar esto"/,
  );
});
