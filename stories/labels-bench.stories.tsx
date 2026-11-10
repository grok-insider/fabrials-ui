import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Calendar,
  CodePanel,
  CodeTabs,
  FilterChip,
  LabelsProvider,
  MultiSelect,
  RepoInfo,
  SeriesChart,
  Snippet,
  Table,
  ThemeSwitcher,
  useLabels,
  type FabrialsLabels,
} from "@fabrials/ui";
import {
  Attachments,
  CitationProvider,
  ContextMeter,
  GenerationFrame,
  SearchStepsDisclosure,
  Sources,
  type AttachmentItem,
  type CitationSource,
  type SearchStep,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// The same pieces three times: as they ship, with a product's Spanish, and with Arabic in a right-to-left frame. Nothing
// here is a clock or random: the pictures are the same every time.
const DATA = [
  { day: "Mon", input: 1200, output: 420 },
  { day: "Tue", input: 1680, output: 560 },
  { day: "Wed", input: 1440, output: 380 },
  { day: "Thu", input: 2010, output: 720 },
  { day: "Fri", input: 1740, output: 640 },
  { day: "Sat", input: 980, output: 260 },
  { day: "Sun", input: 760, output: 180 },
];

/** The words that belong to the product, not to the library: the same piece in three languages reads as one piece. */
type Words = {
  caption: string;
  series: [string, string];
  status: string;
  options: Array<{ value: string; label: string }>;
  owner: string;
  ownerName: string;
  theme: string;
  invoice: string;
  invoices: string;
};

const ENGLISH_WORDS: Words = {
  caption: "Synthetic tokens a week",
  series: ["Prompt tokens", "Answer tokens"],
  status: "Status",
  options: [
    { value: "open", label: "Open" },
    { value: "waiting", label: "Waiting" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ],
  owner: "Owner",
  ownerName: "Grok Insider",
  theme: "Theme",
  invoice: "Invoice",
  invoices: "Invoices",
};

const SPANISH_WORDS: Words = {
  caption: "Tokens sintéticos por semana",
  series: ["Tokens de entrada", "Tokens de respuesta"],
  status: "Estado",
  options: [
    { value: "open", label: "Abierta" },
    { value: "waiting", label: "En espera" },
    { value: "closed", label: "Cerrada" },
    { value: "archived", label: "Archivada" },
  ],
  owner: "Responsable",
  ownerName: "Grok Insider",
  theme: "Tema",
  invoice: "Factura",
  invoices: "Facturas",
};

const ARABIC_WORDS: Words = {
  caption: "رموز اصطناعية كل أسبوع",
  series: ["رموز الطلب", "رموز الرد"],
  status: "الحالة",
  options: [
    { value: "open", label: "مفتوح" },
    { value: "waiting", label: "بالانتظار" },
    { value: "closed", label: "مغلق" },
    { value: "archived", label: "مؤرشف" },
  ],
  owner: "المالك",
  ownerName: "Grok Insider",
  theme: "المظهر",
  invoice: "الفاتورة",
  invoices: "الفواتير",
};

const SOURCES: CitationSource[] = [
  { url: "https://docs.example.org/guides/cascade-layers", title: "Cascade layers in practice" },
  { url: "https://www.example.com/blog/2026/tokens" },
  { url: "https://reference.example.net/css/logical-properties", title: "Logical properties, a reference" },
];

const STEPS: SearchStep[] = [
  { type: "search", query: "cascade layers order", sources: ["https://docs.example.org/guides/cascade-layers", "https://blog.example.com/layers"] },
  { type: "search", query: "logical properties in css", sources: ["https://reference.example.net/css/logical-properties"] },
  { type: "open_page", url: "https://docs.example.org/guides/cascade-layers", title: "A guide to cascade layers" },
];

const FILES: AttachmentItem[] = [
  { id: "a", name: "quarterly-report.pdf", mediaType: "application/pdf", size: 2_411_724, status: "ready" },
  { id: "b", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", status: "uploading", progress: 0.36 },
  { id: "c", name: "scan-01.tiff", mediaType: "image/tiff", status: "error" },
];

const PARTS = [
  { label: "Instructions", value: 9_400 },
  { label: "Tools", value: 12_100 },
  { label: "Files", value: 21_700 },
  { label: "Conversation", value: 14_300 },
];

const CODE = `import "@fabrials/ui/tokens.css";
import "@fabrials/ui/styles.css";

export function App() {
  return <main className="product">…</main>;
}`;

/** The Spanish a product would set once, in its own client provider. */
export const SPANISH: FabrialsLabels = {
  chart: {
    label: "Etiqueta",
    hide: (series) => `Ocultar ${series}`,
    show: (series) => `Mostrar ${series}`,
    showOnly: (series) => `Mostrar solo ${series}`,
    only: "Solo",
    showAll: "Mostrar todo",
    noValue: "Sin valor",
    total: "Suma",
  },
  codePanel: { copy: "Copiar el código", copied: "Copiado al portapapeles", copyFailed: "No se pudo copiar. Selecciona el código y cópialo.", code: "Código", examples: "Ejemplos de código", packageManager: "Gestor de paquetes" },
  copyButton: { copy: "Copiar", copied: "Copiado" },
  snippet: { copy: "Copiar el comando" },
  multiSelect: { placeholder: "Cualquiera", more: (count) => `y ${count} más`, clear: (label) => `Quitar el filtro ${label}` },
  repoInfo: {
    stars: (count) => `${count} ${count === 1 ? "estrella" : "estrellas"}`,
    forks: (count) => `${count} ${count === 1 ? "bifurcación" : "bifurcaciones"}`,
  },
  filterChip: { clear: (label, value) => `Quitar el filtro ${label}: ${value}` },
  table: { region: (name) => (name ? `Tabla de ${name}` : "Tabla desplazable") },
  themeSwitcher: { system: "Sistema", light: "Claro", dark: "Oscuro" },
  search: {
    searching: "Buscando en la web…",
    reading: "Leyendo los resultados…",
    searched: "Búsqueda en la web",
    searches: (count) => `${count} ${count === 1 ? "búsqueda" : "búsquedas"}`,
    sources: (count) => `${count} ${count === 1 ? "fuente" : "fuentes"}`,
    searchedWeb: "Buscó en la web",
    readPage: "Leyó la página",
    opened: (host) => `Abrió ${host}`,
    showQueries: "Mostrar las búsquedas",
    hideQueries: "Ocultar las búsquedas",
    reviewing: "Revisando fuentes",
  },
  sources: { source: (number) => `Fuente ${number}`, citation: (number, title) => `Fuente ${number}: ${title}`, count: (count) => `${count} ${count === 1 ? "fuente" : "fuentes"}` },
  attachments: {
    label: "Adjuntos",
    uploading: "Subiendo…",
    uploadingName: (name) => `Subiendo ${name}`,
    uploadingPercent: (percent) => `Subiendo, ${percent}`,
    failed: "No se pudo subir",
    remove: (name) => `Quitar ${name}`,
  },
  contextMeter: { label: "Ventana de contexto", unit: "tókenes", free: "Libre", of: (used, limit) => `${used} de ${limit}` },
  generation: {
    queued: "En cola",
    image: "Creando la imagen",
    document: "Escribiendo el documento",
    imageFailed: "No se pudo crear la imagen",
    documentFailed: "No se pudo escribir el documento",
    imageReady: "Imagen lista",
    documentReady: "Documento listo",
  },
  agent: { thinking: "Pensando", searching: "Buscando", reading: "Leyendo", writing: "Escribiendo", running: "Ejecutando", rendering: "Generando", uploading: "Subiendo" },
  taskList: { pending: "Por hacer", running: "En curso", done: "Hecho", failed: "Falló", skipped: "Omitido", progress: (done, total) => `${done} de ${total}`, complete: (total) => `Las ${total} tareas han terminado` },
};

/** The Arabic a right-to-left product would set. */
export const ARABIC: FabrialsLabels = {
  chart: {
    label: "البيان",
    hide: (series) => `إخفاء ${series}`,
    show: (series) => `إظهار ${series}`,
    showOnly: (series) => `إظهار ${series} فقط`,
    only: "فقط",
    showAll: "إظهار الكل",
    noValue: "لا قيمة",
    total: "المجموع",
  },
  codePanel: { copy: "نسخ الشيفرة", copied: "نُسخت إلى الحافظة", copyFailed: "تعذّر النسخ. حدّد الشيفرة وانسخها.", code: "شيفرة", examples: "أمثلة الشيفرة", packageManager: "مدير الحزم" },
  copyButton: { copy: "نسخ", copied: "نُسخ" },
  snippet: { copy: "نسخ الأمر" },
  multiSelect: { placeholder: "أيًّا كان", more: (count) => `و${count} غيرها`, clear: (label) => `إزالة تصفية ${label}` },
  repoInfo: {
    stars: (count) => (count === 1 ? "نجمة واحدة" : count === 2 ? "نجمتان" : `${count} نجوم`),
    forks: (count) => (count === 1 ? "تفرّع واحد" : count === 2 ? "تفرّعان" : `${count} تفرّعات`),
  },
  filterChip: { clear: (label, value) => `إزالة تصفية ${label}: ${value}` },
  table: { region: (name) => (name ? `جدول ${name}` : "جدول قابل للتمرير") },
  themeSwitcher: { system: "النظام", light: "فاتح", dark: "داكن" },
  search: {
    searching: "يبحث في الويب…",
    reading: "يقرأ النتائج…",
    searched: "بحث في الويب",
    searches: (count) => (count === 1 ? "بحث واحد" : count === 2 ? "بحثان" : `${count} بحوث`),
    sources: (count) => (count === 1 ? "مصدر واحد" : count === 2 ? "مصدران" : `${count} مصادر`),
    searchedWeb: "بحث في الويب",
    readPage: "قرأ الصفحة",
    opened: (host) => `فتح ${host}`,
    showQueries: "إظهار الاستعلامات",
    hideQueries: "إخفاء الاستعلامات",
    reviewing: "يراجع المصادر",
  },
  sources: {
    source: (number) => `المصدر ${number}`,
    citation: (number, title) => `المصدر ${number}: ${title}`,
    count: (count) => (count === 1 ? "مصدر واحد" : count === 2 ? "مصدران" : `${count} مصادر`),
  },
  attachments: {
    label: "المرفقات",
    uploading: "جارٍ الرفع…",
    uploadingName: (name) => `جارٍ رفع ${name}`,
    uploadingPercent: (percent) => `جارٍ الرفع، ${percent}`,
    failed: "فشل الرفع",
    remove: (name) => `إزالة ${name}`,
  },
  contextMeter: { label: "نافذة السياق", unit: "رمزًا", free: "متاح", of: (used, limit) => `${used} من ${limit}` },
  generation: {
    queued: "بانتظار البدء",
    image: "ينشئ الصورة",
    document: "يكتب المستند",
    imageFailed: "تعذّر إنشاء الصورة",
    documentFailed: "تعذّر كتابة المستند",
    imageReady: "الصورة جاهزة",
    documentReady: "المستند جاهز",
  },
  agent: { thinking: "يفكّر", searching: "يبحث", reading: "يقرأ", writing: "يكتب", running: "ينفّذ", rendering: "يولّد", uploading: "يرفع" },
  taskList: { pending: "بالانتظار", running: "قيد التنفيذ", done: "تم", failed: "فشل", skipped: "تم التخطي", progress: (done, total) => `${done} من ${total}`, complete: (total) => `انتهت ${total} مهام` },
};

/**
 * Every English word the pieces below say out of the box, as the first picture shows them (a series that is hidden would
 * add "Show …", the tooltip "Total"). The spec fails if one of them survives a provider.
 */
export const LABEL_DEFAULTS = [
  "Label",
  "Only",
  "Hide Prompt tokens",
  "Show only Prompt tokens",
  "Copy code",
  "Code examples",
  "Copy command",
  "and 2 more",
  "12,480 stars",
  "281 forks",
  "System",
  "Light",
  "Dark",
  "Clear status filter (Open)",
  "Invoices table",
  "Searched the web",
  "Searched web",
  "Read page",
  "Hide search queries",
  "Show search queries",
  "3 sources",
  "Source 1",
  "Source 2",
  "Source 3",
  "Attachments",
  "Uploading 36%",
  "Uploading invoices-q3.xlsx",
  "Upload failed",
  "Remove quarterly-report.pdf",
  "Context window",
  "Free",
  "Making the image",
  "The document could not be written",
];

function Sheet({ probe, words }: { probe?: boolean; words: Words }) {
  const [picked, setPicked] = useState<string[]>(["open", "waiting", "archived"]);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  return (
    <>
      <SeriesChart
        caption={words.caption}
        data={DATA}
        height={220}
        series={[
          { key: "input", label: words.series[0] },
          { key: "output", label: words.series[1] },
        ]}
        xKey="day"
      />
      <CodePanel code={CODE} language="ts" lineNumbers title="app.ts" />
      <CodeTabs
        items={[
          { value: "ts", label: "ts", code: CODE, language: "ts" },
          { value: "py", label: "py", code: "print('hello')", language: "py" },
        ]}
      />
      <Snippet>bun add @fabrials/ui</Snippet>
      <div style={{ display: "grid", gap: "var(--fui-space-2)", maxWidth: "20rem" }}>
        <MultiSelect id="labels-status" label={words.status} onValueChange={setPicked} options={words.options} value={picked} />
        <RepoInfo forks={281} owner="grok-insider" repo="fabrials-ui" stars={12_480} />
        <ThemeSwitcher label={words.theme} onValueChange={setTheme} value={theme} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)" }}>
        <FilterChip href="#open" label={words.status} value={words.options[0]!.label} />
        <FilterChip label={words.owner} onRemove={() => {}} value={words.ownerName} />
      </div>
      <Table aria-label={words.invoices}>
        <thead>
          <tr>
            <th>{words.invoice}</th>
            <th>{words.status}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>INV-1042</td>
            <td>{words.options[0]!.label}</td>
          </tr>
        </tbody>
      </Table>
      <SearchStepsDisclosure defaultOpen phase="done" sourceCount={3} steps={STEPS} />
      <SearchStepsDisclosure phase="searching" steps={STEPS.slice(0, 1)} timer={false} />
      <CitationProvider sources={SOURCES}>
        <Sources defaultOpen sources={SOURCES} />
      </CitationProvider>
      <Attachments items={FILES} onRemove={() => {}} />
      <Attachments items={FILES.slice(1)} onRemove={() => {}} variant="grid" />
      <ContextMeter limit={200_000} parts={PARTS} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-3)" }}>
        <div style={{ width: "18rem" }}>
          <GenerationFrame alt="A harbour at dusk" aspectRatio="4 / 3" progress={0.42} status="generating" />
        </div>
        <div style={{ width: "18rem" }}>
          <GenerationFrame alt="Release notes" aspectRatio="4 / 3" kind="document" progress={0.3} status="failed" />
        </div>
      </div>
      {probe ? <StabilityProbe /> : null}
    </>
  );
}

const PROBE_DEFAULTS = { label: "Label" };

/**
 * `useLabels` gives one object back while its three inputs stay put: a component that re-renders for its own reasons does
 * not see its words change. (The defaults are a module constant, as the rule says; an object written in the render is a
 * new one every time.) The spec clicks the key and reads the word.
 */
function StabilityProbe() {
  const [renders, setRenders] = useState(0);
  const previous = useRef<object | null>(null);
  const text = useLabels("chart", PROBE_DEFAULTS);
  // The first render has nothing to compare with; every later one compares the object it was given with the last one.
  const result = renders === 0 ? "first" : previous.current === text ? "same" : "changed";
  previous.current = text;
  return (
    <button type="button" onClick={() => setRenders((value) => value + 1)}>
      {`Re-render (${renders}): ${result}`}
    </button>
  );
}

function Bench({ probe = false }: { probe?: boolean }) {
  return (
    <Page
      description="The same pieces three times: as they ship, with a product's Spanish, and with Arabic in a right-to-left frame."
      title="Labels"
    >
      <Block title="As they ship" description="Every word is the English default; nothing here needs a label.">
        <Frame>
          <div data-labels-frame="english" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <Sheet probe={probe} words={ENGLISH_WORDS} />
          </div>
        </Frame>
      </Block>
      <Block title="In Spanish" description="One provider sets the words and the locale of every piece inside it.">
        <Frame>
          <LabelsProvider labels={SPANISH} locale="es">
            <div data-labels-frame="spanish" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
              <Sheet words={SPANISH_WORDS} />
            </div>
          </LabelsProvider>
        </Frame>
      </Block>
      <Block title="In Arabic, right to left" description="The same provider with locale ar and an Arabic page.">
        <Frame dir="rtl">
          <LabelsProvider labels={ARABIC} locale="ar-u-nu-latn">
            <div data-labels-frame="arabic" lang="ar" style={{ display: "grid", gap: "var(--fui-space-4)" }}>
              <Sheet words={ARABIC_WORDS} />
            </div>
          </LabelsProvider>
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Labels",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
export const Stability: Story = { render: () => <Bench probe /> };

const TODAY = new Date(2026, 10, 10);

/** A calendar with no locale, and the same one inside a provider: the browser's own language changes neither. */
export const Calendars: Story = {
  render: () => (
    <Page description="A calendar with no locale, and the same one inside a provider that sets one." title="Labels and the calendar">
      <Block title="Without a locale" description="English, whatever the browser asks for.">
        <Frame width={360}>
          <div data-calendar="plain">
            <Calendar selected={TODAY} today={TODAY} />
          </div>
        </Frame>
      </Block>
      <Block title="A provider's locale" description="Japanese month and weekday names, the week from its own rules, and the arrows named in Japanese.">
        <Frame width={360}>
          <LabelsProvider labels={{ calendar: { previousMonth: "前の月", nextMonth: "次の月" } }} locale="ja">
            <div data-calendar="japanese">
              <Calendar selected={TODAY} today={TODAY} />
            </div>
          </LabelsProvider>
        </Frame>
      </Block>
    </Page>
  ),
};
