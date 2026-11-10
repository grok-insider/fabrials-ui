// Sound in a real browser, on synthetic tones: clips a loader hands over, a recorder fed by an oscillator (never a
// microphone), and two readers. What is asserted is state, focus and what was asked of the loaders; nothing is heard.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PIECES = "/iframe.html?id=tests-sound--pieces&viewMode=story";
const LIVE = "/iframe.html?id=tests-sound--live&viewMode=story";

// `window.__soundBench` (what the loaders were asked, and the key to a held load) is declared by the story.
declare global {
  interface Window {
    __plays?: string[];
    __micError?: string;
  }
}

// Storybook's own accessibility panel may be running axe in the same frame: wait for it rather than fail.
async function audit(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

async function open(page: Page, url: string, theme = "light") {
  // Every start of sound is written down, so a test can say that nothing played.
  await page.addInitScript(() => {
    const plays: string[] = [];
    window.__plays = plays;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      plays.push(this.currentSrc || this.src);
      return play.call(this);
    };
  });
  await page.goto(`${url}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const clip = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" });
const calls = (page: Page, prefix: string) => page.evaluate((start) => window.__soundBench!.calls.filter((call) => call.startsWith(start)).length, prefix);
const plays = (page: Page) => page.evaluate(() => window.__plays!.length);
const recorder = (page: Page, name = "Spoken answer") => page.getByRole("group", { name, exact: true });
const said = (panel: Locator) => panel.locator(".fui-recorder-status");

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`sound ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, PIECES, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      // The takes are tones in the page: their players know their length before the picture is taken.
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll("audio")].every((audio) => audio.readyState >= 1 && Number.isFinite(audio.duration)))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`sound-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("a clip loads, then plays as a pressed key; once heard its words change; pressing it again stops it", async ({ page }) => {
  await open(page, LIVE);
  // A short clip: it ends by itself.
  const short = clip(page, "Short clip");
  await short.click();
  await expect(short).toHaveAttribute("aria-pressed", "true");
  await expect(short).toHaveAttribute("data-state", "playing");
  await expect(short).toHaveAttribute("aria-pressed", "false", { timeout: 6_000 });
  await expect(short).toHaveAttribute("data-state", "idle");
  // A clip named by its state: "Listen" while it was never heard, "Listen again" after. It is found by its id, since its
  // accessible name changes under the test.
  const changing = page.locator("#changing-clip");
  await expect(changing).toHaveText("Listen");
  await changing.click();
  await expect(changing).toHaveAttribute("aria-pressed", "true");
  await expect(changing).toHaveAttribute("data-state", "playing");
  await expect(changing).toHaveText("Listen again");
  // Pressing it again stops it, and the words stay "Listen again".
  await changing.click();
  await expect(changing).toHaveAttribute("aria-pressed", "false");
  await expect(changing).toHaveAttribute("data-state", "idle");
  await expect(changing).toHaveText("Listen again");
  expect(await plays(page)).toBe(2);
  // A clip the loader holds: loading first, as a key that stays pressable, then playing as a pressed key.
  const held = clip(page, "Held clip");
  await held.focus();
  await page.keyboard.press("Enter");
  await expect(held).toHaveAttribute("data-state", "loading");
  await expect(held).toHaveAttribute("aria-busy", "true");
  await expect(held).toHaveAttribute("aria-pressed", "false");
  await expect(held.locator(".fui-pixel-spinner")).toBeVisible();
  await expect(held).toBeEnabled();
  await page.evaluate(() => window.__soundBench!.release("held"));
  await expect(held).toHaveAttribute("aria-pressed", "true");
  await expect(held).toHaveAttribute("data-state", "playing");
  await expect(held).not.toHaveAttribute("aria-busy", "true");
  // The same key, by keyboard, stops it.
  await page.keyboard.press("Space");
  await expect(held).toHaveAttribute("aria-pressed", "false");
  await expect(held).toHaveAttribute("data-state", "idle");
  // Three presses of three clips: the short one ended by itself, the next was stopped, the held one stopped.
  expect(await plays(page)).toBe(3);
});

test("a second clip stops the first; a slow load overtaken by a newer press never plays, and is kept", async ({ page }) => {
  await open(page, LIVE);
  const long = clip(page, "Long clip");
  const held = clip(page, "Held clip");
  await held.click();
  await expect(held).toHaveAttribute("data-state", "loading");
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  await expect(held).toHaveAttribute("data-state", "idle");
  const before = await plays(page);
  expect(before).toBe(1);
  // The slow load comes back now: it must not start, and the newer clip goes on.
  await page.evaluate(() => window.__soundBench!.release("held"));
  await page.waitForTimeout(400);
  expect(await plays(page)).toBe(before);
  await expect(held).toHaveAttribute("data-state", "idle");
  await expect(long).toHaveAttribute("aria-pressed", "true");
  // It was kept: the next press plays it without asking the loader again.
  await held.click();
  await expect(held).toHaveAttribute("aria-pressed", "true");
  await expect(long).toHaveAttribute("aria-pressed", "false");
  expect(await calls(page, "held@")).toBe(1);
  expect(await plays(page)).toBe(before + 1);
});

test("a spent allowance is said once and never asked for again; a retry is offered only when it can help, and gives the focus back", async ({ page }) => {
  await open(page, LIVE);
  const note = page.locator(".fui-clip-note");
  await expect(note).toHaveAttribute("role", "status");
  await expect(note).toBeEmpty();
  const spent = clip(page, "Spent clip");
  await spent.click();
  await expect(note).toHaveText("The audio allowance is used up for now.");
  await expect(note.getByRole("button")).toHaveCount(0);
  await expect(spent).toHaveAttribute("data-state", "idle");
  await spent.click();
  await spent.click();
  await expect(note).toHaveText("The audio allowance is used up for now.");
  expect(await calls(page, "quota@")).toBe(1);

  const flaky = clip(page, "Flaky clip");
  await flaky.click();
  await expect(note).toContainText("The audio could not be played.");
  const retry = note.getByRole("button", { name: "Try again" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  // The note goes with the retry: the focus is on the clip's own key, not lost.
  await expect(flaky).toBeFocused();
  await expect(flaky).toHaveAttribute("aria-pressed", "true");
  await expect(note).toBeEmpty();
  expect(await calls(page, "flaky@")).toBe(2);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".fui-clip-note")!).position)).toBe("absolute");
});

test("the slow speed is a pressed key that stops what plays and asks for the slow rendering", async ({ page }) => {
  await open(page, LIVE);
  const long = clip(page, "Long clip");
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  const slow = page.getByRole("button", { name: "Slow" });
  await expect(slow).toHaveAttribute("aria-pressed", "false");
  await slow.click();
  await expect(slow).toHaveAttribute("aria-pressed", "true");
  await expect(long).toHaveAttribute("aria-pressed", "false");
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__soundBench!.calls)).toEqual(["long@normal", "long@slow"]);
});

test("one sound at a time: a player stops a clip, a clip stops a player, a reader gives way to a clip", async ({ page }) => {
  await open(page, LIVE);
  const long = clip(page, "Long clip");
  const player = page.getByRole("group", { name: "Tone" });
  await expect.poll(() => player.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).duration)).toBeGreaterThan(3);
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  await player.getByRole("button", { name: "Play" }).click();
  await expect(player).toHaveAttribute("data-playing", "");
  await expect(long).toHaveAttribute("aria-pressed", "false");
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  await expect(player).not.toHaveAttribute("data-playing", "");
  expect(await player.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).paused)).toBe(true);
  const reader = page.getByRole("button", { name: "Read the first answer" });
  await reader.click();
  await expect(reader).toHaveAttribute("aria-pressed", "true");
  await expect(long).toHaveAttribute("aria-pressed", "false");
  await long.click();
  await expect(reader).toHaveAttribute("aria-pressed", "false");
  await expect(long).toHaveAttribute("aria-pressed", "true");
});

test("recording: said once, the focus on Stop, then a take to hear, the focus on the primary action, and the Blob handed to the host", async ({ page }) => {
  await open(page, LIVE);
  const panel = recorder(page);
  await expect(said(panel)).toBeEmpty();
  await expect(panel.locator(".fui-recorder-hint")).toHaveText("Up to 0:20.");
  await expect(panel.getByRole("status")).toHaveCount(1);
  const record = panel.getByRole("button", { name: "Record", exact: true });
  await record.focus();
  await page.keyboard.press("Enter");
  await expect(said(panel)).toHaveText("Recording.");
  await expect(said(panel)).toHaveAttribute("aria-live", "polite");
  await expect(panel.getByRole("button", { name: "Stop" })).toBeFocused();
  // While it records the live region does not change: the clock ticks beside it, unread.
  await page.evaluate(() => {
    const region = document.querySelector('[aria-label="Spoken answer"] .fui-recorder-status')!;
    const seen = { count: 0 };
    (window as unknown as { __regionChanges: typeof seen }).__regionChanges = seen;
    new MutationObserver((records) => (seen.count += records.length)).observe(region, { childList: true, characterData: true, subtree: true });
  });
  const live = panel.locator(".fui-recorder-live");
  await expect(live).toHaveAttribute("aria-hidden", "true");
  await expect(live.locator(".fui-recorder-clock")).toHaveAttribute("dir", "ltr");
  await expect(live.locator(".fui-recorder-clock")).toHaveText("0:01 / 0:20", { timeout: 5_000 });
  expect(await page.evaluate(() => (window as unknown as { __regionChanges: { count: number } }).__regionChanges.count)).toBe(0);
  // The oscillator is heard by the meter.
  await expect.poll(() => live.locator(".fui-recorder-meter-fill").evaluate((fill) => fill.getBoundingClientRect().width)).toBeGreaterThan(4);
  await expect(panel.getByRole("button", { name: "Type instead" })).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(said(panel)).toHaveText(/^Recorded 0:0\d\. Listen back before you use it\.$/);
  const submit = panel.getByRole("button", { name: "Use this recording" });
  await expect(submit).toBeFocused();
  await expect(page.locator('[data-slot="handed"]').first()).toHaveText("Nothing has left the recorder.");
  // The take plays in the house player, with a length it can seek in.
  const take = panel.getByRole("group", { name: "Your recording" });
  await expect.poll(() => take.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).duration)).toBeGreaterThan(0.7);
  expect(await take.locator("audio").evaluate((audio) => Number.isFinite((audio as HTMLAudioElement).duration) && (audio as HTMLAudioElement).src.startsWith("blob:"))).toBe(true);
  await take.getByRole("button", { name: /^Play/ }).click();
  await expect(take).toHaveAttribute("data-playing", "");
  await take.getByRole("button", { name: "Pause" }).click();

  await submit.click();
  await expect(page.locator('[data-slot="handed"]').first()).toHaveText(/^Handed over audio\/(webm|mp4|ogg), not empty\.$/);
});

test("Record again drops the take and puts the focus on Record; a mis-tap goes back to the start with a note", async ({ page }) => {
  await open(page, LIVE);
  const panel = recorder(page);
  await panel.getByRole("button", { name: "Record", exact: true }).click();
  await expect(said(panel)).toHaveText("Recording.");
  await page.waitForTimeout(900);
  await panel.getByRole("button", { name: "Stop" }).click();
  const again = panel.getByRole("button", { name: "Record again" });
  await expect(again).toBeVisible();
  const url = await panel.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).src);
  await again.focus();
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("button", { name: "Record", exact: true })).toBeFocused();
  await expect(said(panel)).toBeEmpty();
  await expect(panel.locator("audio")).toHaveCount(0);
  // The take's address is gone with it.
  expect(await page.evaluate((address) => fetch(address).then(() => "alive", () => "revoked"), url)).toBe("revoked");

  // Stop pressed the moment it appears: under 700 ms is not a take.
  await page.keyboard.press("Enter");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const look = () => {
          const stop = [...document.querySelectorAll<HTMLButtonElement>('[aria-label="Spoken answer"] button')].find((button) => button.textContent === "Stop");
          if (!stop) return requestAnimationFrame(look);
          stop.click();
          resolve();
        };
        look();
      }),
  );
  await expect(said(panel)).toHaveText("That was too short to keep. Record a little longer.");
  await expect(panel).toHaveAttribute("data-status", "idle");
  await expect(panel.getByRole("button", { name: "Record", exact: true })).toBeFocused();
  await expect(panel.locator("audio")).toHaveCount(0);
});

test("the recorder stops itself at the limit and says so; starting to record stops a clip", async ({ page }) => {
  await open(page, LIVE);
  const long = clip(page, "Long clip");
  await long.click();
  await expect(long).toHaveAttribute("aria-pressed", "true");
  const panel = recorder(page, "Short answer");
  await panel.getByRole("button", { name: "Record", exact: true }).click();
  await expect(long).toHaveAttribute("aria-pressed", "false");
  await expect(said(panel)).toHaveText("Stopped at the 0:01 limit. Recorded 0:01. Listen back before you use it.", { timeout: 6_000 });
  await expect(panel.getByRole("button", { name: "Use this recording" })).toBeFocused();
  // And a clip that starts while another take is being recorded ends that take.
  const other = recorder(page);
  await other.getByRole("button", { name: "Record", exact: true }).click();
  await expect(said(other)).toHaveText("Recording.");
  await page.waitForTimeout(900);
  await long.click();
  await expect(said(other)).toHaveText(/^Recorded/);
  await expect(long).toHaveAttribute("aria-pressed", "true");
});

test("a refused, missing or busy microphone each has its own sentence, a key to try again that takes the focus, and the other way to answer", async ({ page }) => {
  // The page's own getUserMedia is replaced, so no microphone is asked for; each press is refused the way the test says.
  await page.addInitScript(() => {
    window.__soundBenchRealMicrophone = true;
    window.__micError = "NotAllowedError";
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => Promise.reject(new DOMException("refused", window.__micError)),
    });
  });
  await open(page, LIVE);
  const panel = recorder(page);
  const sentences: string[] = [];
  const expected: Array<[string, string, RegExp]> = [
    ["NotAllowedError", "denied", /^The microphone is blocked\./],
    ["NotFoundError", "no-microphone", /^No microphone was found\./],
    ["NotReadableError", "busy", /^The microphone is in use by another app\./],
    ["AbortError", "error", /^The recording could not start\./],
  ];
  for (const [name, status, sentence] of expected) {
    await page.evaluate((error) => (window.__micError = error), name);
    const key = panel.getByRole("button", { name: /^(Record|Try the microphone again)$/ });
    await key.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toHaveAttribute("data-status", status);
    await expect(said(panel)).toHaveText(sentence);
    await expect(said(panel)).toHaveAttribute("data-tone", "problem");
    await expect(panel.getByRole("alert")).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "Try the microphone again" })).toBeFocused();
    const fallback = panel.getByRole("button", { name: "Type instead" });
    await expect(fallback).toBeVisible();
    await fallback.focus();
    await expect(fallback).toBeFocused();
    sentences.push((await said(panel).textContent())!);
  }
  expect(new Set(sentences).size).toBe(4);
  await panel.getByRole("button", { name: "Type instead" }).click();
  await expect(page.locator('[data-slot="handed"]').first()).toHaveText("Typing instead.");
});

test("a browser that cannot record says so and still offers the other way", async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as unknown as { MediaRecorder?: unknown }).MediaRecorder;
  });
  await open(page, LIVE);
  const panel = recorder(page);
  await expect(panel).toHaveAttribute("data-status", "unsupported");
  await expect(said(panel)).toHaveText("This browser cannot record sound.");
  await expect(panel.getByRole("button", { name: /Record|microphone/ })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Type instead" })).toBeVisible();
});

test("readers: the second to start stops the first, and stopping mid-load plays nothing", async ({ page }) => {
  await open(page, LIVE);
  const first = page.getByRole("button", { name: "Read the first answer" });
  const second = page.getByRole("button", { name: "Read the second answer" });
  const reading = page.locator('[data-slot="reading"]');
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(reading).toHaveText("first");
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(reading).toHaveText("second");
  await page.getByRole("button", { name: "Stop reading" }).click();
  await expect(second).toHaveAttribute("aria-pressed", "false");
  await expect(reading).toHaveText("nothing");
  expect(await page.evaluate(() => window.__soundBench!.speech)).toEqual(["The harbour opens at nine. Bring the list.", "The orchard is on the north side."]);

  // A clip that is still loading when Stop is pressed never sounds, even when it arrives. Its text was never read before.
  const before = await plays(page);
  const third = page.getByRole("button", { name: "Read a new answer" });
  await page.evaluate(() => (window.__soundBench!.holdSpeech = true));
  await third.click();
  await expect(third).toHaveAttribute("aria-pressed", "true");
  await expect(reading).toHaveText("third");
  await page.getByRole("button", { name: "Stop reading" }).click();
  await expect(third).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => window.__soundBench!.release("speech"));
  await page.waitForTimeout(400);
  expect(await plays(page)).toBe(before);
  await expect(reading).toHaveText("nothing");
  // What was read before is kept: reading the first answer again loads nothing new.
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__soundBench!.speech.filter((text) => text.startsWith("The harbour")).length)).toBe(1);
});

test("an icon-only clip is named by markup that keeps its language; right to left turns the row and not the clock", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, PIECES);
  const foreign = page.getByRole("button", { name: "Listen to مرحبا" });
  await expect(foreign).toHaveCount(1);
  await expect(foreign).not.toHaveAttribute("aria-label", /.*/);
  await expect(foreign.locator('bdi[lang="ar"][dir="rtl"]')).toHaveText("مرحبا");
  const hidden = await foreign.locator(".fui-sr-only").boundingBox();
  expect(hidden!.width).toBeLessThanOrEqual(1);
  const panel = page.getByRole("group", { name: "المسجّل" }).first();
  await expect(panel.locator(".fui-recorder-clock")).toHaveText("٠:٠٧ / ٠:٤٠");
  const geometry = await panel.evaluate((node) => {
    const box = (selector: string) => node.querySelector(selector)!.getBoundingClientRect();
    const keys = [...node.querySelectorAll(".fui-recorder-actions button")].map((key) => key.getBoundingClientRect());
    const fill = box(".fui-recorder-meter-fill");
    const track = box(".fui-recorder-meter");
    return {
      dotRightOfClock: box(".fui-recorder-dot").left > box(".fui-recorder-clock").right,
      stopRightOfFallback: keys[0]!.left > keys[1]!.right,
      fillFromRight: Math.abs(fill.right - track.right) < 1 && fill.left > track.left + 1,
      clockDirection: getComputedStyle(node.querySelector(".fui-recorder-clock")!).direction,
      inside: keys.every((key) => key.left >= node.getBoundingClientRect().left - 0.5 && key.right <= node.getBoundingClientRect().right + 0.5),
    };
  });
  expect(geometry).toEqual({ dotRightOfClock: true, stopRightOfFallback: true, fillFromRight: true, clockDirection: "ltr", inside: true });
});

test("forced colors: a playing clip and the slow speed carry a Highlight bar; the dot and the level are Highlight on a drawn track", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, PIECES);
  const result = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.forcedColorAdjust = "none";
    document.body.append(probe);
    const system = (name: string) => {
      probe.style.backgroundColor = name;
      return getComputedStyle(probe).backgroundColor;
    };
    const colours = { Highlight: system("Highlight"), CanvasText: system("CanvasText") };
    probe.remove();
    const playing = document.querySelector('.fui-clip-button[aria-pressed="true"]')!;
    const idle = document.querySelector('.fui-clip-button[aria-pressed="false"]')!;
    const slow = document.querySelector('.fui-speed-toggle.fui-button[aria-pressed="true"]')!;
    const bar = (node: Element) => getComputedStyle(node, "::after");
    return {
      colours,
      playingEdge: getComputedStyle(playing).borderTopColor,
      playingBar: [bar(playing).content, bar(playing).backgroundColor, bar(playing).height],
      idleBar: bar(idle).content,
      slowBar: [bar(slow).content, bar(slow).backgroundColor],
      dot: getComputedStyle(document.querySelector(".fui-recorder-dot")!).backgroundColor,
      fill: getComputedStyle(document.querySelector(".fui-recorder-meter-fill")!).backgroundColor,
      track: getComputedStyle(document.querySelector(".fui-recorder-meter")!).outlineColor,
    };
  });
  const { Highlight, CanvasText } = result.colours;
  expect(result.playingEdge).toBe(Highlight);
  expect(result.playingBar).toEqual(['""', Highlight, "3px"]);
  expect(result.idleBar).toBe("none");
  expect(result.slowBar).toEqual(['""', Highlight]);
  expect(result.dot).toBe(Highlight);
  expect(result.fill).toBe(Highlight);
  expect(result.track).toBe(CanvasText);
});

test("under reduced motion nothing in the bench moves, and the level steps without a transition", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, PIECES);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
  expect(await page.locator(".fui-recorder-meter-fill").first().evaluate((fill) => getComputedStyle(fill).transitionDuration)).toBe("0s");
});

test.describe("under a finger", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("every key of a clip and of the recorder is at least 44 px, and the retry word has a 44 px target", async ({ page }) => {
    await open(page, PIECES);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const sizes = await page.evaluate(() => {
      const boxes = (selector: string) => [...document.querySelectorAll(selector)].map((node) => node.getBoundingClientRect());
      const retry = document.querySelector(".fui-clip-note-retry")!;
      const target = getComputedStyle(retry, "::after");
      return {
        clips: Math.min(...boxes(".fui-clip-button").map((box) => box.height)),
        icons: Math.min(...boxes(".fui-clip-button[data-icon-only]").map((box) => Math.min(box.width, box.height))),
        speed: Math.min(...boxes(".fui-speed-toggle.fui-button").map((box) => box.height)),
        recorder: Math.min(...boxes(".fui-recorder-actions .fui-button").map((box) => box.height)),
        retryLine: retry.getBoundingClientRect().height,
        retryTarget: Number.parseFloat(target.height),
      };
    });
    expect(sizes.clips).toBeGreaterThanOrEqual(44);
    expect(sizes.icons).toBeGreaterThanOrEqual(44);
    expect(sizes.speed).toBeGreaterThanOrEqual(44);
    expect(sizes.recorder).toBeGreaterThanOrEqual(44);
    expect(sizes.retryLine).toBeLessThan(24);
    expect(sizes.retryTarget).toBeGreaterThanOrEqual(44);
  });
});

test.describe("dictation on the house recorder", () => {
  const VOICE = "/iframe.html?id=tests-ai-chat--voice-input&viewMode=story";

  test("the dictation key records, hands the take over and goes back to rest", async ({ page }) => {
    // The page's getUserMedia answers with an oscillator: the key is the real one, the microphone is not.
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const destination = context.createMediaStreamDestination();
          oscillator.connect(destination);
          oscillator.start();
          await context.resume().catch(() => undefined);
          return destination.stream;
        },
      });
    });
    await page.goto(`${VOICE}&globals=theme:light`);
    const key = page.locator(".fui-voice-button").last();
    await expect(key).toHaveAttribute("data-status", "idle");
    await expect(key).toHaveAttribute("aria-label", "Dictate");
    await key.click();
    await expect(key).toHaveAttribute("data-status", "recording");
    await expect(key).toHaveAttribute("aria-pressed", "true");
    await expect(key).toHaveAttribute("aria-label", "Stop recording");
    await expect(key.locator(".fui-voice-timer")).toHaveText(/^0:0\d$/);
    await expect.poll(() => key.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue("--fui-voice-level")))).toBeGreaterThan(0);
    await key.click();
    // The story's transcriber answers at once: the key passes through "transcribing" and rests, still in place and focused.
    await expect(key).toHaveAttribute("data-status", "idle");
    await expect(key).toHaveAttribute("aria-pressed", "false");
    await expect(key).toBeFocused();
  });

  test("a blocked microphone is said in the key's own words", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => Promise.reject(new DOMException("refused", "NotAllowedError")),
      });
    });
    await page.goto(`${VOICE}&globals=theme:light`);
    const key = page.locator(".fui-voice-button").last();
    await key.click();
    await expect(key).toHaveAttribute("data-status", "error");
    // The key's own polite region says it in full; the states row of the story shows the short sentence beside it.
    await expect(page.getByText("Microphone access is blocked. Allow it in your browser's site settings to dictate.", { exact: true })).toHaveAttribute("role", "status");
    await expect(key).toBeFocused();
  });
});
