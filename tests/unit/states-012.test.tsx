import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActionBar,
  BackButton,
  COUNTDOWN_MARKS,
  Countdown,
  ErrorState,
  InlineConfirm,
  StatePage,
  ThemeProvider,
  ThemeSwitcher,
  clockOffset,
  crossedMark,
  deadlineTime,
  formatCountdown,
  keyboardInset,
  remainingMs,
  themeConfig,
  themeInitScript,
  themeRuntime,
  toneOf,
  useCountdown,
  useInlineConfirm,
  useTheme,
  wholeSeconds,
  type ThemeOptions,
  type ThemeWindow,
  type UseCountdownOptions,
} from "../../packages/ui/src/index";
import { uiStyles } from "./read-styles";

const styles = uiStyles();
const marker = styles.indexOf("0.12: states and time");
assert.ok(marker > 0, "the block carries its marker comment");
// The block's own text: from its marker to the brace that closes its layer.
const block = (() => {
  const open = styles.lastIndexOf("@layer components {", marker);
  let depth = 0;
  for (let at = styles.indexOf("{", open); at < styles.length; at += 1) {
    if (styles[at] === "{") depth += 1;
    if (styles[at] === "}" && --depth === 0) return styles.slice(open, at + 1);
  }
  throw new Error("unbalanced block");
})();
const rule = (selector: string, within = block) => {
  const at = within.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return within.slice(at, within.indexOf("}", at) + 1);
};
const mediaBlock = (query: string) => {
  const open = block.indexOf(query);
  assert.ok(open >= 0, `missing ${query}`);
  let depth = 0;
  for (let at = block.indexOf("{", open); at < block.length; at += 1) {
    if (block[at] === "{") depth += 1;
    if (block[at] === "}" && --depth === 0) return block.slice(open, at + 1);
  }
  throw new Error("unbalanced media block");
};

const T0 = Date.UTC(2026, 10, 10, 9, 0, 0);

// ------------------------------------------------------------------ countdown logic

test("a deadline is a Date, a number or an ISO string; anything else is no deadline", () => {
  assert.equal(deadlineTime(new Date(T0)), T0);
  assert.equal(deadlineTime(T0), T0);
  assert.equal(deadlineTime("2026-11-10T09:00:00Z"), T0);
  assert.equal(deadlineTime("2026-11-10T10:00:00+01:00"), T0);
  for (const none of [null, undefined, "", "soon", Number.NaN, Number.POSITIVE_INFINITY, new Date("nope")]) assert.equal(deadlineTime(none), null);
  assert.equal(deadlineTime(0), 0);
});

test("the offset is the server's clock minus this one, and 0 when the server gave no usable time", () => {
  assert.equal(clockOffset(T0 + 4_000, T0), 4_000);
  assert.equal(clockOffset(new Date(T0 - 90_000), T0), -90_000);
  assert.equal(clockOffset("2026-11-10T09:00:00Z", T0 - 250), 250);
  for (const none of [null, undefined, "", "later"]) assert.equal(clockOffset(none, T0), 0);
});

test("the time left is the deadline minus the corrected now, never negative, and null without a deadline", () => {
  assert.equal(remainingMs(T0 + 60_000, 0, T0), 60_000);
  assert.equal(remainingMs(new Date(T0 + 60_000), 0, T0 + 59_999), 1);
  assert.equal(remainingMs(T0, 0, T0), 0);
  assert.equal(remainingMs(T0, 0, T0 + 5_000), 0);
  // A browser clock 30 s behind the server's has 30 s less than it thinks; one that was set back gains nothing.
  assert.equal(remainingMs(T0 + 60_000, 30_000, T0), 30_000);
  assert.equal(remainingMs(T0 + 60_000, clockOffset(T0, T0 - 3_600_000), T0 - 3_600_000), 60_000);
  assert.equal(remainingMs(T0 + 60_000, -30_000, T0), 90_000);
  for (const none of [null, undefined, "x"]) assert.equal(remainingMs(none, 0, T0), null);
});

test("seconds are rounded up, so the clock reads zero only when the time is up", () => {
  assert.deepEqual([0, 1, 999, 1000, 1001, 59_001, 60_000].map(wholeSeconds), [0, 1, 1, 1, 2, 60, 60]);
  assert.equal(wholeSeconds(-250), 0);
});

test("a mark is crossed once, on the way down; the end is always a mark; a sleep gives the latest; a first reading gives none", () => {
  assert.deepEqual([...COUNTDOWN_MARKS], [600, 300, 120, 60]);
  assert.equal(crossedMark(null, 300), null);
  assert.equal(crossedMark(601, 600), 600);
  assert.equal(crossedMark(600, 599), null);
  assert.equal(crossedMark(301, 300), 300);
  assert.equal(crossedMark(300, 300), null);
  assert.equal(crossedMark(250, 240), null);
  assert.equal(crossedMark(121, 119), 120);
  assert.equal(crossedMark(61, 60), 60);
  assert.equal(crossedMark(1, 0), 0);
  assert.equal(crossedMark(0, 0), null);
  // A tab that slept through three marks hears only the last one, and through the end, only the end.
  assert.equal(crossedMark(700, 100), 120);
  assert.equal(crossedMark(700, 0), 0);
  // The clock corrected upwards crosses nothing.
  assert.equal(crossedMark(100, 700), null);
  // A product's own marks, in any order; the end stays one.
  assert.equal(crossedMark(31, 30, [10, 30]), 30);
  assert.equal(crossedMark(31, 5, [30, 10]), 10);
  assert.equal(crossedMark(61, 60, [30, 10]), null);
  assert.equal(crossedMark(2, 0, []), 0);
});

test("the tone is calm, low at five minutes and urgent at one, or at the thresholds given", () => {
  assert.deepEqual([3600, 301, 300, 299, 61, 60, 59, 1, 0].map((seconds) => toneOf(seconds)), ["calm", "calm", "low", "low", "low", "urgent", "urgent", "urgent", "urgent"]);
  assert.equal(toneOf(600, { low: 900 }), "low");
  assert.equal(toneOf(600, { low: 900, urgent: 600 }), "urgent");
  // One threshold given: the other keeps its default.
  assert.equal(toneOf(60, { low: 900 }), "urgent");
  assert.equal(toneOf(200, { urgent: 10 }), "low");
  assert.equal(toneOf(11, { urgent: 10 }), "low");
});

test("the clock is written m:ss, with hours from an hour up, rounded up, in the digits of the locale", () => {
  assert.equal(formatCountdown(0), "0:00");
  assert.equal(formatCountdown(-5_000), "0:00");
  assert.equal(formatCountdown(1), "0:01");
  assert.equal(formatCountdown(1_000), "0:01");
  assert.equal(formatCountdown(59_001), "1:00");
  assert.equal(formatCountdown(299_000), "4:59");
  assert.equal(formatCountdown(600_000), "10:00");
  assert.equal(formatCountdown(3_599_000), "59:59");
  assert.equal(formatCountdown(3_600_000), "1:00:00");
  assert.equal(formatCountdown(3_904_000), "1:05:04");
  assert.equal(formatCountdown(36_000_000), "10:00:00");
  assert.equal(formatCountdown(299_000, "en", { format: "mm:ss" }), "04:59");
  assert.equal(formatCountdown(5_400_000, "en", { format: "mm:ss" }), "90:00");
  assert.equal(formatCountdown(299_000, "en", { format: "h:mm:ss" }), "0:04:59");
  // Time that has passed is rounded down.
  assert.equal(formatCountdown(1_999, "en", { round: "down" }), "0:01");
  assert.equal(formatCountdown(1_999, "en"), "0:02");
  // The reader's own digits; the colon stays.
  assert.equal(formatCountdown(299_000, "ar-EG"), "٤:٥٩");
  assert.equal(formatCountdown(3_904_000, "fa"), "۱:۰۵:۰۴");
  // Thousands are never grouped.
  assert.equal(formatCountdown(100_000 * 60_000, "en", { format: "mm:ss" }), "100000:00");
});

test("the clock's arithmetic and the theme script are modules a server can call: no directive, nothing imported but types", () => {
  for (const name of ["countdown-logic.ts", "theme-script.ts"]) {
    const source = readFileSync(new URL(`../../packages/ui/src/${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /["']use client["']/, name);
    for (const line of source.split("\n").filter((text) => /^import\b/.test(text))) assert.match(line, /^import type /, `${name}: ${line}`);
    // Nothing in them reaches for the browser on its own: every clock, window and document is an argument.
    assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""), /(?<![.\w])(?:window|document|localStorage|navigator)\.|Date\.now\(/, name);
  }
});

// ------------------------------------------------------------------ countdown markup

function Reading({ deadline, options }: { deadline: number | null; options?: UseCountdownOptions }) {
  return <output>{JSON.stringify(useCountdown(deadline, options))}</output>;
}
const reading = (deadline: number | null, options?: UseCountdownOptions) =>
  JSON.parse(renderToStaticMarkup(<Reading deadline={deadline} options={options} />).replace(/<\/?output>/g, "").replace(/&quot;/g, '"'));

test("on a server there is no clock: the hook reads nothing, and a fixed now reads the same everywhere", () => {
  assert.deepEqual(reading(T0 + 60_000), { remainingMs: null, seconds: null, done: false, tone: "calm", crossed: null });
  assert.deepEqual(reading(null, { now: T0 }), { remainingMs: null, seconds: null, done: false, tone: "calm", crossed: null });
  assert.deepEqual(reading(T0 + 299_400, { now: T0 }), { remainingMs: 300_000, seconds: 300, done: false, tone: "low", crossed: null });
  assert.deepEqual(reading(T0 + 299_400, { now: T0, precision: 100 }), { remainingMs: 299_400, seconds: 300, done: false, tone: "low", crossed: null });
  assert.deepEqual(reading(T0 + 299_400, { now: T0, offset: 250_000 }), { remainingMs: 50_000, seconds: 50, done: false, tone: "urgent", crossed: null });
  assert.deepEqual(reading(T0 - 1, { now: T0 }), { remainingMs: 0, seconds: 0, done: true, tone: "urgent", crossed: null });
  assert.deepEqual(reading(T0 + 500_000, { now: T0, thresholds: { low: 600 } }).tone, "low");
});

test("the clock is a named timer that is never live; one polite region beside it speaks, and starts empty", () => {
  const html = renderToStaticMarkup(<Countdown deadline={T0 + 754_000} now={T0} />);
  assert.match(html, /^<div data-slot="countdown" class="fui-countdown" data-tone="calm" data-size="md">/);
  const timer = html.match(/<span ([^>]*role="timer"[^>]*)>/)![1]!;
  assert.match(timer, /aria-label="Time left"/);
  assert.doesNotMatch(timer, /aria-live/);
  // The digits are for the eye, pinned left to right; a screen reader gets the words.
  assert.match(html, /<span aria-hidden="true" class="fui-countdown-clock" dir="ltr">12:34<\/span>/);
  assert.match(html, /<span class="fui-sr-only">12 minutes 34 seconds left<\/span>/);
  assert.match(html, /<span aria-hidden="true" class="fui-countdown-label">Time left<\/span>/);
  assert.match(html, /<svg[^>]*class="[^"]*fui-countdown-icon"[^>]*aria-hidden="true"/);
  assert.match(html, /<span aria-live="polite" class="fui-sr-only" role="status"><\/span><\/div>$/);
  assert.equal(html.match(/aria-live/g)!.length, 1);
});

test("without a clock the countdown draws its placeholder, the same on the server and at hydration", () => {
  const html = renderToStaticMarkup(<Countdown deadline={T0 + 754_000} />);
  assert.match(html, /dir="ltr">--:--<\/span>/);
  assert.match(html, /data-tone="calm"/);
  assert.match(html, /<span class="fui-sr-only"><\/span>/);
  assert.match(renderToStaticMarkup(<Countdown deadline={null} now={T0} placeholder="No limit" />), /dir="ltr">No limit<\/span>/);
});

test("tones, the end, the label, the format, the digits and the words are all the host's to set", () => {
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 240_000} now={T0} />), /data-tone="low"/);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 45_000} now={T0} />), /data-tone="urgent"/);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 45_000} now={T0} thresholds={{ urgent: 30 }} />), /data-tone="low"/);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 45_000} now={T0} tone="calm" />), /data-tone="calm"/);
  const done = renderToStaticMarkup(<Countdown deadline={T0 - 1_000} now={T0} />);
  assert.match(done, /data-tone="urgent"[^>]*data-done="true"/);
  assert.match(done, /fui-countdown-label">Time is up</);
  assert.match(done, /fui-sr-only">Time is up</);
  assert.match(done, />0:00</);
  // The icon changes with the tone, so the tone never rests on colour.
  const icon = (html: string) => html.match(/class="lucide ([\w-]+)/)![1];
  const icons = [754_000, 240_000, 45_000, -1].map((left) => icon(renderToStaticMarkup(<Countdown deadline={T0 + left} now={T0} />)));
  assert.equal(new Set(icons).size, 4);
  const hidden = renderToStaticMarkup(<Countdown deadline={T0 + 60_000} hideLabel label="Section 2" now={T0} />);
  assert.match(hidden, /aria-label="Section 2"/);
  assert.doesNotMatch(hidden, /fui-countdown-label/);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 60_000} format="mm:ss" now={T0} />), />01:00</);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 90_000} format={(seconds) => `${seconds} s`} now={T0} />), />90 s</);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 299_000} locale="ar-EG" now={T0} />), />٤:٥٩</);
  const french = renderToStaticMarkup(
    <Countdown deadline={T0 + 120_000} labels={{ left: (seconds) => `Il reste ${seconds / 60} minutes` }} now={T0} size="sm" />,
  );
  assert.match(french, /fui-sr-only">Il reste 2 minutes</);
  assert.match(french, /data-size="sm"/);
  assert.match(renderToStaticMarkup(<Countdown deadline={T0 + 3_661_000} now={T0} />), /fui-sr-only">1 hour 1 minute 1 second left</);
  assert.match(renderToStaticMarkup(<Countdown className="exam" deadline={T0} id="clock" now={T0} />), /id="clock" class="fui-countdown exam"/);
});

// ------------------------------------------------------------------ theme

type Fake = { stored?: string | null; systemDark?: boolean; storage?: "works" | "throws"; media?: "works" | "throws"; meta?: boolean; head?: boolean; classes?: string[] };

function fakeWindow({ stored = null, systemDark = false, storage = "works", media = "works", meta = true, head = true, classes = [] }: Fake, key = "theme") {
  const classList = new Set(classes);
  const attributes: Record<string, string> = {};
  const root = {
    classList: { add: (name: string) => void classList.add(name), remove: (name: string) => void classList.delete(name) },
    setAttribute: (name: string, value: string) => void (attributes[name] = value),
    style: { colorScheme: "" },
  };
  const node = () => {
    const own: Record<string, string> = {};
    return { own, setAttribute: (name: string, value: string) => void (own[name] = value) };
  };
  const existing = node();
  const appended: Array<ReturnType<typeof node>> = [];
  const queries: string[] = [];
  const win: ThemeWindow = {
    localStorage: {
      getItem(name) {
        if (storage === "throws") throw new Error("storage is denied");
        return name === key ? stored : null;
      },
    },
    matchMedia(query) {
      if (media === "throws") throw new Error("no media");
      queries.push(query);
      return { matches: systemDark };
    },
    document: {
      documentElement: root,
      head: head ? { appendChild: (child: never) => void appended.push(child) } : null,
      querySelector: (selector) => {
        queries.push(selector);
        return meta ? existing : null;
      },
      createElement: () => node(),
    },
  };
  return {
    win,
    root,
    state: () => ({
      classes: [...classList].sort(),
      attributes: { ...attributes },
      colorScheme: root.style.colorScheme,
      meta: { ...existing.own },
      appended: appended.map((child) => ({ ...child.own })),
    }),
    queries,
  };
}

const runScript = (script: string, win: ThemeWindow) => new Function("window", script)(win);

test("the config fills in the defaults and copies only what it knows", () => {
  assert.deepEqual(themeConfig(), { defaultTheme: "system", storageKey: "theme", attribute: "class", themeColor: null });
  assert.deepEqual(themeConfig({ defaultTheme: "dark", storageKey: "ui", attribute: "data-theme", themeColor: { light: "#fff", dark: "#000", extra: 1 } as never }), {
    defaultTheme: "dark",
    storageKey: "ui",
    attribute: "data-theme",
    themeColor: { light: "#fff", dark: "#000" },
  });
});

test("the script and the provider's function settle and apply the same theme, for every stored value, default, attribute and scheme", () => {
  const colours = { light: "#f6f7f8", dark: "#08090b" };
  let cases = 0;
  for (const stored of [null, "light", "dark", "system", "sepia", ""])
    for (const defaultTheme of ["light", "dark", "system"] as const)
      for (const attribute of ["class", "data-theme"] as const)
        for (const themeColor of [undefined, colours])
          for (const systemDark of [false, true])
            for (const meta of [true, false]) {
              const options: ThemeOptions = { defaultTheme, attribute, themeColor };
              const viaScript = fakeWindow({ stored, systemDark, meta, classes: ["app", "light"] });
              runScript(themeInitScript(options), viaScript.win);
              const direct = fakeWindow({ stored, systemDark, meta, classes: ["app", "light"] });
              const settled = themeRuntime(direct.win, themeConfig(options));
              assert.deepEqual(viaScript.state(), direct.state());

              const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : defaultTheme;
              const dark = theme === "dark" || (theme === "system" && systemDark);
              const scheme = dark ? "dark" : "light";
              assert.deepEqual(settled, { theme, resolvedTheme: scheme });
              const state = direct.state();
              assert.equal(state.colorScheme, scheme);
              if (attribute === "class") {
                // The other theme's class goes; classes that are not ours stay.
                assert.deepEqual(state.classes, ["app", scheme]);
                assert.deepEqual(state.attributes, {});
              } else {
                // The preference itself, so "system" keeps following in CSS with no script.
                assert.deepEqual(state.attributes, { "data-theme": theme });
                assert.deepEqual(state.classes, ["app", "light"]);
              }
              const colour = dark ? colours.dark : colours.light;
              if (!themeColor) assert.deepEqual([state.meta, state.appended], [{}, []]);
              else if (meta) assert.deepEqual([state.meta, state.appended], [{ content: colour }, []]);
              else assert.deepEqual([state.meta, state.appended], [{}, [{ name: "theme-color", content: colour }]]);
              cases += 1;
            }
  assert.equal(cases, 6 * 3 * 2 * 2 * 2 * 2);
});

test("storage that throws and a browser with no media queries still leave a working theme", () => {
  for (const run of [(win: ThemeWindow) => void themeRuntime(win, themeConfig({ defaultTheme: "dark" })), (win: ThemeWindow) => runScript(themeInitScript({ defaultTheme: "dark" }), win)]) {
    const denied = fakeWindow({ stored: "light", storage: "throws" });
    run(denied.win);
    assert.deepEqual(denied.state().classes, ["dark"]);
    assert.equal(denied.state().colorScheme, "dark");
  }
  const noMedia = fakeWindow({ stored: "system", media: "throws" });
  assert.deepEqual(themeRuntime(noMedia.win, themeConfig()), { theme: "system", resolvedTheme: "light" });
  // The script swallows what it cannot do: a page must never fail to load over its theme.
  assert.doesNotThrow(() => new Function("window", themeInitScript())({}));
});

test("a choice the caller knows wins over storage, another element can carry the theme, and reading alone touches nothing", () => {
  const chosen = fakeWindow({ stored: "light" });
  assert.deepEqual(themeRuntime(chosen.win, themeConfig(), "dark"), { theme: "dark", resolvedTheme: "dark" });
  assert.deepEqual(chosen.state().classes, ["dark"]);
  // A value that is not a theme is not a choice: storage is asked.
  assert.equal(themeRuntime(fakeWindow({ stored: "light" }).win, themeConfig(), "sepia").theme, "light");

  const island = fakeWindow({ stored: "dark" });
  const target = fakeWindow({});
  themeRuntime(island.win, themeConfig({ attribute: "data-theme" }), undefined, target.root);
  assert.deepEqual(target.state().attributes, { "data-theme": "dark" });
  assert.equal(target.state().colorScheme, "dark");
  assert.deepEqual([island.state().attributes, island.state().colorScheme], [{}, ""]);

  const reader = fakeWindow({ stored: "dark" });
  assert.deepEqual(themeRuntime(reader.win, themeConfig({ themeColor: { light: "#fff", dark: "#000" } }), undefined, null, true), { theme: "dark", resolvedTheme: "dark" });
  assert.deepEqual(reader.state(), { classes: [], attributes: {}, colorScheme: "", meta: {}, appended: [] });

  // Its own storage key, and only a theme-color that is not scoped to a media query.
  const keyed = fakeWindow({ stored: "dark" }, "radiant-theme");
  assert.equal(themeRuntime(keyed.win, themeConfig({ storageKey: "radiant-theme", themeColor: { light: "#fff", dark: "#000" } })).theme, "dark");
  assert.ok(keyed.queries.includes('meta[name="theme-color"]:not([media])'));
  assert.equal(themeRuntime(keyed.win, themeConfig({ storageKey: "another" })).theme, "system");
  // The scheme is only asked while the choice is "system".
  const fixed = fakeWindow({ stored: "light" });
  themeRuntime(fixed.win, themeConfig());
  assert.deepEqual(fixed.queries, []);
});

test("the script is one self-contained expression and no value can close its element", () => {
  const script = themeInitScript({ storageKey: "</script><script>alert(1)//", themeColor: { light: "<b>", dark: "\u2028" } });
  assert.doesNotMatch(script, /<\/script/i);
  assert.doesNotMatch(script, /<b>|\u2028/);
  assert.match(script, /^\(function\(\)\{try\{\(function themeRuntime\(/);
  assert.match(script, /\}\)\(\)$/);
  // It reads nothing from the module it came from: with only `window` in scope it runs.
  const hostile = fakeWindow({ stored: "dark" }, "</script><script>alert(1)//");
  runScript(script, hostile.win);
  assert.deepEqual(hostile.state().classes, ["dark"]);
  assert.deepEqual(hostile.state().meta, { content: "\u2028" });
});

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <>
      <output>{`${theme}/${resolvedTheme}`}</output>
      <ThemeSwitcher onValueChange={setTheme} value={theme} />
    </>
  );
}

test("a server renders the default theme without touching the browser, and the switcher takes the provider's value as is", () => {
  assert.equal(typeof window, "undefined");
  assert.match(renderToStaticMarkup(<ThemeProvider><ThemeProbe /></ThemeProvider>), /<output>system\/light<\/output>/);
  const dark = renderToStaticMarkup(<ThemeProvider defaultTheme="dark"><ThemeProbe /></ThemeProvider>);
  assert.match(dark, /<output>dark\/dark<\/output>/);
  assert.match(dark, /aria-label="Dark"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*aria-label="Dark"/);
  assert.match(renderToStaticMarkup(<ThemeProvider defaultTheme="light" themeColor={{ light: "#fff", dark: "#000" }}><ThemeProbe /></ThemeProvider>), /<output>light\/light<\/output>/);
  assert.throws(() => renderToStaticMarkup(<ThemeProbe />), /useTheme must be used inside a ThemeProvider/);
});

// ------------------------------------------------------------------ inline confirm

test("closed, an inline confirm renders nothing", () => {
  assert.equal(renderToStaticMarkup(<InlineConfirm confirmLabel="Finish" onConfirm={() => {}} title="Finish early?" />), "");
  assert.equal(renderToStaticMarkup(<InlineConfirm confirmLabel="Finish" onConfirm={() => {}} open={false} title="Finish early?" />), "");
  // Controlled wins over the default.
  assert.equal(renderToStaticMarkup(<InlineConfirm confirmLabel="Finish" defaultOpen onConfirm={() => {}} open={false} title="Finish early?" />), "");
});

test("open, it is a group named by its question and described by its detail, with the safe answer first", () => {
  const html = renderToStaticMarkup(
    <InlineConfirm cancelLabel="Keep going" confirmLabel="Finish" description="What you answered is kept." onConfirm={() => {}} open title="Finish early?" />,
  );
  const root = html.match(/^<div ([^>]*)>/)![1]!;
  assert.match(root, /data-slot="inline-confirm"/);
  assert.match(root, /role="group"/);
  assert.doesNotMatch(root, /aria-modal|alertdialog/);
  const titleId = root.match(/aria-labelledby="([^"]+)"/)![1]!;
  const descriptionId = root.match(/aria-describedby="([^"]+)"/)![1]!;
  assert.ok(html.includes(`<p class="fui-inline-confirm-title" id="${titleId}">Finish early?</p>`));
  assert.ok(html.includes(`<p class="fui-inline-confirm-description" id="${descriptionId}">What you answered is kept.</p>`));
  assert.doesNotMatch(root, /data-destructive|data-pending/);
  const buttons = [...html.matchAll(/<button ([^>]*)>(.*?)<\/button>/g)].map((match) => ({ attributes: match[1]!, text: match[2]! }));
  assert.deepEqual(buttons.map((button) => button.text), ["Keep going", "Finish"]);
  assert.match(buttons[0]!.attributes, /data-variant="outline"/);
  assert.match(buttons[1]!.attributes, /data-variant="default"/);
  for (const button of buttons) assert.match(button.attributes, /type="button"/);
  assert.doesNotMatch(html, /role="alert"|type="checkbox"/);
});

test("the title is a heading only when a level is given; without a detail nothing is described; the default safe answer is Cancel", () => {
  const html = renderToStaticMarkup(<InlineConfirm confirmLabel="Skip" defaultOpen headingLevel={3} onConfirm={() => {}} title="Skip this step?" />);
  assert.match(html, /<h3 class="fui-inline-confirm-title" id="[^"]+">Skip this step\?<\/h3>/);
  assert.doesNotMatch(html, /aria-describedby/);
  assert.match(html, />Cancel<\/button>/);
});

test("destructive tints the block and the answer; pending loads the answer, holds the safe one and keeps both in the tab order", () => {
  const html = renderToStaticMarkup(
    <InlineConfirm className="exam" confirmLabel="Abandon" destructive id="abandon" onConfirm={() => {}} open pending pendingLabel="Abandoning" title="Abandon the exam?">
      <p>Reasons</p>
    </InlineConfirm>,
  );
  const root = html.match(/^<div ([^>]*)>/)![1]!;
  assert.match(root, /id="abandon"/);
  assert.match(root, /class="fui-inline-confirm exam"/);
  assert.match(root, /data-destructive="true"/);
  assert.match(root, /data-pending="true"/);
  const [safe, answer] = [...html.matchAll(/<button ([^>]*)>/g)].map((match) => match[1]!);
  assert.match(safe!, /aria-disabled="true"/);
  assert.doesNotMatch(safe!, / disabled=""/);
  assert.match(answer!, /data-variant="destructive"/);
  assert.match(answer!, /data-loading="true"/);
  assert.match(answer!, /aria-busy="true"/);
  assert.match(answer!, /aria-disabled="true"/);
  assert.doesNotMatch(answer!, / disabled=""/);
  assert.match(html, /Abandoning<\/button>/);
  // Extra content sits between the question and the answers.
  assert.ok(html.indexOf("<p>Reasons</p>") > html.indexOf("fui-inline-confirm-text") && html.indexOf("<p>Reasons</p>") < html.indexOf("fui-inline-confirm-actions"));
});

test("an error is an alert inside the question; an acknowledgement is an empty, required box that never disables the answer", () => {
  const failed = renderToStaticMarkup(<InlineConfirm confirmLabel="Send" error="The connection dropped. Try again." onConfirm={() => {}} open title="Send it?" />);
  assert.match(failed, /<p class="fui-inline-confirm-error" role="alert"><svg[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span>The connection dropped\. Try again\.<\/span><\/p>/);
  const html = renderToStaticMarkup(
    <InlineConfirm acknowledgement={{ label: "I agree to keep it for 30 days" }} confirmLabel="Keep the recording" onConfirm={() => {}} open title="Keep this recording?" />,
  );
  const box = html.match(/<input ([^>]*)\/>/)![1]!;
  assert.match(box, /type="checkbox"/);
  assert.match(box, /aria-required="true"/);
  assert.doesNotMatch(box, /checked=""|aria-invalid|aria-describedby| required=""/);
  assert.match(html, /<label class="fui-native-choice"><input [^>]*\/><span>I agree to keep it for 30 days<\/span><\/label>/);
  const answer = [...html.matchAll(/<button ([^>]*)>/g)][1]![1]!;
  assert.doesNotMatch(answer, /disabled/);
  assert.doesNotMatch(html, /role="alert"/);
  const optional = renderToStaticMarkup(
    <InlineConfirm acknowledgement={{ label: "Also email me a copy", required: false }} confirmLabel="Export" onConfirm={() => {}} open title="Export?" />,
  );
  assert.doesNotMatch(optional, /aria-required/);
});

function Asker() {
  const confirm = useInlineConfirm({ defaultOpen: true });
  return (
    <>
      <button type="button" {...confirm.triggerProps}>
        End session
      </button>
      <InlineConfirm {...confirm.confirmProps} confirmLabel="End" onConfirm={() => {}} title="End the session?" />
    </>
  );
}

test("useInlineConfirm wires a trigger and the question: the trigger says whether it is open", () => {
  const html = renderToStaticMarkup(<Asker />);
  assert.match(html, /<button type="button" aria-expanded="true">End session<\/button><div[^>]*role="group"/);
});

// ------------------------------------------------------------------ state page, error state, back button

test("a state page is the page's main, with the brand, a code in the label voice, a title at the level given and actions", () => {
  const html = renderToStaticMarkup(
    <StatePage actions={<a href="/">Home</a>} brand={<a href="/">Radiant</a>} code="404" description="It may have been moved." id="main" title="This page does not exist">
      <p>More</p>
    </StatePage>,
  );
  assert.match(html, /^<main data-slot="state-page" id="main" class="fui-state-page" data-align="start">/);
  assert.match(html, /<div class="fui-state-page-brand"><a href="\/">Radiant<\/a><\/div>/);
  assert.match(html, /<p class="fui-state-page-code">404<\/p><h1 class="fui-state-page-title">This page does not exist<\/h1><p class="fui-state-page-description">It may have been moved\.<\/p>/);
  assert.match(html, /<div class="fui-actions fui-state-page-actions"><a href="\/">Home<\/a><\/div><p>More<\/p><\/div><\/main>$/);
  const bare = renderToStaticMarkup(<StatePage align="center" as="div" className="offline" headingLevel={2} title="You are offline" />);
  assert.match(bare, /^<div data-slot="state-page" class="fui-state-page offline" data-align="center"><div class="fui-state-page-body"><h2 class="fui-state-page-title">You are offline<\/h2><\/div><\/div>$/);
});

test("an error state is an alert with a retry, a way home and the reference of the error, never its message", () => {
  const error = Object.assign(new Error("ECONNREFUSED 10.0.0.3:5432"), { digest: "abc123" });
  const html = renderToStaticMarkup(<ErrorState error={error} homeHref="/" onRetry={() => {}} />);
  assert.match(html, /^<div role="alert" class="fui-state-panel fui-error-state" data-state="error"/);
  assert.match(html, /<h2>Something went wrong<\/h2>/);
  assert.match(html, /This page could not load\. Try again\./);
  assert.doesNotMatch(html, /ECONNREFUSED|10\.0\.0\.3/);
  assert.match(html, /<span class="fui-error-state-reference"><span>Reference abc123<\/span><button[^>]*aria-label="Copy reference"/);
  assert.match(html, /<button[^>]*type="button"[^>]*>.*?Try again<\/button>/);
  assert.match(html, /<a class="fui-button" data-size="default" data-variant="outline" href="\/">Go home<\/a>/);
});

test("an error state shows only what it is given, in the host's words", () => {
  const plain = renderToStaticMarkup(<ErrorState error={new Error("boom")} />);
  assert.doesNotMatch(plain, /fui-error-state-reference|fui-actions|boom/);
  for (const error of [undefined, null, "text", 42, { digest: 7 }, { digest: "" }]) assert.doesNotMatch(renderToStaticMarkup(<ErrorState error={error} />), /Reference/);
  const html = renderToStaticMarkup(
    <ErrorState
      actions={<a href="/status">Status</a>}
      description="Le serveur ne répond pas."
      headingLevel={3}
      homeHref="/chats"
      homeLabel="Retour aux discussions"
      labels={{ retry: "Réessayer", reference: (id) => `Référence ${id}`, copyReference: "Copier la référence" }}
      onRetry={() => {}}
      reference="req_81"
      retrying
      size="sm"
      title="La page n’a pas pu être chargée"
    />,
  );
  assert.match(html, /<h3>La page n’a pas pu être chargée<\/h3>/);
  assert.match(html, /data-size="sm"/);
  assert.match(html, /Référence req_81/);
  assert.match(html, /aria-label="Copier la référence"/);
  assert.match(html, /<button[^>]*data-loading="true"[^>]*>.*?Réessayer<\/button>/);
  assert.match(html, /href="\/chats">Retour aux discussions<\/a><a href="\/status">Status<\/a>/);
});

test("a back button is a button with an arrow that is not read; as a link it keeps the link's own semantics", () => {
  const html = renderToStaticMarkup(<BackButton />);
  assert.match(html, /^<button type="button" class="fui-button fui-back-button" data-slot="back-button" data-variant="outline" data-size="default">/);
  assert.match(html, /<svg[^>]*class="[^"]*fui-back-button-icon"[^>]*aria-hidden="true"[^>]*>.*<\/svg>Go back<\/button>$/);
  const link = renderToStaticMarkup(
    <BackButton className="quiet" render={<a href="/inbox" />} size="sm" variant="ghost">
      Back to the inbox
    </BackButton>,
  );
  assert.match(link, /^<a href="\/inbox"/);
  assert.doesNotMatch(link, /type="button"|role="button"/);
  assert.match(link, /class="fui-button fui-back-button quiet"/);
  assert.match(link, /data-variant="ghost" data-size="sm"/);
  assert.match(link, /Back to the inbox<\/a>$/);
});

// ------------------------------------------------------------------ action bar, viewport

test("an action bar is a plain bar, a group once it has a name, and never a toolbar by itself", () => {
  const html = renderToStaticMarkup(
    <ActionBar end={<button type="button">Check</button>} start={<button type="button">Skip</button>}>
      <span>2 of 8</span>
    </ActionBar>,
  );
  assert.equal(
    html,
    '<div data-slot="action-bar" class="fui-action-bar"><div class="fui-action-bar-start"><button type="button">Skip</button></div><span>2 of 8</span><div class="fui-action-bar-end"><button type="button">Check</button></div></div>',
  );
  assert.match(renderToStaticMarkup(<ActionBar aria-label="Step actions" className="step" />), /^<div data-slot="action-bar" role="group" aria-label="Step actions" class="fui-action-bar step"><\/div>$/);
  assert.match(renderToStaticMarkup(<ActionBar aria-label="Formatting" role="toolbar" />), /role="toolbar"/);
});

test("the keyboard's inset is what the visual viewport lost at the bottom, and a toolbar's worth is not a keyboard", () => {
  assert.equal(keyboardInset(800, 800, 0), 0);
  assert.equal(keyboardInset(800, 480, 0), 320);
  // The page scrolled inside the visual viewport: what is above it does not count.
  assert.equal(keyboardInset(800, 480, 40), 280);
  assert.equal(keyboardInset(800, 700, 0), 0);
  assert.equal(keyboardInset(800, 680, 0), 0);
  assert.equal(keyboardInset(800, 679.4, 0), 121);
  assert.equal(keyboardInset(800, 760, 0, 20), 40);
  // A pinch zoom makes the visual viewport taller than nothing: never negative.
  assert.equal(keyboardInset(800, 900, 0), 0);
});

// ------------------------------------------------------------------ styles

test("the block is logical: no physical side, no fixed width or height property", () => {
  const declarations = block.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(declarations, /(?<!-)(?:margin|padding|border|inset)-(?:left|right|top|bottom)\b/);
  assert.doesNotMatch(declarations, /^\s*(?:left|right|top|bottom|width|height|min-width|max-width|min-height|max-height)\s*:/m);
  assert.doesNotMatch(declarations, /text-align:\s*(?:left|right)/);
  assert.doesNotMatch(declarations, /margin-inline:\s*auto/);
});

test("the action bar sticks to the block end, above the keyboard and the safe area, over a hairline", () => {
  const bar = rule(".fui-action-bar {");
  assert.match(bar, /position: sticky;/);
  assert.match(bar, /inset-block-end: var\(--fui-keyboard-inset, 0px\);/);
  assert.match(bar, /z-index: var\(--fui-z-sticky\);/);
  assert.match(bar, /border-block-start: 1px solid var\(--border\);/);
  assert.match(bar, /background: var\(--card\);/);
  assert.match(bar, /padding-block: var\(--fui-space-3\) max\(var\(--fui-space-3\), env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(bar, /container: fui-action-bar \/ inline-size;/);
  assert.match(rule("  .fui-action-bar-end {\n    margin"), /margin-inline-start: auto;/);
  // On a narrow bar the actions that move on take a full row and share it.
  const narrow = mediaBlock("@container fui-action-bar (max-width: 26rem)");
  assert.match(rule(".fui-action-bar-end {", narrow), /flex: 1 1 100%;/);
  assert.match(rule(".fui-action-bar-end > .fui-button {", narrow), /flex: 1 1 0;/);
});

test("an inline confirm is a tint, not a plate, and scrolls clear of the bar and the keyboard", () => {
  const confirm = rule(".fui-inline-confirm {");
  assert.match(confirm, /scroll-margin-block-end: calc\(var\(--fui-action-bar-size, 0px\) \+ var\(--fui-keyboard-inset, 0px\) \+ var\(--fui-space-2\)\);/);
  assert.match(confirm, /background: var\(--fui-surface-inset\);/);
  assert.match(confirm, /border-radius: var\(--fui-radius-plate\);/);
  assert.doesNotMatch(confirm, /box-shadow/);
  const destructive = rule(".fui-inline-confirm[data-destructive] {");
  assert.match(destructive, /background: color-mix\(in oklab, var\(--destructive\) var\(--fui-tint-strength\), var\(--card\)\);/);
  assert.match(destructive, /border-color: color-mix\(in oklab, var\(--destructive\) var\(--fui-tint-edge\), var\(--card\)\);/);
  assert.match(rule(".fui-inline-confirm-error {"), /color: var\(--fui-danger-ink\);/);
});

test("the countdown reads in the label voice with tabular figures, and each tone is a tint with an edge", () => {
  const countdown = rule(".fui-countdown {");
  assert.match(countdown, /font-family: var\(--fui-font-label\);/);
  assert.match(countdown, /font-size: var\(--fui-text-label\);/);
  assert.match(countdown, /font-variant-numeric: tabular-nums;/);
  assert.match(countdown, /border-radius: var\(--fui-radius-sm\);/);
  assert.match(rule('.fui-countdown[data-tone="low"] {'), /--fui-countdown-tone: var\(--warning\);\s*--fui-countdown-ink: var\(--fui-warning-ink\);/);
  assert.match(rule('.fui-countdown[data-tone="urgent"] {'), /--fui-countdown-tone: var\(--destructive\);\s*--fui-countdown-ink: var\(--fui-danger-ink\);/);
  const tinted = rule('.fui-countdown:is([data-tone="low"], [data-tone="urgent"]) {');
  assert.match(tinted, /border-color: color-mix\(in oklab, var\(--fui-countdown-tone\) var\(--fui-tint-edge\), var\(--card\)\);/);
  assert.match(tinted, /background: color-mix\(in oklab, var\(--fui-countdown-tone\) var\(--fui-tint-strength\), var\(--card\)\);/);
});

test("a state page fills the viewport, keeps to the gutter and the safe areas, and sets its content in the upper third", () => {
  const page = rule(".fui-state-page {");
  assert.match(page, /--fui-state-page-size: 100dvh;/);
  assert.match(page, /min-block-size: var\(--fui-state-page-size\);/);
  assert.match(page, /grid-template-rows: auto minmax\(var\(--fui-space-8\), 1fr\) auto minmax\(var\(--fui-space-8\), 2fr\);/);
  assert.match(page, /padding-inline: max\(var\(--fui-page-padding\), env\(safe-area-inset-left, 0px\), env\(safe-area-inset-right, 0px\)\);/);
  assert.match(page, /padding-block: env\(safe-area-inset-top, 0px\) env\(safe-area-inset-bottom, 0px\);/);
  const body = rule(".fui-state-page-body {");
  assert.match(body, /grid-row: 3;/);
  assert.match(body, /justify-items: start;/);
  assert.match(body, /max-inline-size: 36rem;/);
  assert.match(rule(".fui-state-page-title {"), /font-family: var\(--fui-font-display\);[^}]*text-wrap: balance;/);
  const code = rule(".fui-state-page-code {");
  assert.match(code, /font-family: var\(--fui-font-label\);/);
  assert.doesNotMatch(code, /uppercase|letter-spacing/);
  // Centring is asked for, never the default.
  assert.match(rule('.fui-state-page[data-align="center"] .fui-state-page-body {'), /justify-self: center;/);
});

test("the back arrow turns round in right to left", () => {
  assert.match(rule(".fui-back-button-icon:dir(rtl) {"), /scale: -1 1;/);
});

test("forced colors: every tint keeps an edge, and destructive and each tone a shape of its own", () => {
  const forced = mediaBlock("@media (forced-colors: active)");
  assert.match(rule(".fui-inline-confirm {", forced), /border-color: GrayText;/);
  assert.match(rule(".fui-inline-confirm[data-destructive] {", forced), /border: 2px solid CanvasText;/);
  assert.match(rule(".fui-countdown {", forced), /border-color: CanvasText;/);
  assert.match(rule('.fui-countdown[data-tone="low"] {', forced), /border-style: dashed;/);
  assert.match(rule('.fui-countdown[data-tone="urgent"] {', forced), /border-width: 2px;/);
  assert.doesNotMatch(forced, /var\(--(?!fui-space)/);
});

test("the one animation of the block runs only when motion is welcome, and tone changes ride the motion tokens", () => {
  const motion = mediaBlock("@media (prefers-reduced-motion: no-preference)");
  assert.match(motion, /\.fui-inline-confirm \{\s*animation: fui-inline-confirm-in var\(--fui-duration-slow\) var\(--fui-ease-out\) both;/);
  const outside = block.replace(motion, "");
  assert.doesNotMatch(outside, /animation|@keyframes/);
  // Transitions take their length from the tokens, which are 0 under reduced motion.
  for (const transition of block.matchAll(/transition:([^;]*);/g)) {
    for (const part of transition[1]!.split(",")) assert.match(part, /var\(--fui-duration(?:-fast|-slow)?\)/);
  }
});
