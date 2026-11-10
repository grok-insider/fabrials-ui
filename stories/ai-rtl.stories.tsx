import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActivityDisclosure,
  AgentThinking,
  Attachments,
  ChatComposer,
  ChatMessage,
  CitationChip,
  CitationProvider,
  CodeBlock,
  ComposerButton,
  ComposerToggle,
  CopyMessageAction,
  GenerationFrame,
  MessageAction,
  MessageActions,
  MessageTimestamp,
  ReasoningDisclosure,
  SearchStepsDisclosure,
  Sources,
  TaskList,
  VoiceInputButtonView,
  type AttachmentItem,
  type CitationSource,
  type SearchStep,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS } from "./media-fixtures";

// The chat pieces in a right-to-left page, in fixed states, for the visual suite. The words are synthetic Arabic; code, URLs
// and file names stay left to right, as they do in a real conversation.
function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d={d} />
    </svg>
  );
}

const retry = "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5";
const terminal = "m4 17 6-6-6-6M12 19h8";
const globe = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20";
const clip = "m21 12-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8";

const sources: CitationSource[] = [
  { url: "https://docs.example.org/guides/cascade-layers", title: "طبقات التتالي عمليًا" },
  { url: "https://www.example.com/blog/2026/tokens", title: "رموز التصميم بين المنتجات" },
  { url: "https://reference.example.net/css/logical-properties" },
];

const steps: SearchStep[] = [
  {
    type: "search",
    query: "ترتيب طبقات التتالي في مكتبات المكوّنات",
    sources: ["https://developer.example.org/docs/css/cascade-layers", "https://blog.example.com/2026/layers-in-design-systems"],
  },
  { type: "search", query: "الخصائص المنطقية في CSS", sources: ["https://reference.example.net/css/logical-properties"] },
  { type: "open_page", url: "https://docs.example.org/guides/cascade-layers", title: "دليل طبقات التتالي" },
];

const importCode = `import "@fabrials/ui/tokens.css";
import "@fabrials/ui/styles.css";
import "@fabrials/ai-ui/styles.css";`;

const files: AttachmentItem[] = [
  { id: "photo", name: "harbour.png", mediaType: "image/png", size: 248_000, url: PHOTOS[0]!.src, status: "ready" },
  { id: "sheet", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.36 },
  { id: "scan", name: "scan.tiff", mediaType: "image/tiff", status: "error", error: "الملف أكبر من ٢٠ ميغابايت" },
];

const removeLabel = (item: AttachmentItem) => `إزالة ${item.name}`;
const sourcesLabel = (count: number) => `${count} مصادر`;

function Arabic({ width, children }: { width?: number; children: ReactNode }) {
  return (
    <Frame dir="rtl" width={width}>
      <div lang="ar" style={{ display: "grid", gap: "var(--fui-space-4)", gridTemplateColumns: "minmax(0, 1fr)" }}>
        {children}
      </div>
    </Frame>
  );
}

function Actions({ copy, latest = false }: { copy: string; latest?: boolean }) {
  return (
    <MessageActions>
      <CopyMessageAction copiedLabel="تم النسخ" label="نسخ" text={copy} />
      {latest ? (
        <MessageAction label="إعادة المحاولة">
          <Icon d={retry} />
        </MessageAction>
      ) : null}
      <MessageTimestamp dateTime="2026-11-10T10:42:00Z" label="10:42" />
    </MessageActions>
  );
}

function Answer() {
  return (
    <div className="fui-markdown">
      <h3>ترتيب الاستيراد</h3>
      <p>
        استورد الرموز ثم الأنماط مرة واحدة، بهذا الترتيب
        <CitationChip href={sources[0]!.url} number={1} />. الأنماط المشتركة تعيش في الطبقة <code>components</code> والمنتج يكتب بعدها
        <CitationChip href={sources[1]!.url} number={2} />.
      </p>
      <ol>
        <li>استورد ملف الرموز.</li>
        <li>
          استورد أنماط المكوّنات.
          <ul>
            <li>العناصر المتداخلة تحتفظ بعلاماتها.</li>
          </ul>
        </li>
        <li>اكتب أنماط المنتج في النهاية.</li>
      </ol>
      <blockquote>
        <p>اللون يرافقه دائمًا نص أو رمز.</p>
      </blockquote>
      <CodeBlock code={importCode} copiedLabel="تم النسخ" copyLabel="نسخ الشيفرة" filename="app.ts" language="ts" lineNumbers />
      <table>
        <thead>
          <tr>
            <th>السطح</th>
            <th>العرض</th>
            <th>ارتفاع الأزرار</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>الهاتف</td>
            <td>390</td>
            <td>44px</td>
          </tr>
          <tr>
            <td>سطح المكتب</td>
            <td>1440</td>
            <td>40px</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Bench() {
  return (
    <Page description="The chat pieces in a right-to-left page: what was written for the left side now follows the reading direction, and code stays left to right." title="AI right to left">
      <Block title="A conversation" description="A question, then an answer with its search, its reasoning, markdown, sources and actions.">
        <Arabic width={720}>
          <CitationProvider sources={sources}>
            <ChatMessage actions={<Actions copy="كيف أستورد الأنماط المشتركة في تطبيقي؟" />} from="user" pinActions>
              كيف أستورد الأنماط المشتركة في تطبيقي؟
            </ChatMessage>
            <ChatMessage actions={<Actions copy="استورد الرموز ثم الأنماط مرة واحدة." latest />} from="assistant" pinActions>
              <SearchStepsDisclosure defaultOpen label="بحث في الويب · ٣ مصادر" phase="done" sourceCount={3} steps={steps} />
              <ReasoningDisclosure defaultOpen durationSeconds={4} labels={{ thoughtFor: (seconds) => `فكّر لمدة ${seconds} ثوانٍ` }}>
                <div className="fui-markdown">
                  <p>أقارن ترتيبَي الطبقات قبل اختيار أحدهما.</p>
                </div>
              </ReasoningDisclosure>
              <Answer />
              <Sources defaultOpen label={sourcesLabel} sources={sources} />
            </ChatMessage>
          </CitationProvider>
        </Arabic>
      </Block>
      <Block title="Work in progress" description="A search that is still running, a generic activity, the marks that sweep and write, a plan and a page being written.">
        <Arabic width={520}>
          <SearchStepsDisclosure defaultOpen label="يبحث في الويب…" phase="searching" steps={steps.slice(0, 1)} timer={false} />
          <ActivityDisclosure icon={<Icon d={terminal} />} label="أجرى عملية حسابية" live={false}>
            <p style={{ margin: 0 }}>المجموع ٤٨٬٢١٠ فاتورة.</p>
          </ActivityDisclosure>
          <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
            <AgentThinking activity="searching" label="يبحث في المستندات" timer={false} />
            <AgentThinking activity="reading" label="يقرأ ملاحظات الإصدار" timer={false} />
            <AgentThinking activity="writing" label="يكتب الإجابة" timer={false} />
          </div>
          <TaskList
            label="خطة البحث"
            labels={{ done: "تم", running: "قيد التنفيذ", pending: "بالانتظار", failed: "فشل", skipped: "تم التخطي", progress: (done, total) => `${done} من ${total}` }}
            tasks={[
              { id: "a", title: "قراءة المخطط", status: "done", meta: "0.9s" },
              { id: "b", title: "نسخ الفواتير", status: "running", detail: "الدفعة ٧ من ١٢", activity: "writing" },
              { id: "c", title: "تحديث سجل التغييرات", status: "pending" },
            ]}
            title="الإصدار 0.12"
          />
          <div style={{ maxWidth: "12rem" }}>
            <GenerationFrame alt="ملاحظات الإصدار" aspectRatio="3 / 4" kind="document" label="يكتب المستند" progress={0.35} status="generating" />
          </div>
          <ChatMessage from="assistant" streaming>
            <div className="fui-markdown">
              <p>استورد الرموز ثم الأنماط مرة واحدة</p>
            </div>
          </ChatMessage>
        </Arabic>
      </Block>
      <Block title="Attachments" description="Tiles, chips and rows: ready, uploading and failed. The remove key sits at the inline end.">
        <Arabic>
          <Attachments items={files} label="المرفقات" onRemove={() => {}} removeLabel={removeLabel} variant="grid" />
          <Attachments items={files} label="المرفقات" onRemove={() => {}} removeLabel={removeLabel} />
          <Attachments items={files.slice(1)} label="المرفقات" onRemove={() => {}} removeLabel={removeLabel} variant="list" />
        </Arabic>
      </Block>
      <Block title="The composer" description="Files in small tiles, a tool, a pressed toggle, dictation recording and the send key.">
        <Arabic width={560}>
          <ChatComposer
            attachments={<Attachments items={files.slice(0, 2)} label="المرفقات" onRemove={() => {}} removeLabel={removeLabel} size="sm" variant="grid" />}
            label="رسالة إلى المساعد"
            onSubmit={() => {}}
            placeholder="اسأل عن أي شيء"
            sendLabel="إرسال"
            tools={
              <>
                <ComposerButton icon={<Icon d={clip} />} label="إرفاق ملفات" onClick={() => {}} />
                <ComposerToggle icon={<Icon d={globe} />} label="البحث في الويب" onPressedChange={() => {}} pressed>
                  بحث
                </ComposerToggle>
                <ComposerToggle icon={<Icon d={terminal} />} label="تشغيل الشيفرة" onPressedChange={() => {}} pressed={false}>
                  شيفرة
                </ComposerToggle>
              </>
            }
            trailing={
              <>
                <VoiceInputButtonView elapsedMs={14_000} labels={{ recording: "إيقاف التسجيل", stopHint: "إيقاف ونسخ الكلام" }} level={0.6} maxDurationMs={120_000} status="recording" />
                <VoiceInputButtonView error="الميكروفون محجوب." labels={{ idle: "إملاء" }} status="error" />
              </>
            }
            value="قارن هذه الملفات بالربع الماضي"
          />
        </Arabic>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/AI RTL",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
