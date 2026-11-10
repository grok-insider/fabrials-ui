import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionBar,
  BackButton,
  Button,
  Countdown,
  ErrorState,
  Field,
  InlineConfirm,
  Input,
  ProductLockup,
  StatePage,
  ThemeProvider,
  ThemeSwitcher,
  useCountdown,
  useInlineConfirm,
  useTheme,
  useViewportInsets,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

// A fixed moment: every clock in the bench is read against it, so the pictures never change.
const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);
const stack = { display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" } as const;
const nothing = () => {};

/** Presses the answer once, the way a person does who has not ticked the box: the bench shows what they are told. */
function Pressed({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>(".fui-inline-confirm-actions > .fui-button:last-child")?.click();
  }, []);
  return <div ref={ref}>{children}</div>;
}

function ThemeReading() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div style={row}>
      <ThemeSwitcher onValueChange={setTheme} showLabels value={theme} />
      <output data-testid="theme-reading" style={{ fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)", color: "var(--muted-foreground)" }}>
        Choice {theme}, painted {resolvedTheme}
      </output>
    </div>
  );
}

/** A provider whose theme lands on a box of its own, so the story does not fight Storybook's theme switch on the root. */
function ThemeIsland({ storageKey, themeColor }: { storageKey: string; themeColor?: { light: string; dark: string } }) {
  const island = useRef<HTMLDivElement>(null);
  return (
    <ThemeProvider attribute="class" storageKey={storageKey} target={island} themeColor={themeColor}>
      <div
        data-testid="theme-island"
        ref={island}
        style={{ ...stack, padding: "var(--fui-space-4)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", background: "var(--background)", color: "var(--foreground)" }}
      >
        <ThemeReading />
        <p style={{ margin: 0, color: "var(--muted-foreground)" }}>This box carries the theme; the page around it keeps its own.</p>
      </div>
    </ThemeProvider>
  );
}

/** A tall form in a scroll region of its own, opened at its end: the question sits whole above the sticky bar. */
function FormAtItsEnd() {
  const region = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (region.current) region.current.scrollTop = region.current.scrollHeight;
  }, []);
  return (
    <div
      aria-label="Shipping details"
      ref={region}
      role="region"
      style={{ blockSize: "22rem", overflow: "auto", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", background: "var(--card)" }}
      tabIndex={0}
    >
      <div style={{ ...stack, padding: "var(--fui-space-4)" }}>
        {["Name", "Street", "City", "Postcode", "Country", "Phone"].map((label) => (
          <Field key={label} label={label}>
            {(field) => <Input {...field} defaultValue="" />}
          </Field>
        ))}
        <InlineConfirm
          autoFocus={false}
          cancelLabel="Keep editing"
          confirmLabel="Discard"
          description="The six fields above go back to what was saved."
          destructive
          onConfirm={nothing}
          open
          title="Discard your changes?"
        />
      </div>
      <ActionBar
        aria-label="Form actions"
        end={
          <>
            <Button variant="outline">Discard</Button>
            <Button>Save address</Button>
          </>
        }
        start={<span style={{ color: "var(--muted-foreground)" }}>Edited 2 fields</span>}
      />
    </div>
  );
}

function Bench() {
  return (
    <Page description="Questions asked in place, clocks that count to a deadline, the theme choice, whole-page states and the sticky bar of a step, each in fixed states." title="States and time">
      <Block title="Inline confirm" description="Closed with the control that asks, open, destructive, pending, failed, and pressed with its box empty.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <Frame>
            <div style={row}>
              <Button aria-expanded={false} variant="outline">
                End session
              </Button>
              <span style={{ color: "var(--muted-foreground)" }}>Closed: nothing is rendered.</span>
            </div>
          </Frame>
          <Frame>
            <InlineConfirm autoFocus={false} cancelLabel="Keep going" confirmLabel="End session" description="What you answered so far is kept." onConfirm={nothing} open title="End the session early?" />
          </Frame>
          <Frame>
            <InlineConfirm
              autoFocus={false}
              cancelLabel="Keep going"
              confirmLabel="Abandon the exam"
              description="An abandoned exam has no result and cannot be resumed."
              destructive
              onConfirm={nothing}
              open
              title="Abandon the exam?"
            />
          </Frame>
          <Frame>
            <InlineConfirm autoFocus={false} cancelLabel="Keep talking" confirmLabel="End and review" description="The review can take a minute." onConfirm={nothing} open pending pendingLabel="Making the review" title="End the conversation?" />
          </Frame>
          <Frame>
            <InlineConfirm
              autoFocus={false}
              cancelLabel="Keep talking"
              confirmLabel="Try again"
              description="The review can take a minute."
              error="The review could not be made: the connection dropped. Try again."
              onConfirm={nothing}
              open
              title="End the conversation?"
            />
          </Frame>
          <Frame>
            <Pressed>
              <InlineConfirm
                acknowledgement={{ label: "I agree that this recording is kept for 30 days and then deleted." }}
                autoFocus={false}
                cancelLabel="Not now"
                confirmLabel="Keep the recording"
                description="0:42, 310 KB. Nothing leaves this device until you agree."
                onConfirm={nothing}
                open
                title="Keep this recording?"
              />
            </Pressed>
          </Frame>
          <Frame>
            <InlineConfirm autoFocus={false} cancelLabel="Stay on this step" confirmLabel="Skip for now" description="A skipped step comes back later. Why are you skipping it?" headingLevel={3} onConfirm={nothing} open title="Skip this step?">
              <div style={row}>
                <Button size="sm" variant="secondary">
                  I cannot play sound
                </Button>
                <Button size="sm" variant="secondary">
                  I have no microphone
                </Button>
              </div>
            </InlineConfirm>
          </Frame>
        </div>
      </Block>
      <Block title="Countdown" description="Calm, low under five minutes, urgent under one, and up; the small size, the clock alone, an hour, another script's digits, and no deadline.">
        <Frame>
          <div style={row}>
            <Countdown deadline={NOW + 754_000} now={NOW} />
            <Countdown deadline={NOW + 299_000} now={NOW} />
            <Countdown deadline={NOW + 45_000} now={NOW} />
            <Countdown deadline={NOW - 1_000} now={NOW} />
          </div>
          <div style={{ ...row, marginBlockStart: "var(--fui-space-3)" }}>
            <Countdown deadline={NOW + 754_000} now={NOW} size="sm" />
            <Countdown deadline={NOW + 299_000} now={NOW} size="sm" />
            <Countdown deadline={NOW + 45_000} now={NOW} size="sm" />
            <Countdown deadline={NOW - 1_000} now={NOW} size="sm" />
          </div>
          <div style={{ ...row, marginBlockStart: "var(--fui-space-3)" }}>
            <Countdown deadline={NOW + 240_000} hideLabel label="Section 2 closes in" now={NOW} />
            <Countdown deadline={NOW + 5_025_000} label="Exam" now={NOW} />
            <Countdown deadline={NOW + 600_000} format="mm:ss" label="Break" now={NOW} />
            <Countdown deadline={NOW + 299_000} label="الوقت المتبقي" lang="ar" locale="ar-EG" now={NOW} />
            <Countdown deadline={null} label="No limit" now={NOW} />
          </div>
        </Frame>
      </Block>
      <Block title="Theme provider" description="The choice and what it comes to, with the switcher taking the provider's value as it is.">
        <Frame width={520}>
          <ThemeIsland storageKey="fui-bench-theme" />
        </Frame>
      </Block>
      <Block title="State page" description="A page outside the shell: the brand, a code, the title, what to do. Anchored to the gutter, and centred on request.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))", gap: "var(--fui-space-4)" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "clip" }}>
            <StatePage
              actions={
                <>
                  <a className="fui-button" data-size="default" href="#home">
                    Back to chats
                  </a>
                  <BackButton fallbackHref="#home" />
                </>
              }
              as="div"
              brand={
                <a aria-label="Fabrials home" href="#home" style={{ color: "inherit", textDecoration: "none" }}>
                  <ProductLockup product="Fabrials" />
                </a>
              }
              code="404"
              description="The link may be old, or the chat may have been deleted."
              headingLevel={3}
              style={{ "--fui-state-page-size": "26rem" } as CSSProperties}
              title="This page does not exist"
            />
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "clip" }}>
            <StatePage
              actions={<Button variant="outline">Try again</Button>}
              align="center"
              as="div"
              code="Offline"
              description="Your drafts are kept on this device and sent when you are back."
              headingLevel={3}
              style={{ "--fui-state-page-size": "26rem" } as CSSProperties}
              title="You are offline"
            />
          </div>
        </div>
      </Block>
      <Block title="Error state" description="A route that failed: a retry, a way home and the reference to quote; then the bare panel, and one retrying.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <ErrorState error={{ digest: "3f9a1c07" }} headingLevel={3} homeHref="#home" onRetry={nothing} />
          <ErrorState description="The usage for November could not be read." headingLevel={3} title="Usage is unavailable" />
          <ErrorState headingLevel={3} onRetry={nothing} reference="req_81b2" retrying size="sm" />
        </div>
      </Block>
      <Block title="Action bar" description="The sticky bar of a form, at the end of a tall scroll region, with a question open above it; and a narrow bar, whose actions share a row.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-4)", alignItems: "start" }}>
          <FormAtItsEnd />
          {/* A scroll container of its own, as the form beside it: in a full-page picture a bar that sticks to the window is drawn where the window ends. */}
          <div style={{ maxInlineSize: "20rem", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "auto", background: "var(--card)" }}>
            <p style={{ margin: 0, padding: "var(--fui-space-4)" }}>Which word means “harbour”?</p>
            <ActionBar
              aria-label="Step actions"
              end={
                <>
                  <Button variant="outline">Skip</Button>
                  <Button>Check</Button>
                </>
              }
              start={<span style={{ color: "var(--muted-foreground)" }}>Step 3 of 12</span>}
            />
          </div>
        </div>
      </Block>
      <Block title="Right to left" description="The arrow turns, the answers and the bar follow the direction, and the clock keeps its order.">
        <Frame dir="rtl" width={420}>
          <div lang="ar" style={stack}>
            <div style={row}>
              <BackButton fallbackHref="#home">رجوع</BackButton>
              <Countdown deadline={NOW + 299_000} label="الوقت المتبقي" labels={{ done: "انتهى الوقت", left: () => "الوقت المتبقي" }} locale="ar-EG" now={NOW} />
            </div>
            <InlineConfirm
              acknowledgement={{ label: "أوافق على حفظ التسجيل لمدة ٣٠ يومًا." }}
              autoFocus={false}
              cancelLabel="متابعة"
              confirmLabel="إنهاء الجلسة"
              description="ستُحفظ إجاباتك حتى الآن."
              destructive
              onConfirm={nothing}
              open
              title="إنهاء الجلسة مبكرًا؟"
            />
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", overflow: "auto" }}>
              <ActionBar
                aria-label="إجراءات الخطوة"
                end={
                  <>
                    <Button variant="outline">تخطي</Button>
                    <Button>تحقق</Button>
                  </>
                }
                start={<span style={{ color: "var(--muted-foreground)" }}>الخطوة ٣ من ١٢</span>}
              />
            </div>
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/States and time",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const paragraphs = Array.from({ length: 14 }, (_, index) => `Step ${index + 1}. Read the sentence aloud, then listen to it once more before you answer.`);

/** A long page whose card ends in a sticky bar: three questions asked from the bar and answered above it. */
function Flow() {
  const end = useInlineConfirm();
  const [asking, setAsking] = useState<null | "abandon" | "keep">(null);
  const abandon = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const attempts = useRef(0);
  const [days, setDays] = useState(30);
  const note = (line: string) => setLog((lines) => [...lines, line]);
  useViewportInsets();
  return (
    <main className="catalogue">
      <h1 style={{ margin: 0, fontSize: "var(--fui-text-title)" }}>Session</h1>
      <output data-testid="log" style={{ display: "block", minBlockSize: "1.5rem", color: "var(--muted-foreground)" }}>
        {log.join(", ")}
      </output>
      <section style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", background: "var(--card)", overflow: "clip" }}>
        <div style={{ ...stack, padding: "var(--fui-space-4)" }}>
          {paragraphs.map((text) => (
            <p key={text} style={{ margin: 0, minBlockSize: "5rem" }}>
              {text}
            </p>
          ))}
          <InlineConfirm
            {...end.confirmProps}
            cancelLabel="Keep going"
            confirmLabel="End session"
            description="What you answered so far is kept."
            onCancel={() => note("kept going")}
            onConfirm={async () => {
              note("ending");
              await wait(400);
              note("ended");
            }}
            pendingLabel="Ending"
            title="End the session early?"
          />
          <InlineConfirm
            cancelLabel="Keep going"
            confirmLabel="Abandon the exam"
            description="An abandoned exam has no result."
            destructive
            onConfirm={async () => {
              attempts.current += 1;
              await wait(100);
              if (attempts.current === 1) throw new Error("The connection dropped. Try again.");
              note("abandoned");
            }}
            onOpenChange={() => setAsking(null)}
            open={asking === "abandon"}
            returnFocusRef={abandon}
            title="Abandon the exam?"
          />
          <InlineConfirm
            acknowledgement={{ label: `I agree that this recording is kept for ${days} days.`, error: "Tick the box to keep the recording" }}
            acknowledgementKey={days}
            cancelLabel="Not now"
            confirmLabel="Keep the recording"
            onConfirm={({ acknowledged }) => note(`kept for ${days} days, agreed ${acknowledged}`)}
            onOpenChange={() => setAsking(null)}
            open={asking === "keep"}
            returnFocusRef={keep}
            title="Keep this recording?"
          >
            <div style={row}>
              <Button onClick={() => setDays(days === 30 ? 90 : 30)} size="sm" variant="secondary">
                Keep it for {days === 30 ? 90 : 30} days instead
              </Button>
            </div>
          </InlineConfirm>
        </div>
        <ActionBar
          aria-label="Session actions"
          end={
            <>
              <Button {...end.triggerProps} variant="outline">
                End session
              </Button>
              <Button aria-expanded={asking === "abandon"} onClick={() => setAsking("abandon")} ref={abandon} variant="outline">
                Abandon
              </Button>
              <Button aria-expanded={asking === "keep"} onClick={() => setAsking("keep")} ref={keep}>
                Keep recording
              </Button>
            </>
          }
        />
      </section>
    </main>
  );
}

export const ConfirmFlow: Story = { render: () => <Flow /> };

function Clock({ deadline }: { deadline: number }) {
  const [done, setDone] = useState(0);
  const state = useCountdown(deadline, { marks: [300, 60, 10] });
  return (
    <main className="catalogue" style={stack}>
      <h1 style={{ margin: 0, fontSize: "var(--fui-text-title)" }}>Clock</h1>
      <div style={row}>
        <Countdown deadline={deadline} marks={[300, 60, 10]} onDone={() => setDone((count) => count + 1)} />
        <Countdown deadline={deadline} hideLabel label="The same deadline" size="sm" />
      </div>
      <output data-testid="done">Done {done}</output>
      <output data-testid="hook">{JSON.stringify(state)}</output>
    </main>
  );
}

// The test owns the browser's clock and passes the deadline as a moment on it.
export const Ticking: StoryObj<{ deadline: number }> = {
  args: { deadline: NOW + 365_000 },
  render: (args) => <Clock {...args} />,
};

export const Theme: Story = {
  render: () => (
    <main className="catalogue" style={stack}>
      <h1 style={{ margin: 0, fontSize: "var(--fui-text-title)" }}>Theme</h1>
      <ThemeIsland storageKey="fui-story-theme" themeColor={{ light: "#f6f7f8", dark: "#08090b" }} />
    </main>
  ),
};

function Back() {
  const [went, setWent] = useState("");
  return (
    <main className="catalogue" style={stack}>
      <h1 style={{ margin: 0, fontSize: "var(--fui-text-title)" }}>Back</h1>
      <div style={row}>
        <BackButton fallbackHref="#fallback" />
        <BackButton fallbackHref="/inbox" onNavigate={setWent}>
          Back with a router
        </BackButton>
        <BackButton render={<a href="#linked" />} variant="ghost">
          Back as a link
        </BackButton>
      </div>
      <output data-testid="went">{went}</output>
    </main>
  );
}

export const BackKeys: Story = { render: () => <Back /> };
