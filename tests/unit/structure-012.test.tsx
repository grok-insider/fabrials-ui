import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import {
  Badge,
  ActivityStrip,
  DisclosureSummary,
  Item,
  NumberField,
  PasswordInput,
  ProductLockup,
  Progress,
  SearchInput,
  StatePanel,
  ThemeSwitcher,
  Toggle,
  ToggleGroup,
} from "../../packages/ui/src/index";
import { canonicalSize, copyState, CopyStatus, prefersReducedMotion, subscribeTick, useReducedMotion } from "../../packages/ui/src/index";
import { Attachments } from "../../packages/ai-ui/src/index";

const html = (node: ReactElement) => renderToStaticMarkup(node);

/* --------------------------------------------------------------- the copy machine */

test("copyState says what a copy left behind and nothing else", () => {
  assert.equal(copyState("idle", { type: "settled", result: "copied" }), "copied");
  assert.equal(copyState("copied", { type: "settled", result: "copied" }), "copied");
  assert.equal(copyState("failed", { type: "settled", result: "copied" }), "copied");
  assert.equal(copyState("idle", { type: "settled", result: "failed" }), "failed");
  assert.equal(copyState("copied", { type: "settled", result: "failed" }), "failed");
  assert.equal(copyState("failed", { type: "settled", result: "failed" }), "failed");
  assert.equal(copyState("copied", { type: "reset" }), "idle");
  assert.equal(copyState("failed", { type: "reset" }), "idle");
  assert.equal(copyState("idle", { type: "reset" }), "idle");
});

test("CopyStatus is always in the page, hidden, and only says something once a copy happened", () => {
  const labels = { copied: "Copied to clipboard", failed: "Copy by hand: select the text" };
  const idle = html(<CopyStatus labels={labels} status="idle" />);
  assert.equal(idle, '<span role="status" class="fui-sr-only"></span>', "nothing is said on first paint");
  assert.equal(
    html(<CopyStatus labels={labels} status="copied" />),
    '<span role="status" data-state="copied" class="fui-sr-only">Copied to clipboard</span>',
  );
  // With a class for the failure the region is shown, not hidden: the words have to be read as well as heard.
  assert.equal(
    html(<CopyStatus failedClassName="fui-code-panel-status" labels={labels} status="failed" />),
    '<span role="status" data-state="failed" class="fui-code-panel-status">Copy by hand: select the text</span>',
  );
  // A caller that gives no words for a failure says nothing, and stays hidden.
  assert.equal(html(<CopyStatus labels={{ copied: "Copied" }} status="failed" />), '<span role="status" data-state="failed" class="fui-sr-only"></span>');
  assert.match(html(<CopyStatus className="beside" labels={labels} status="copied" />), /class="fui-sr-only beside"/);
});

/* --------------------------------------------------------------- the clock */

type Listener = () => void;

function fakeClock() {
  const intervals = new Map<number, { ms: number; run: Listener }>();
  let sequence = 0;
  const real = { set: globalThis.setInterval, clear: globalThis.clearInterval };
  globalThis.setInterval = ((run: Listener, ms: number) => {
    const id = ++sequence;
    intervals.set(id, { ms, run });
    return id;
  }) as unknown as typeof globalThis.setInterval;
  globalThis.clearInterval = ((id: number) => {
    intervals.delete(id);
  }) as unknown as typeof globalThis.clearInterval;
  return {
    periods: () => [...intervals.values()].map((timer) => timer.ms).sort((a, b) => a - b),
    fire(ms: number) {
      for (const timer of [...intervals.values()]) if (timer.ms === ms) timer.run();
    },
    restore() {
      globalThis.setInterval = real.set;
      globalThis.clearInterval = real.clear;
    },
  };
}

function fakePage() {
  const listeners = new Map<string, Set<Listener>>();
  const page = { visibility: "visible" };
  const add = (type: string, listener: Listener) => {
    const set = listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(type, set);
  };
  const remove = (type: string, listener: Listener) => {
    listeners.get(type)?.delete(listener);
  };
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.document = {
    get visibilityState() {
      return page.visibility;
    },
    addEventListener: add,
    removeEventListener: remove,
  };
  globals.window = { addEventListener: add, removeEventListener: remove };
  return {
    fire(type: string) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener();
    },
    count: (type: string) => listeners.get(type)?.size ?? 0,
    show() {
      page.visibility = "visible";
      this.fire("visibilitychange");
    },
    hide() {
      page.visibility = "hidden";
      this.fire("visibilitychange");
    },
    restore() {
      delete globals.document;
      delete globals.window;
    },
  };
}

test("the ticker keeps one interval per period, sleeps while the page is hidden and wakes once on return", () => {
  const clock = fakeClock();
  const page = fakePage();
  const heard = { a: 0, b: 0, c: 0, d: 0 };
  try {
    const offA = subscribeTick(250, () => (heard.a += 1));
    const offB = subscribeTick(250, () => (heard.b += 1));
    assert.deepEqual(clock.periods(), [250], "two subscribers of the same period share one interval");
    clock.fire(250);
    assert.deepEqual(heard, { a: 1, b: 1, c: 0, d: 0 });

    // A second period gets its own interval, and a period under the floor is served at the floor.
    const offC = subscribeTick(1000, () => (heard.c += 1));
    const offD = subscribeTick(5, () => (heard.d += 1));
    assert.deepEqual(clock.periods(), [50, 250, 1000]);
    clock.fire(1000);
    assert.equal(heard.c, 1);
    assert.equal(heard.a, 1, "a period wakes its own subscribers, not the others");
    offD();

    // Hidden: the timers go, and a subscriber that arrives is not given one either.
    page.hide();
    assert.deepEqual(clock.periods(), []);
    const offE = subscribeTick(250, () => (heard.d += 1));
    assert.deepEqual(clock.periods(), [], "nothing ticks while the page is hidden");

    // Shown again: every period comes back and everyone hears once, so a clock nobody read for an hour is read again.
    page.show();
    assert.deepEqual(clock.periods(), [250, 1000]);
    assert.deepEqual(heard, { a: 2, b: 2, c: 2, d: 1 });

    // A page restored from the back-forward cache or a window taking focus asks everybody to read again too.
    page.fire("focus");
    page.fire("pageshow");
    assert.deepEqual(heard, { a: 4, b: 4, c: 4, d: 3 });

    // The last one out takes the intervals and the listeners with it.
    for (const off of [offA, offB, offC, offE]) off();
    assert.deepEqual(clock.periods(), []);
    assert.equal(page.count("visibilitychange"), 0);
    assert.equal(page.count("focus") + page.count("pageshow"), 0);
  } finally {
    clock.restore();
    page.restore();
  }
});

test("the ticker answers a subscriber with nothing to do when there is no browser", () => {
  assert.equal(typeof subscribeTick(250, () => {}), "function");
  assert.equal(typeof subscribeTick(250, () => {})(), "undefined");
});

/* --------------------------------------------------------------- the motion preference */

test("the motion preference is false where there is no matchMedia, and reads the query where there is", () => {
  assert.equal(prefersReducedMotion(), false);
  const globals = globalThis as unknown as Record<string, unknown>;
  const asked: string[] = [];
  globals.window = {
    matchMedia(query: string) {
      asked.push(query);
      return { matches: true, addEventListener() {}, removeEventListener() {} };
    },
  };
  try {
    assert.equal(prefersReducedMotion(), true);
    assert.deepEqual(asked, ["(prefers-reduced-motion: reduce)"]);
    // A Server Component and the hydrating render answer false: the markup agrees before there is a browser to ask.
    function Motion() {
      return <span>{String(useReducedMotion())}</span>;
    }
    assert.equal(html(<Motion />), "<span>false</span>");
  } finally {
    delete globals.window;
  }
});

/* --------------------------------------------------------------- the size words */

test("canonicalSize names the middle size one way, and leaves every other size alone", () => {
  assert.equal(canonicalSize("md", "default"), "default");
  assert.equal(canonicalSize("default", "default"), "default");
  assert.equal(canonicalSize("default", "md"), "md");
  assert.equal(canonicalSize("md", "md"), "md");
  for (const canonical of ["default", "md"] as const) {
    assert.equal(canonicalSize("sm", canonical), "sm");
    assert.equal(canonicalSize("lg", canonical), "lg");
    assert.equal(canonicalSize(undefined, canonical), undefined, "not given stays not given");
  }
  // A component whose middle size is `md` keeps `md` as the word written on the element.
  assert.equal(canonicalSize("default", "md"), "md");
});

const same = (alias: ReactNode, canonical: ReactNode, what: string) =>
  assert.equal(html(<>{alias}</>), html(<>{canonical}</>), `${what}: the alias draws exactly the canonical markup`);

test("md is the same as default wherever default is the middle size", () => {
  same(<Badge size="md">7</Badge>, <Badge size="default">7</Badge>, "Badge");
  same(<Progress size="md" value={42} />, <Progress size="default" value={42} />, "Progress");
  same(<Progress size="md" value={42} variant="ring" />, <Progress size="default" value={42} variant="ring" />, "Progress ring");
  same(
    <ToggleGroup size="md" value={["a"]}>
      <Toggle value="a">a</Toggle>
    </ToggleGroup>,
    <ToggleGroup size="default" value={["a"]}>
      <Toggle value="a">a</Toggle>
    </ToggleGroup>,
    "ToggleGroup",
  );
  same(<Toggle size="md">Bold</Toggle>, <Toggle size="default">Bold</Toggle>, "Toggle");
  const theme = (size: "md" | "default") => <ThemeSwitcher onValueChange={() => {}} size={size} value="system" />;
  same(theme("md"), theme("default"), "ThemeSwitcher");
  same(<Item size="md">Row</Item>, <Item size="default">Row</Item>, "Item");
  // The middle size of a field is `default`: the attribute written on the wrapper stays `default`.
  same(<SearchInput size="md" />, <SearchInput size="default" />, "SearchInput");
  same(<PasswordInput size="md" />, <PasswordInput size="default" />, "PasswordInput");
  same(<NumberField size="md" />, <NumberField size="default" />, "NumberField");
});

test("default is the same as md wherever md is the middle size", () => {
  same(<DisclosureSummary size="default">Notes</DisclosureSummary>, <DisclosureSummary size="md">Notes</DisclosureSummary>, "DisclosureSummary");
  same(
    <ActivityStrip caption="Requests" cells={[{ label: "Mon", value: 3 }]} size="default" />,
    <ActivityStrip caption="Requests" cells={[{ label: "Mon", value: 3 }]} size="md" />,
    "ActivityStrip",
  );
  same(<ProductLockup product="Spanreed" size="default" />, <ProductLockup product="Spanreed" size="md" />, "ProductLockup");
  same(
    <StatePanel size="default" state="empty" title="Nothing yet" />,
    <StatePanel size="md" state="empty" title="Nothing yet" />,
    "StatePanel",
  );
  const files = [{ id: "a", mediaType: "application/pdf", name: "report.pdf" }];
  same(
    <Attachments items={files} size="default" variant="grid" />,
    <Attachments items={files} size="md" variant="grid" />,
    "Attachments",
  );
});

test("the alias reaches the attribute a stylesheet reads, and only there", () => {
  assert.doesNotMatch(html(<Progress size="md" value={42} variant="ring" />), /data-size/, "the middle progress writes no size");
  assert.match(html(<Progress size="sm" value={42} />), /data-size="sm"/);
  assert.match(html(<Badge size="md">7</Badge>), /data-count="true"/);
  assert.doesNotMatch(html(<Badge size="md">7</Badge>), /data-size/, "the middle badge writes no size at all");
  assert.match(html(<ToggleGroup size="md" />), /data-size="default"/);
  assert.match(
    html(<ProductLockup product="Spanreed" size="default" />),
    /data-size="md"/,
    "a component whose middle size is md writes md",
  );
  assert.match(html(<SearchInput size="md" />), /data-size="default"/);
});
